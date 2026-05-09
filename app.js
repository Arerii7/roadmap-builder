const STORAGE_KEY = 'roadmap-data';
const TODO_STORAGE_KEY = 'roadmap-todos';
const ZOOM_STORAGE_KEY = 'roadmap-zoom';
const THEME_KEY = 'roadmap-theme';
const LANG_KEY = 'roadmap-lang';
const UI_STATE_KEY = 'roadmap-ui-state';
const PROJECTS_KEY = 'roadmap-projects';
const ACTIVE_PROJECT_KEY = 'roadmap-active-project';

const translations = {
  ru: {
    add: 'Добавить',
    search: 'Поиск задач...',
    allStatuses: 'Все статусы',
    allPriorities: 'Все приоритеты',
    idea: 'Идея',
    inProgress: 'В работе',
    done: 'Готово',
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    selectTask: 'Выберите задачу',
    title: 'Название',
    description: 'Описание',
    status: 'Статус',
    priority: 'Приоритет',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    progress: 'Прогресс (%)',
    tags: 'Теги',
    parent: 'Родительская задача',
    subtasks: 'Подзадачи',
    addSubtask: 'Добавить подзадачу',
    cancel: 'Отмена',
    save: 'Сохранить',
    newTask: 'Новая задача',
    editTask: 'Изменить задачу',
    noParent: 'Нет',
    todoTitle: 'TODO',
    noTasks: 'Нет задач',
    overdue: 'просрочено',
    dueSoon: 'скоро',
    tree: 'Древовидный',
    timeline: 'Временная шкала',
    kanban: 'Канбан',
    gantt: 'Ганта',
    calendar: 'Календарь',
    noDates: 'Нет задач с датами',
    projects: 'Проекты',
    newProject: 'Новый проект',
    editProject: 'Редактировать проект',
    deleteProject: 'Удалить проект',
    projectName: 'Название проекта',
    deleteProjectConfirm: 'Удалить проект? Все задачи будут удалены.',
    cannotDeleteLast: 'Нельзя удалить последний проект',
    defaultProject: 'Мой проект'
  },
  en: {
    add: 'Add',
    search: 'Search tasks...',
    allStatuses: 'All statuses',
    allPriorities: 'All priorities',
    idea: 'Idea',
    inProgress: 'In Progress',
    done: 'Done',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    selectTask: 'Select a task',
    title: 'Title',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    startDate: 'Start Date',
    endDate: 'End Date',
    progress: 'Progress (%)',
    tags: 'Tags',
    parent: 'Parent Task',
    subtasks: 'Subtasks',
    addSubtask: 'Add Subtask',
    cancel: 'Cancel',
    save: 'Save',
    newTask: 'New Task',
    editTask: 'Edit Task',
    noParent: 'None',
    todoTitle: 'TODO',
    noTasks: 'No tasks',
    overdue: 'overdue',
    dueSoon: 'soon',
    tree: 'Tree',
    timeline: 'Timeline',
    kanban: 'Kanban',
    gantt: 'Gantt',
    calendar: 'Calendar',
    noDates: 'No tasks with dates',
    projects: 'Projects',
    newProject: 'New Project',
    editProject: 'Edit Project',
    deleteProject: 'Delete Project',
    projectName: 'Project Name',
    deleteProjectConfirm: 'Delete project? All tasks will be removed.',
    cannotDeleteLast: 'Cannot delete the last project',
    defaultProject: 'My Project'
  }
};

const state = {
  nodes: [],
  todos: [],
  projects: [],
  activeProjectId: null,
  selectedNodeId: null,
  currentView: 'tree',
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  zoom: 1,
  pan: { x: 0, y: 0 },
  isPanning: false,
  panStart: { x: 0, y: 0 },
  filters: {
    search: '',
    status: '',
    priority: ''
  },
  history: [],
  historyIndex: -1,
  contextMenuNode: null,
  theme: 'dark',
  lang: 'ru',
  todoPanelVisible: false
};

let saveTimeout = null;

function t(key) {
  return translations[state.lang][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  renderAll();
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  state.theme = saved || 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
}

function saveTheme() {
  localStorage.setItem(THEME_KEY, state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  saveTheme();
}

function loadLang() {
  const saved = localStorage.getItem(LANG_KEY);
  state.lang = saved || 'ru';
  document.getElementById('langSelect').value = state.lang;
}

function saveLang() {
  localStorage.setItem(LANG_KEY, state.lang);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createProject(name) {
  return {
    id: generateId(),
    name: name || t('defaultProject'),
    created: new Date().toISOString(),
    nodes: [],
    todos: []
  };
}

function loadProjects() {
  const data = localStorage.getItem(PROJECTS_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      state.projects = parsed.projects || [];
      state.activeProjectId = parsed.activeProjectId || null;
    } catch (e) {
      state.projects = [];
    }
  }

  if (state.projects.length === 0) {
    const legacyNodes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const legacyTodos = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || '[]');
    const project = createProject(t('defaultProject'));
    project.nodes = legacyNodes;
    project.todos = legacyTodos;
    state.projects = [project];
    state.activeProjectId = project.id;
    saveProjects();
  }

  if (!state.activeProjectId || !state.projects.find(p => p.id === state.activeProjectId)) {
    state.activeProjectId = state.projects[0]?.id || null;
  }

  loadActiveProject();
}

function saveProjects() {
  const data = {
    projects: state.projects,
    activeProjectId: state.activeProjectId
  };
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getActiveProject()?.nodes || []));
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(getActiveProject()?.todos || []));
}

function getActiveProject() {
  return state.projects.find(p => p.id === state.activeProjectId);
}

function loadActiveProject() {
  const project = getActiveProject();
  if (project) {
    state.nodes = project.nodes || [];
    state.todos = project.todos || [];
  } else {
    state.nodes = [];
    state.todos = [];
  }
  renderAll();
}

function switchProject(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (project) {
    state.activeProjectId = projectId;
    loadActiveProject();
    saveProjects();
    updateProjectDropdown();
  }
}

function addProject(name) {
  const project = createProject(name);
  state.projects.push(project);
  state.activeProjectId = project.id;
  loadActiveProject();
  saveProjects();
  updateProjectDropdown();
  return project;
}

function updateProject(projectId, name) {
  const project = state.projects.find(p => p.id === projectId);
  if (project) {
    project.name = name;
    saveProjects();
    updateProjectDropdown();
  }
}

function deleteProject(projectId) {
  if (state.projects.length <= 1) {
    alert(t('cannotDeleteLast'));
    return;
  }
  if (!confirm(t('deleteProjectConfirm'))) return;
  state.projects = state.projects.filter(p => p.id !== projectId);
  if (state.activeProjectId === projectId) {
    state.activeProjectId = state.projects[0]?.id || null;
  }
  loadActiveProject();
  saveProjects();
  updateProjectDropdown();
}

function initProjectDropdown() {
  const dropdownBtn = document.getElementById('projectDropdownBtn');
  const dropdown = document.getElementById('projectDropdown');

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  document.getElementById('newProjectBtn').addEventListener('click', () => {
    const name = prompt(t('projectName'), '');
    if (name && name.trim()) {
      addProject(name.trim());
    }
  });

  updateProjectDropdown();
}

function updateProjectDropdown() {
  const projectList = document.getElementById('projectList');
  const currentProjectName = document.getElementById('currentProjectName');
  const activeProject = getActiveProject();

  currentProjectName.textContent = activeProject?.name || t('defaultProject');

  projectList.innerHTML = state.projects.map(project => `
    <div class="project-item ${project.id === state.activeProjectId ? 'active' : ''}"
         data-id="${project.id}">
      <span class="project-item-name">${escapeHtml(project.name)}</span>
      <div class="project-item-actions">
        <button class="project-item-btn" title="${t('editProject')}"
                onclick="event.stopPropagation(); editProject('${project.id}')">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="project-item-btn" title="${t('deleteProject')}"
                onclick="event.stopPropagation(); deleteProject('${project.id}')">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  projectList.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', () => {
      switchProject(item.dataset.id);
    });
  });
}

function editProject(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  const name = prompt(t('projectName'), project.name);
  if (name && name.trim()) {
    updateProject(projectId, name.trim());
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      state.nodes = JSON.parse(data);
      state.nodes.forEach(node => {
        if (!node.subtasks) node.subtasks = [];
        if (!node.tags) node.tags = [];
        if (node.progress === undefined) node.progress = 0;
      });
    } catch (e) {
      state.nodes = [];
    }
  }

  const todoData = localStorage.getItem(TODO_STORAGE_KEY);
  if (todoData) {
    try {
      state.todos = JSON.parse(todoData);
    } catch (e) {
      state.todos = [];
    }
  }

  const zoomData = localStorage.getItem(ZOOM_STORAGE_KEY);
  if (zoomData) {
    try {
      const zoom = JSON.parse(zoomData);
      state.zoom = zoom.zoom || 1;
      state.pan = zoom.pan || { x: 0, y: 0 };
    } catch (e) {}
  }
}

function saveToStorage() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const project = getActiveProject();
    if (project) {
      project.nodes = state.nodes;
      saveProjects();
    }
  }, 100);
}

function saveTodos() {
  const project = getActiveProject();
  if (project) {
    project.todos = state.todos;
    saveProjects();
  }
}

function saveZoom() {
  localStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify({ zoom: state.zoom, pan: state.pan }));
}

function pushHistory() {
  const snapshot = JSON.stringify(state.nodes);
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }
  if (state.history.length > 50) {
    state.history.shift();
  }
  state.history.push(snapshot);
  state.historyIndex = state.history.length - 1;
  updateUndoRedoButtons();
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.nodes = JSON.parse(state.history[state.historyIndex]);
    saveToStorage();
    renderAll();
    updateUndoRedoButtons();
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.nodes = JSON.parse(state.history[state.historyIndex]);
    saveToStorage();
    renderAll();
    updateUndoRedoButtons();
  }
}

function updateUndoRedoButtons() {
  document.getElementById('undoBtn').disabled = state.historyIndex <= 0;
  document.getElementById('redoBtn').disabled = state.historyIndex >= state.history.length - 1;
}

function getNodeById(id) {
  return state.nodes.find(n => n.id === id);
}

function getChildNodes(parentId) {
  return state.nodes.filter(n => n.parentId === parentId);
}

function getParentOptions(excludeId = null) {
  return state.nodes.filter(n => n.id !== excludeId);
}

function createNode(data) {
  pushHistory();
  const node = {
    id: generateId(),
    title: data.title || 'Новая задача',
    description: data.description || '',
    status: data.status || 'idea',
    priority: data.priority || 'medium',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    parentId: data.parentId || '',
    progress: data.progress || 0,
    tags: data.tags || [],
    subtasks: data.subtasks || [],
    x: data.x || 100 + Math.random() * 200,
    y: data.y || 100 + Math.random() * 200,
    createdAt: Date.now()
  };
  state.nodes.push(node);
  saveToStorage();
  renderAll();
  return node;
}

function updateNode(id, data) {
  pushHistory();
  const node = getNodeById(id);
  if (node) {
    Object.assign(node, data);
    saveToStorage();
    renderAll();
  }
}

function deleteNode(id) {
  pushHistory();
  const childNodes = getChildNodes(id);
  childNodes.forEach(child => deleteNode(child.id));
  state.nodes = state.nodes.filter(n => n.id !== id);
  if (state.selectedNodeId === id) {
    state.selectedNodeId = null;
  }
  saveToStorage();
  renderAll();
}

function duplicateNode(id) {
  const node = getNodeById(id);
  if (node) {
    createNode({
      ...node,
      id: undefined,
      title: node.title + ' (копия)',
      x: node.x + 30,
      y: node.y + 30
    });
  }
}

function selectNode(id) {
  state.selectedNodeId = id;
  renderAll();
}

function isOverdue(node) {
  if (!node.endDate || node.status === 'done') return false;
  return new Date(node.endDate) < new Date();
}

function isDueSoon(node) {
  if (!node.endDate || node.status === 'done') return false;
  const endDate = new Date(node.endDate);
  const now = new Date();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return endDate - now < threeDays && endDate >= now;
}

function getFilteredNodes() {
  return state.nodes.filter(node => {
    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      if (!node.title.toLowerCase().includes(search) &&
          !node.description.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (state.filters.status && node.status !== state.filters.status) {
      return false;
    }
    if (state.filters.priority && node.priority !== state.filters.priority) {
      return false;
    }
    return true;
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

function setupDragAndDrop() {
  const nodes = document.querySelectorAll('.node');

  nodes.forEach(node => {
    node.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('node-action-btn')) return;

      const nodeId = node.dataset.id;
      const nodeData = getNodeById(nodeId);

      state.dragging = {
        id: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        nodeX: nodeData.x,
        nodeY: nodeData.y
      };

      node.classList.add('dragging');

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
    });
  });
}

function handleDrag(e) {
  if (!state.dragging) return;

  const dx = e.clientX - state.dragging.startX;
  const dy = e.clientY - state.dragging.startY;

  const node = getNodeById(state.dragging.id);
  if (node) {
    node.x = state.dragging.nodeX + dx;
    node.y = state.dragging.nodeY + dy;

    const el = document.querySelector(`.node[data-id="${state.dragging.id}"]`);
    if (el) {
      el.style.left = node.x + 'px';
      el.style.top = node.y + 'px';
    }

    renderConnections();
  }
}

function stopDrag() {
  if (state.dragging) {
    const node = document.querySelector(`.node[data-id="${state.dragging.id}"]`);
    if (node) node.classList.remove('dragging');

    saveToStorage();
    state.dragging = null;
  }

  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
}

function setupZoomPan() {
  const container = document.getElementById('canvasContainer');

  container.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(state.zoom + delta);
    }
  });

  container.addEventListener('mousedown', (e) => {
    if (e.target === container || e.target.id === 'canvas' || e.target.classList.contains('nodes-container')) {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        state.isPanning = true;
        state.panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
        container.style.cursor = 'grabbing';
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (state.isPanning) {
      state.pan.x = e.clientX - state.panStart.x;
      state.pan.y = e.clientY - state.panStart.y;
      updateCanvasTransform();
    }
  });

  document.addEventListener('mouseup', () => {
    if (state.isPanning) {
      state.isPanning = false;
      document.getElementById('canvasContainer').style.cursor = 'grab';
      saveZoom();
    }
  });

  updateCanvasTransform();
}

function setZoom(value) {
  state.zoom = Math.max(0.25, Math.min(2, value));
  updateCanvasTransform();
  saveZoom();
}

function updateCanvasTransform() {
  const canvas = document.getElementById('canvas');
  canvas.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = t('newTask');
  document.getElementById('nodeForm').reset();
  document.getElementById('nodeId').value = '';
  document.getElementById('progressValue').textContent = '0%';
  document.getElementById('subtasksList').innerHTML = '';
  populateParentSelect();
  document.getElementById('modal').classList.remove('hidden');
}

function openEditModal(id) {
  const node = getNodeById(id);
  if (!node) return;

  document.getElementById('modalTitle').textContent = t('editTask');
  document.getElementById('nodeId').value = node.id;
  document.getElementById('nodeTitle').value = node.title;
  document.getElementById('nodeDescription').value = node.description;
  document.getElementById('nodeStatus').value = node.status;
  document.getElementById('nodePriority').value = node.priority;
  document.getElementById('nodeStartDate').value = node.startDate || '';
  document.getElementById('nodeEndDate').value = node.endDate || '';
  document.getElementById('nodeProgress').value = node.progress || 0;
  document.getElementById('progressValue').textContent = (node.progress || 0) + '%';
  document.getElementById('nodeTags').value = (node.tags || []).join(', ');
  populateParentSelect(id);
  document.getElementById('nodeParent').value = node.parentId || '';

  renderSubtasks(node.subtasks || []);

  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  state.contextMenuNode = null;
}

function populateParentSelect(excludeId = null) {
  const select = document.getElementById('nodeParent');
  const options = getParentOptions(excludeId);

  select.innerHTML = `<option value="">${t('noParent')}</option>` + options.map(n =>
    `<option value="${n.id}">${escapeHtml(n.title)}</option>`
  ).join('');
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

function toggleSubtask(index) {
  const nodeId = document.getElementById('nodeId').value;
  const node = getNodeById(nodeId);
  if (node && node.subtasks) {
    node.subtasks[index].done = !node.subtasks[index].done;
  }
}

function updateSubtaskText(index, text) {
  const nodeId = document.getElementById('nodeId').value;
  const node = getNodeById(nodeId);
  if (node && node.subtasks) {
    node.subtasks[index].text = text;
  }
}

function deleteSubtask(index) {
  const nodeId = document.getElementById('nodeId').value;
  const node = getNodeById(nodeId);
  if (node && node.subtasks) {
    node.subtasks.splice(index, 1);
    renderSubtasks(node.subtasks);
  }
}

function addSubtask() {
  const nodeId = document.getElementById('nodeId').value;
  if (!nodeId) return;

  let node = getNodeById(nodeId);
  if (!node) {
    node = { subtasks: [] };
  }
  if (!node.subtasks) node.subtasks = [];
  node.subtasks.push({ text: 'Новая подзадача', done: false });
  renderSubtasks(node.subtasks);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('nodeId').value;
  const tagsInput = document.getElementById('nodeTags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  const nodeId = document.getElementById('nodeId').value;
  let subtasks = [];
  if (nodeId) {
    const node = getNodeById(nodeId);
    if (node) subtasks = node.subtasks || [];
  }

  const data = {
    title: document.getElementById('nodeTitle').value,
    description: document.getElementById('nodeDescription').value,
    status: document.getElementById('nodeStatus').value,
    priority: document.getElementById('nodePriority').value,
    startDate: document.getElementById('nodeStartDate').value,
    endDate: document.getElementById('nodeEndDate').value,
    parentId: document.getElementById('nodeParent').value,
    progress: parseInt(document.getElementById('nodeProgress').value) || 0,
    tags: tags,
    subtasks: subtasks
  };

  if (id) {
    updateNode(id, data);
  } else {
    createNode(data);
  }

  closeModal();
}

function switchView(view) {
  state.currentView = view;

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  renderAll();
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

function exportJson() {
  const data = JSON.stringify(state.nodes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roadmap.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        pushHistory();
        state.nodes = data;
        state.nodes.forEach(node => {
          if (!node.subtasks) node.subtasks = [];
          if (!node.tags) node.tags = [];
          if (node.progress === undefined) node.progress = 0;
        });
        saveToStorage();
        renderAll();
      }
    } catch (err) {
      alert('Ошибка при чтении файла');
    }
  };
  reader.readAsText(file);
}

async function exportPng() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const nodesContainer = document.getElementById('nodesContainer');
  const nodes = state.nodes;

  if (nodes.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + 200);
    maxY = Math.max(maxY, node.y + 100);
  });

  const padding = 40;
  canvas.width = maxX - minX + padding * 2;
  canvas.height = maxY - minY + padding * 2;

  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  nodes.forEach(node => {
    const x = node.x - minX + padding;
    const y = node.y - minY + padding;

    ctx.fillStyle = '#1e1e3a';
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, 200, 80, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e8e8e8';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(node.title.substring(0, 25), x + 16, y + 30);

    ctx.fillStyle = '#a0a0a0';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    const desc = (node.description || '').substring(0, 30);
    ctx.fillText(desc, x + 16, y + 50);

    ctx.fillStyle = node.status === 'done' ? '#4ade80' : node.status === 'in_progress' ? '#4a9eff' : '#fbbf24';
    ctx.fillRect(x + 16, y + 62, 60, 12);
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.fillText(getStatusLabel(node.status), x + 20, y + 71);
  });

  nodes.forEach(node => {
    if (node.parentId) {
      const parent = getNodeById(node.parentId);
      if (parent) {
        const x1 = parent.x - minX + padding + 200;
        const y1 = parent.y - minY + padding + 40;
        const x2 = node.x - minX + padding;
        const y2 = node.y - minY + padding + 40;

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const midX = x1 + (x2 - x1) / 2;
        ctx.bezierCurveTo(midX, y1, midX, y2, x2, y2);
        ctx.stroke();
      }
    }
  });

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roadmap.png';
  a.click();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getStatusLabel(status) {
  const map = { idea: 'idea', in_progress: 'inProgress', done: 'done' };
  return t(map[status]) || status;
}

function getPriorityLabel(priority) {
  return t(priority) || priority;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function showContextMenu(x, y, nodeId) {
  state.contextMenuNode = nodeId;
  const menu = document.getElementById('contextMenu');
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');
}

function hideContextMenu() {
  document.getElementById('contextMenu').classList.add('hidden');
  state.contextMenuNode = null;
}

function handleContextMenuAction(action) {
  const nodeId = state.contextMenuNode;
  if (!nodeId) return;

  switch (action) {
    case 'edit':
      openEditModal(nodeId);
      break;
    case 'duplicate':
      duplicateNode(nodeId);
      break;
    case 'addChild':
      const parent = getNodeById(nodeId);
      if (parent) {
        openAddModal();
        document.getElementById('nodeParent').value = nodeId;
      }
      break;
    case 'delete':
      deleteNode(nodeId);
      break;
  }

  hideContextMenu();
}

function renderTodos() {
  const container = document.getElementById('todoList');

  if (state.todos.length === 0) {
    container.innerHTML = '<p class="empty-state">Нет задач</p>';
    return;
  }

  container.innerHTML = state.todos.map((todo, i) => `
    <div class="todo-item ${todo.done ? 'completed' : ''}" data-index="${i}">
      <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${i})">
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <span class="todo-delete" onclick="deleteTodo(${i})">×</span>
    </div>
  `).join('');
}

function toggleTodo(index) {
  state.todos[index].done = !state.todos[index].done;
  saveTodos();
  renderTodos();
}

function deleteTodo(index) {
  state.todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (text) {
    state.todos.push({ text: text, done: false });
    saveTodos();
    input.value = '';
    document.getElementById('todoInputRow').style.display = 'none';
    renderTodos();
  }
}

function toggleTodoPanel() {
  const panel = document.getElementById('todoPanel');
  state.todoPanelVisible = !state.todoPanelVisible;
  panel.classList.toggle('hidden', !state.todoPanelVisible);
  saveUIState();
}

function saveUIState() {
  localStorage.setItem(UI_STATE_KEY, JSON.stringify({ todoPanelVisible: state.todoPanelVisible }));
}

function loadUIState() {
  const saved = localStorage.getItem(UI_STATE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.todoPanelVisible = data.todoPanelVisible || false;
      if (!state.todoPanelVisible) {
        document.getElementById('todoPanel').classList.add('hidden');
      }
    } catch (e) {}
  }
}

function handleKeyboard(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selectedNodeId) {
      deleteNode(state.selectedNodeId);
    }
  }

  if (e.key === 'Escape') {
    closeModal();
    hideContextMenu();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    exportJson();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    redo();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openAddModal();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadLang();
  loadUIState();
  loadProjects();
  loadZoom();
  pushHistory();
  applyTranslations();
  initProjectDropdown();

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('langSelect').addEventListener('change', (e) => {
    state.lang = e.target.value;
    saveLang();
    applyTranslations();
  });

  document.getElementById('addNodeBtn').addEventListener('click', openAddModal);
  document.getElementById('cancelNodeBtn').addEventListener('click', closeModal);
  document.getElementById('nodeForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('exportPngBtn').addEventListener('click', exportPng);

  document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });

  document.getElementById('importFileInput').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importJson(e.target.files[0]);
      e.target.value = '';
    }
  });

  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });

  document.getElementById('nodeProgress').addEventListener('input', (e) => {
    document.getElementById('progressValue').textContent = e.target.value + '%';
  });

  document.getElementById('addSubtaskBtn').addEventListener('click', addSubtask);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderAll();
  });

  document.getElementById('filterStatus').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderAll();
  });

  document.getElementById('filterPriority').addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    renderAll();
  });

  document.getElementById('zoomIn').addEventListener('click', () => setZoom(state.zoom + 0.1));
  document.getElementById('zoomOut').addEventListener('click', () => setZoom(state.zoom - 0.1));
  document.getElementById('zoomReset').addEventListener('click', () => {
    state.zoom = 1;
    state.pan = { x: 0, y: 0 };
    updateCanvasTransform();
    saveZoom();
  });

  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);

  document.getElementById('toggleTodoPanel').addEventListener('click', toggleTodoPanel);

  document.getElementById('addTodoBtn').addEventListener('click', () => {
    document.getElementById('todoInputRow').style.display = 'flex';
    document.getElementById('todoInput').focus();
  });

  document.getElementById('todoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  document.getElementById('todoInput').addEventListener('blur', () => {
    if (!document.getElementById('todoInput').value) {
      document.getElementById('todoInputRow').style.display = 'none';
    }
  });

  document.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => handleContextMenuAction(item.dataset.action));
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
      hideContextMenu();
    }
  });

  document.addEventListener('keydown', handleKeyboard);

  setupZoomPan();
  renderAll();
  updateUndoRedoButtons();
});