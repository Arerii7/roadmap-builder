# 🗺️ Road-Map Builder

[![Deploy](https://github.com/Arerii7/roadmap-builder/actions/workflows/deploy.yml/badge.svg)](https://arerii7.github.io/roadmap-builder/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web application for visualizing roadmap projects with multiple view modes.

![Preview](screenshot.svg)

## ✨ Features

| Category | Functions |
|----------|-----------|
| **Views** | Tree • Timeline • Kanban • Gantt • Calendar |
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

### 5. PHP (built-in)

```bash
php -S localhost:8000
# Open http://localhost:8000
```

- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"



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

## 📄 License

MIT