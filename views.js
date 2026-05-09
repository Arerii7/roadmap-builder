function renderNodeList() {
  const container = document.getElementById('nodeList');
  const filtered = getFilteredNodes();

  container.innerHTML = filtered.map(node => `
    <div class="node-item ${state.selectedNodeId === node.id ? 'selected' : ''}" data-id="${node.id}">
      <div class="node-item-title">${escapeHtml(node.title)}</div>
      <div class="node-item-meta">
        <span class="status-badge status-${node.status}">${getStatusLabel(node.status)}</span>
        <span class="priority-badge priority-${node.priority}"></span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.node-item').forEach(item => {
    item.addEventListener('click', () => selectNode(item.dataset.id));
  });
}

function renderPropertiesPanel() {
  const container = document.getElementById('nodeProperties');
  if (!state.selectedNodeId) {
    container.innerHTML = '<p class="empty-state">Выберите задачу</p>';
    return;
  }

  const node = getNodeById(state.selectedNodeId);
  if (!node) return;

  const progressPercent = node.progress || 0;

  container.innerHTML = `
    <div class="property-row">
      <span class="property-label">Название</span>
      <span class="property-value">${escapeHtml(node.title)}</span>
    </div>
    <div class="property-row">
      <span class="property-label">Статус</span>
      <span class="property-value">${getStatusLabel(node.status)}</span>
    </div>
    <div class="property-row">
      <span class="property-label">Приоритет</span>
      <span class="property-value">${getPriorityLabel(node.priority)}</span>
    </div>
    <div class="property-row">
      <span class="property-label">Прогресс</span>
      <span class="property-value">${progressPercent}%</span>
    </div>
    <div class="property-row">
      <span class="property-label">Дата начала</span>
      <span class="property-value">${node.startDate || '-'}</span>
    </div>
    <div class="property-row">
      <span class="property-label">Дата окончания</span>
      <span class="property-value ${isOverdue(node) ? 'overdue' : isDueSoon(node) ? 'due-soon' : ''}">${node.endDate || '-'}${isOverdue(node) ? ' (просрочено)' : isDueSoon(node) ? ' (скоро)' : ''}</span>
    </div>
    ${node.tags.length ? `<div class="property-row">
      <span class="property-label">Теги</span>
      <span class="property-value">${node.tags.join(', ')}</span>
    </div>` : ''}
    ${node.parentId ? `<div class="property-row">
      <span class="property-label">Родитель</span>
      <span class="property-value">${escapeHtml(getNodeById(node.parentId)?.title || '-')}</span>
    </div>` : ''}
    ${node.subtasks.length ? `<div class="property-row">
      <span class="property-label">Подзадачи</span>
      <span class="property-value">${node.subtasks.filter(s => s.done).length}/${node.subtasks.length}</span>
    </div>` : ''}
  `;
}

function renderTreeView() {
  const container = document.getElementById('nodesContainer');
  const connectionsLayer = document.getElementById('connectionsLayer');

  container.innerHTML = '';
  connectionsLayer.innerHTML = '';

  const rootNodes = getFilteredNodes().filter(n => !n.parentId);

  rootNodes.forEach(node => {
    renderNodeElement(node);
  });

  const children = getFilteredNodes().filter(n => n.parentId);
  children.forEach(node => {
    if (!getNodeById(node.parentId)) {
      renderNodeElement(node);
    }
  });

  renderConnections();
  setupDragAndDrop();
}

function renderNodeElement(node) {
  const container = document.getElementById('nodesContainer');
  const existing = container.querySelector(`[data-id="${node.id}"]`);
  if (existing) return;

  const el = document.createElement('div');
  el.className = `node ${state.selectedNodeId === node.id ? 'selected' : ''}${isOverdue(node) ? ' overdue' : ''}`;
  el.dataset.id = node.id;
  el.style.left = node.x + 'px';
  el.style.top = node.y + 'px';

  const progressPercent = node.progress || 0;
  const tagsHtml = node.tags && node.tags.length
    ? `<div class="node-tags">${node.tags.map(t => `<span class="node-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  el.innerHTML = `
    <div class="node-title">${escapeHtml(node.title)}</div>
    <div class="node-description">${escapeHtml(node.description || '')}</div>
    <div class="node-meta">
      <span class="status-badge status-${node.status}">${getStatusLabel(node.status)}</span>
      <span class="node-dates ${isOverdue(node) ? 'overdue' : isDueSoon(node) ? 'due-soon' : ''}">${node.startDate ? formatDate(node.startDate) : ''}${node.endDate ? ' - ' + formatDate(node.endDate) : ''}</span>
    </div>
    ${progressPercent > 0 ? `<div class="node-progress"><div class="node-progress-fill" style="width: ${progressPercent}%"></div></div>` : ''}
    ${tagsHtml}
    <div class="node-actions">
      <button class="node-action-btn edit" data-action="edit">Изменить</button>
      <button class="node-action-btn delete" data-action="delete">Удалить</button>
    </div>
  `;

  el.addEventListener('click', (e) => {
    if (!e.target.classList.contains('node-action-btn')) {
      selectNode(node.id);
    }
  });

  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, node.id);
  });

  el.querySelectorAll('.node-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.action === 'edit') {
        openEditModal(node.id);
      } else if (btn.dataset.action === 'delete') {
        deleteNode(node.id);
      }
    });
  });

  container.appendChild(el);
}

function renderConnections() {
  const svg = document.getElementById('connectionsLayer');
  let paths = '';

  state.nodes.forEach(node => {
    if (node.parentId) {
      const parent = getNodeById(node.parentId);
      if (parent) {
        const startX = parent.x + 200;
        const startY = parent.y + 40;
        const endX = node.x;
        const endY = node.y + 40;
        const midX = startX + (endX - startX) / 2;

        paths += `<path class="connection-line" d="M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}"/>`;
      }
    }
  });

  svg.innerHTML = paths;
}

function renderTimelineView() {
  const container = document.getElementById('nodesContainer');
  const connectionsLayer = document.getElementById('connectionsLayer');
  connectionsLayer.innerHTML = '';

  const sortedNodes = [...getFilteredNodes()].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate) - new Date(b.startDate);
  });

  container.innerHTML = '<div class="timeline-view">';

  const nodesWithDates = sortedNodes.filter(n => n.startDate || n.endDate);

  if (nodesWithDates.length === 0) {
    container.innerHTML += '<p class="empty-state">Нет задач с датами для отображения на timeline</p>';
  } else {
    nodesWithDates.forEach(node => {
      const start = node.startDate ? new Date(node.startDate) : null;
      const end = node.endDate ? new Date(node.endDate) : new Date();

      container.innerHTML += `
        <div class="timeline-row" data-id="${node.id}">
          <div class="timeline-node">
            <strong>${escapeHtml(node.title)}</strong>
            <div class="node-meta">
              <span class="status-badge status-${node.status}">${getStatusLabel(node.status)}</span>
            </div>
          </div>
          <div class="timeline-bar">
            ${start ? `<div class="timeline-bar-fill" style="left: ${getTimelinePosition(start)}%; width: ${getTimelineWidth(start, end)}%"></div>` : ''}
          </div>
        </div>
      `;
    });
  }

  container.innerHTML += '</div>';

  container.querySelectorAll('.timeline-row').forEach(row => {
    row.addEventListener('click', () => selectNode(row.dataset.id));
  });
}

function getTimelinePosition(date) {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  const start = threeMonthsAgo.getTime();
  const end = now.getTime();
  const current = date.getTime();

  return Math.max(0, Math.min(100, ((current - start) / (end - start)) * 100));
}

function getTimelineWidth(start, end) {
  if (!start || !end) return 10;
  const diff = end - start;
  const minWidth = 5;
  return Math.max(minWidth, Math.min(50, diff / (1000 * 60 * 60 * 24 * 7)));
}

function renderKanbanView() {
  const container = document.getElementById('nodesContainer');
  const connectionsLayer = document.getElementById('connectionsLayer');
  connectionsLayer.innerHTML = '';

  const columns = [
    { id: 'idea', title: 'Идеи' },
    { id: 'in_progress', title: 'В работе' },
    { id: 'done', title: 'Готово' }
  ];

  container.innerHTML = '<div class="kanban-view">';

  columns.forEach(col => {
    const nodesInCol = getFilteredNodes().filter(n => n.status === col.id);

    container.innerHTML += `
      <div class="kanban-column" data-status="${col.id}">
        <div class="kanban-column-header">
          <span class="kanban-column-title">${col.title}</span>
          <span class="kanban-count">${nodesInCol.length}</span>
        </div>
        <div class="kanban-cards" data-status="${col.id}">
          ${nodesInCol.map(node => `
            <div class="kanban-card" data-id="${node.id}" draggable="true">
              <div class="node-title">${escapeHtml(node.title)}</div>
              ${node.description ? `<div class="node-description">${escapeHtml(node.description)}</div>` : ''}
              <div class="node-meta">
                <span class="priority-badge priority-${node.priority}"></span>
                ${node.endDate ? `<span class="node-dates ${isOverdue(node) ? 'overdue' : ''}">${formatDate(node.endDate)}</span>` : ''}
              </div>
              ${node.progress ? `<div class="node-progress"><div class="node-progress-fill" style="width: ${node.progress}%"></div></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML += '</div>';

  setupKanbanDragDrop();
  container.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('click', () => selectNode(card.dataset.id));
  });
}

function setupKanbanDragDrop() {
  const container = document.getElementById('nodesContainer');
  
  container.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('drag-over');
      });
    });
  });

  container.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });
    
    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });
    
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const nodeId = e.dataTransfer.getData('text/plain');
      const newStatus = column.dataset.status;
      const node = getNodeById(nodeId);
      if (node && node.status !== newStatus) {
        updateNode(nodeId, { status: newStatus });
      }
    });
  });

  container.querySelectorAll('.kanban-cards').forEach(cardsContainer => {
    cardsContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    cardsContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const nodeId = e.dataTransfer.getData('text/plain');
      const newStatus = cardsContainer.dataset.status;
      const node = getNodeById(nodeId);
      if (node && node.status !== newStatus) {
        updateNode(nodeId, { status: newStatus });
      }
    });
  });
}

function renderGanttView() {
  const container = document.getElementById('nodesContainer');
  const connectionsLayer = document.getElementById('connectionsLayer');
  connectionsLayer.innerHTML = '';

  const nodesWithDates = getFilteredNodes().filter(n => n.startDate || n.endDate);

  if (nodesWithDates.length === 0) {
    container.innerHTML = '<p class="empty-state">Нет задач с датами для отображения на диаграмме Ганта</p>';
    return;
  }

  const sortedNodes = [...nodesWithDates].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate) - new Date(b.startDate);
  });

  let minDate = new Date();
  let maxDate = new Date();
  sortedNodes.forEach(node => {
    if (node.startDate) {
      const d = new Date(node.startDate);
      if (d < minDate) minDate = d;
    }
    if (node.endDate) {
      const d = new Date(node.endDate);
      if (d > maxDate) maxDate = d;
    }
  });
  maxDate.setMonth(maxDate.getMonth() + 1);

  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

  container.innerHTML = '<div class="gantt-view">';
  container.innerHTML += '<div class="gantt-header"><div class="gantt-header-cell">Задача</div><div class="gantt-header-cell" style="flex:1">Временная шкала</div></div>';

  sortedNodes.forEach(node => {
    const start = node.startDate ? new Date(node.startDate) : minDate;
    const end = node.endDate ? new Date(node.endDate) : new Date();

    const startOffset = Math.max(0, (start - minDate) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, (duration / totalDays) * 100);

    container.innerHTML += `
      <div class="gantt-row" data-id="${node.id}">
        <div class="gantt-label">${escapeHtml(node.title)}</div>
        <div class="gantt-timeline">
          <div class="gantt-bar ${isOverdue(node) ? 'overdue' : ''}" style="left: ${left}%; width: ${width}%"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML += '</div>';

  container.querySelectorAll('.gantt-row').forEach(row => {
    row.addEventListener('click', () => selectNode(row.dataset.id));
  });
}

function renderCalendarView() {
  const container = document.getElementById('nodesContainer');
  const connectionsLayer = document.getElementById('connectionsLayer');
  connectionsLayer.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() || 7;
  const daysInMonth = lastDay.getDate();

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  container.innerHTML = `<div class="calendar-view">
    <h3 style="margin-bottom: 20px; text-align: center;">${monthNames[month]} ${year}</h3>
    <div class="calendar-grid">
      ${weekDays.map(d => `<div class="calendar-header">${d}</div>`).join('')}`;

  let day = 1;
  let nextMonthDay = 1;
  for (let i = 0; i < 42; i++) {
    const isOtherMonth = i < startDay - 1 || day > daysInMonth;
    const isToday = !isOtherMonth && day === now.getDate();

    let displayDay = day;
    let dateStr = '';

    if (i < startDay - 1) {
      const prevMonthDays = new Date(year, month, 0).getDate();
      displayDay = prevMonthDays - (startDay - 2 - i);
      dateStr = `${year}-${String(month).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
    } else if (day > daysInMonth) {
      displayDay = nextMonthDay++;
      dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
    } else {
      dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      day++;
    }

    const eventsOnDay = getFilteredNodes().filter(n => {
      if (!n.startDate && !n.endDate) return false;
      const start = n.startDate ? n.startDate.substring(0, 10) : '';
      const end = n.endDate ? n.endDate.substring(0, 10) : '';
      return dateStr >= start && dateStr <= end;
    });

    container.innerHTML += `
      <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div class="calendar-date">${displayDay}</div>
        ${eventsOnDay.slice(0, 3).map(e => `
          <div class="calendar-event ${isOverdue(e) ? 'overdue' : ''}" data-id="${e.id}">${escapeHtml(e.title)}</div>
        `).join('')}
        ${eventsOnDay.length > 3 ? `<div class="calendar-event">+${eventsOnDay.length - 3} ещё</div>` : ''}
      </div>
    `;
  }

  container.innerHTML += '</div></div>';

  container.querySelectorAll('.calendar-event').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectNode(el.dataset.id);
    });
  });

  container.querySelectorAll('.calendar-day').forEach(el => {
    el.addEventListener('click', () => {
      const date = el.dataset.date;
      openAddModal();
      document.getElementById('nodeStartDate').value = date;
    });
  });
}

function renderSubtasks(subtasks) {
  const container = document.getElementById('subtasksList');
  container.innerHTML = subtasks.map((st, i) => `
    <div class="subtask-item">
      <input type="checkbox" ${st.done ? 'checked' : ''} onchange="toggleSubtask(${i})">
      <input type="text" value="${escapeHtml(st.text)}" onchange="updateSubtaskText(${i}, this.value)">
      <span class="subtask-delete" onclick="deleteSubtask(${i})">×</span>
    </div>
  `).join('');
}

function renderAll() {
  renderNodeList();
  renderPropertiesPanel();

  switch (state.currentView) {
    case 'tree':
      renderTreeView();
      break;
    case 'timeline':
      renderTimelineView();
      break;
    case 'kanban':
      renderKanbanView();
      break;
    case 'gantt':
      renderGanttView();
      break;
    case 'calendar':
      renderCalendarView();
      break;
  }

  renderTodos();
}