# 🗺️ Road-Map Builder

[![Deploy](https://github.com/Arerii7/roadmap-builder/actions/workflows/deploy.yml/badge.svg)](https://arerii7.github.io/roadmap-builder/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Веб-приложение для визуализации roadmap-проектов с несколькими режимами отображения. Создавайте задачи, управляйте проектами, стройте диаграммы — всё в одном месте.

![Preview](screenshot.svg)

## ✨ Features

| Category | Functions |
|----------|-----------|
| **Views** | Tree • Timeline • Kanban • Gantt • Calendar |
| **Projects** | Multiple projects, switch, rename, delete |
| **Tasks** | Subtasks, tags, progress (0-100%), priorities |
| **Tools** | Drag-n-drop, filters, search, undo/redo |
| **Export** | JSON, PNG |

### Additional
- 🌙 Dark/Light theme
- 🌐 Russian/English language
- ⌨️ Keyboard shortcuts
- 💾 Auto-save to localStorage

## 🚀 Live Demo

👉 **https://arerii7.github.io/roadmap-builder/**

## How to Run

### 1. Open directly (simplest)

```bash
git clone https://github.com/Arerii7/roadmap-builder.git
cd roadmap-builder
# Double-click index.html or drag it into browser
```

### 2. Python server (recommended)

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

### 3. Node.js server

```bash
npx serve .
# Open http://localhost:3000
```

### 4. PHP (built-in)

```bash
php -S localhost:8000
# Open http://localhost:8000
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Del` | Delete |
| `Esc` | Close |
| `Ctrl+N` | New task |
| `Ctrl+S` | Export |
| `Ctrl+Z/Y` | Undo/Redo |
| `Ctrl+scroll` | Zoom |
| `Shift+drag` | Pan |

## 🛠 Tech Stack

Pure JS • HTML5 • CSS3 • LocalStorage

## 📋 TODO / Roadmap

- [ ] Импорт/Экспорт (CSV, Markdown)
- [ ] Плагины и система тем
- [ ] Мобильная адаптация
- [ ] PWA (офлайн-режим)
- [ ] Зависимости между задачами

## 📄 License

MIT