<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.0.10-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<h1 align="center">📚 Quizlab Reader</h1>

<p align="center">
  <strong>A modern, split-screen Electron application that combines PDF reading with AI assistance</strong>
</p>

<p align="center">
  <a href="./README_TR.md">🇹🇷 Türkçe Dokümantasyon</a>
</p>

---

## 🎯 Overview

**Quizlab Reader** is a powerful desktop application designed for students and researchers who want to enhance their reading and study experience. It provides a seamless split-screen interface where you can view PDF documents on one side and interact with AI assistants (ChatGPT or Gemini) on the other.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📄 **PDF Viewer** | Full-featured PDF viewer with zoom, navigation, and text selection |
| 🤖 **AI Integration** | Built-in support for ChatGPT and Google Gemini |
| ✂️ **Text Selection** | Select text from PDF and send it directly to AI with one click |
| 📸 **Screenshot Tool** | Capture any area of the PDF and send it to AI for analysis |
| 🔄 **Auto-Send Mode** | Automatically send selected text to AI |
| 📐 **Resizable Panels** | Drag to resize panels according to your preference |
| 💾 **Persistent Settings** | Your preferences are saved between sessions |
| 🎨 **Modern UI** | Glassmorphism design with smooth animations |

---

## 🖼️ Screenshots

<details>
<summary>Click to view screenshots</summary>

### Main Interface
The application features a clean, modern split-screen interface with glassmorphism design elements.

### PDF Viewer
- Page navigation controls
- Zoom in/out functionality
- Text selection with floating "Send to AI" button
- Screenshot capture tool

### AI Panel
- Switch between ChatGPT and Gemini
- Seamless integration with AI platforms
- Auto-send toggle for quick interactions

</details>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ozymandias-get/Quizlab-Reader.git
   cd Quizlab-Reader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production** (optional)
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
Quizlab-Reader/
├── src/
│   ├── main/                    # Electron main process
│   │   └── index.js             # Main entry point, window management
│   │
│   ├── preload/                 # Preload scripts
│   │   └── index.js             # Secure IPC bridge
│   │
│   └── renderer/                # React application
│       ├── index.html           # HTML entry point
│       └── src/
│           ├── App.jsx          # Main application component
│           │
│           ├── components/      # React components
│           │   ├── AiWebview.jsx        # AI platform webview
│           │   ├── BottomBar.jsx        # Bottom control bar
│           │   ├── FloatingButton.jsx   # "Send to AI" floating button
│           │   ├── PdfViewer.jsx        # PDF viewer component
│           │   └── ScreenshotTool.jsx   # Screenshot capture tool
│           │
│           ├── hooks/           # Custom React hooks
│           │   ├── index.js             # Hooks barrel export
│           │   ├── useAISender.js       # AI message sending logic
│           │   ├── useLocalStorage.js   # Local storage persistence
│           │   ├── usePanelResize.js    # Panel resizing logic
│           │   └── useScreenshot.js     # Screenshot capture logic
│           │
│           ├── constants/       # Configuration constants
│           │   └── aiSites.js           # AI platforms configuration
│           │
│           └── styles/          # CSS styles
│               ├── index.css            # Main stylesheet entry
│               └── modules/             # Modular CSS files
│                   ├── _animations.css
│                   ├── _base.css
│                   ├── _buttons.css
│                   ├── _floating-bar.css
│                   ├── _glass-panel.css
│                   ├── _pdf-viewer.css
│                   ├── _resizer.css
│                   ├── _screenshot.css
│                   └── _utilities.css
│
├── package.json                 # Project dependencies and scripts
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── postcss.config.js            # PostCSS configuration
```

---

## 🛠️ Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 28.0.0 | Desktop application framework |
| **React** | 18.2.0 | UI component library |
| **Vite** | 5.0.10 | Build tool and dev server |
| **PDF.js** | 3.11.174 | PDF rendering engine |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Tailwind CSS** | Utility-first CSS framework |
| **Concurrently** | Run multiple commands |
| **Wait-on** | Wait for resources before proceeding |
| **html2canvas** | Screenshot capture |

---

## 📖 Usage Guide

### Opening a PDF

1. Click the **"PDF Dosyası Seç"** button in the PDF viewer toolbar
2. Select a PDF file from your computer
3. The PDF will be displayed in the left panel

### Sending Text to AI

1. **Select text** in the PDF viewer by clicking and dragging
2. A floating **"AI'ya Gönder"** button will appear
3. Click the button to send the selected text to the current AI

### Using Auto-Send

1. Toggle the **auto-send** button in the PDF toolbar (green when active)
2. When enabled, selected text is automatically sent to AI

### Taking Screenshots

1. Click the **📸 camera icon** in the PDF toolbar
2. Draw a rectangle around the area you want to capture
3. The screenshot will be sent to the AI for analysis

### Switching AI Platforms

1. Hover over the bottom bar to reveal the control panel
2. Click on **ChatGPT** or **Gemini** to switch platforms
3. Your selection is saved for future sessions

### Resizing Panels

1. Hover over the divider between the PDF and AI panels
2. Click and drag to resize
3. Your panel sizes are saved automatically

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + O` | Open PDF file |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Reset zoom |
| `Escape` | Cancel screenshot mode |

---

## 🔧 Configuration

### Supported AI Platforms

Currently supported AI platforms (configured in `src/renderer/src/constants/aiSites.js`):

| Platform | URL |
|----------|-----|
| ChatGPT | https://chatgpt.com |
| Gemini | https://gemini.google.com |

### Adding New AI Platforms

To add a new AI platform, edit `aiSites.js`:

```javascript
export const AI_SITES = {
    // ... existing platforms
    newPlatform: {
        url: 'https://example.com',
        name: 'example.com',
        displayName: 'New Platform',
        icon: 'newplatform'
    }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering by Mozilla
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://reactjs.org/) - UI component library
- [Vite](https://vitejs.dev/) - Next-generation build tool

---

## 📧 Contact

**Project Link:** [https://github.com/ozymandias-get/Quizlab-Reader](https://github.com/ozymandias-get/Quizlab-Reader)

---

<p align="center">
  Made with ❤️ for students and researchers
</p>
