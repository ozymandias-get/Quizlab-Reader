<p align="center">
  <img src="resources/icon.png" alt="Quizlab Reader Logo" width="180" height="180">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Electron-40.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.0.10-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<h1 align="center">Quizlab Reader</h1>

<p align="center">
  <strong>A premium, split-screen desktop application for seamless PDF reading and AI-powered research.</strong>
</p>

<p align="center">
  <a href="./README_TR.md">🇹🇷 Türkçe</a>
</p>

---

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/main-chatgpt.png" alt="Main Interface with ChatGPT" width="100%">
  <br><em>Split-screen interface with PDF viewer and ChatGPT integration</em>
</p>

<p align="center">
  <img src="docs/screenshots/main-deepseek.png" alt="Main Interface with DeepSeek" width="100%">
  <br><em>PDF reading with DeepSeek AI assistant and Send to AI feature</em>
</p>

<p align="center">
  <img src="docs/screenshots/main-deepseek-2.png" alt="DeepSeek Deep Thinking" width="100%">
  <br><em>DeepSeek with Deep Thinking and Web Search capabilities</em>
</p>

<p align="center">
  <img src="docs/screenshots/settings-models.png" alt="Settings - AI Models" width="100%">
  <br><em>Modern settings panel with AI model configuration</em>
</p>

---

## 🎯 Overview

**Quizlab Reader** is a state-of-the-art desktop application designed for students, researchers, and power users. It offers a fluid, glassmorphism-inspired interface where you can read PDF documents and interact with various AI platforms simultaneously. With intelligent automation and deep integration, it turns your study sessions into an efficient AI-augmented experience.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📄 **Advanced PDF Viewer** | High-performance rendering powered by PDF.js with smooth scrolling, zoom controls, text selection, and page navigation. |
| 🤖 **Multi-AI Ecosystem** | Native support for **ChatGPT, Claude, DeepSeek, Qwen** and ability to add custom AI platforms. |
| ⚡ **Send to AI** | Select text or capture screenshots from PDFs and instantly send them to your active AI with one click. |
| 🎨 **Premium Aesthetic** | Stunning glassmorphism UI with dynamic animated blob backgrounds, blur effects, and fluid transitions. |
| 📁 **Smart File Explorer** | Integrated library management for your PDFs with drag-and-drop support and folder organization. |
| 📸 **Screenshot Tool** | Capture specific areas of PDF pages and send them directly to vision-capable AIs for analysis. |
| 🌐 **Multi-Language Support** | Fully localized interface in **English** and **Turkish**. |
| ⚙️ **Deep Customization** | Comprehensive settings for appearance, AI models, CSS selectors, and interface preferences. |
| 🔄 **Auto Updates** | Built-in auto-updater with GitHub Releases integration for seamless updates. |
| 🔒 **Privacy Focused** | All AI interactions happen in embedded webviews - your API keys stay with the AI providers. |

---

## 🆕 What's New in v3.0.0

### 💎 Premium UI Overhaul
- **Animated Backgrounds:** High-performance canvas-based animated blobs with organic motion
- **Glassmorphism Design:** Every component refined with blur effects and sleek borders
- **Vertical Settings Navigation:** Organized settings menu with separate tabs (Models, Selectors, Appearance, Language, About)

### 🤖 Enhanced AI Integration
- **Expanded Platforms:** Support for **ChatGPT, Claude, DeepSeek, Qwen** with custom AI addition
- **Smart Automation:** Robust script injection engine for "Send to AI" functionality
- **Session Persistence:** Reliable cookie management to keep you logged in across restarts

### 🛠️ Core Improvements
- **Modular Architecture:** Clean separation between backend (Electron) and frontend (React)
- **Performance Optimized:** Reduced CPU usage for animations and webview lifecycle
- **Ad Blocker:** Built-in ad blocking for cleaner AI chat experiences

---

## 📁 Project Structure

```
quizlab-reader/
├── backend/                         # Electron Backend
│   ├── main/                        # Main Process
│   │   ├── index.js                 # App entry & lifecycle management
│   │   ├── windowManager.js         # Window & webview coordination
│   │   ├── ipcHandlers.js           # Main/Renderer IPC communication
│   │   ├── pdfProtocol.js           # Custom protocol for local PDF loading
│   │   ├── adblocker.js             # Ad blocking for embedded browsers
│   │   ├── updater.js               # Auto-update functionality
│   │   └── constants.js             # Backend constants
│   │
│   ├── preload/                     # Secure Bridge
│   │   └── index.js                 # Exposed APIs for renderer process
│   │
│   └── modules/                     # Backend Modules
│       ├── ai/                      # AI Integration
│       │   ├── aiManager.js         # AI platform orchestration
│       │   └── platforms/           # Platform-specific configs
│       │       ├── chatgpt.js       # ChatGPT selectors & scripts
│       │       ├── claude.js        # Claude selectors & scripts
│       │       ├── deepseek.js      # DeepSeek selectors & scripts
│       │       └── qwen.js          # Qwen selectors & scripts
│       │
│       └── automation/              # Automation Engine
│           ├── automationScripts.js # Text/image injection scripts
│           ├── userElementPicker.js # Custom element picker tool
│           └── picker/              # Element picker utilities
│
├── frontend/                        # React Frontend
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # React entry point
│   ├── index.html                   # HTML template
│   │
│   ├── components/                  # UI Components
│   │   ├── AiWebview.jsx            # Managed AI browser webview
│   │   ├── AppBackground.jsx        # Animated blob background
│   │   ├── LeftPanel.jsx            # Left sidebar container
│   │   ├── ScreenshotTool.jsx       # PDF screenshot capture
│   │   ├── SettingsModal.jsx        # Main settings modal
│   │   ├── FloatingButton.jsx       # Floating action button
│   │   ├── UpdateBanner.jsx         # Update notification banner
│   │   ├── UsageAssistant.jsx       # Onboarding assistant
│   │   ├── ErrorBoundary.jsx        # Error handling wrapper
│   │   ├── AestheticLoader.jsx      # Loading animations
│   │   ├── Icons.jsx                # SVG icon components
│   │   │
│   │   ├── pdf/                     # PDF Viewer Components
│   │   │   ├── PdfViewer.jsx        # Main PDF viewer
│   │   │   ├── PdfToolbar.jsx       # PDF toolbar controls
│   │   │   ├── PdfSearchBar.jsx     # PDF text search
│   │   │   ├── PdfPlaceholder.jsx   # Empty state placeholder
│   │   │   └── hooks/               # PDF-specific hooks
│   │   │
│   │   ├── settings/                # Settings Tabs
│   │   │   ├── ModelsTab.jsx        # AI models configuration
│   │   │   ├── SelectorsTab.jsx     # CSS selector customization
│   │   │   ├── AppearanceTab.jsx    # Theme & visual settings
│   │   │   ├── LanguageTab.jsx      # Language selection
│   │   │   ├── AboutTab.jsx         # App info & credits
│   │   │   └── ColorPicker.jsx      # Color selection utility
│   │   │
│   │   ├── BottomBar/               # Bottom Toolbar
│   │   ├── FileExplorer/            # File browser sidebar
│   │   ├── SplashScreen/            # App loading screen
│   │   ├── Toast/                   # Toast notifications
│   │   └── tutorial/                # Tutorial components
│   │
│   ├── context/                     # React Context Providers
│   │   ├── AiContext.jsx            # AI state management
│   │   ├── FileContext.jsx          # File/PDF state management
│   │   ├── AppearanceContext.jsx    # Theme & appearance state
│   │   ├── LanguageContext.jsx      # i18n state management
│   │   ├── ToastContext.jsx         # Toast notification state
│   │   ├── UpdateContext.jsx        # Auto-update state
│   │   ├── NavigationContext.jsx    # Navigation state
│   │   └── AppToolContext.jsx       # App tools state
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useAiSender.js           # AI message sending logic
│   │   ├── useElementPicker.js      # Element picker functionality
│   │   ├── useLocalStorage.js       # Persistent storage hook
│   │   ├── usePanelResize.js        # Resizable panel logic
│   │   ├── useScreenshot.js         # Screenshot capture hook
│   │   ├── useSettings.js           # Settings management hook
│   │   └── webview/                 # Webview-specific hooks
│   │
│   ├── locales/                     # Translations
│   │   ├── en.json                  # English translations
│   │   └── tr.json                  # Turkish translations
│   │
│   ├── constants/                   # Frontend Constants
│   │   ├── appConstants.js          # App-wide constants
│   │   ├── appearance.js            # Appearance options
│   │   ├── storageKeys.js           # LocalStorage keys
│   │   └── translations.js          # Translation utilities
│   │
│   ├── styles/                      # CSS Stylesheets
│   │   └── [14 CSS files]           # Component & global styles
│   │
│   └── utils/                       # Utility Functions
│       └── [4 utility files]        # Helper functions
│
├── resources/                       # App Resources
│   └── icon.png                     # Application icon
│
├── installer/                       # Installer Configuration
│   └── installer.nsh                # NSIS installer script
│
├── docs/                            # Documentation
│   └── screenshots/                 # App screenshots
│
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Vite build configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
└── vitest.config.js                 # Test configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher

### Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/ozymandias-get/Quizlab-Reader.git
   cd Quizlab-Reader
   npm install
   ```

2. **Launch Dev Server**
   ```bash
   npm run dev
   ```
   This starts both Vite dev server and Electron in development mode.

3. **Build Installer**
   ```bash
   npm run build:win    # Windows (NSIS installer)
   npm run build:mac    # macOS (DMG)
   npm run build:linux  # Linux (AppImage, deb)
   ```

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | Electron 40.0.0 |
| **Frontend** | React 18.2 with Vite 5.0 |
| **Styling** | Tailwind CSS, Styled Components, Vanilla CSS |
| **Animations** | Framer Motion |
| **PDF Engine** | PDF.js 3.11 with React-PDF-Viewer |
| **Build Tool** | Electron Builder 24.13 |
| **Ad Blocking** | @ghostery/adblocker-electron |

---

## 🤖 Supported AI Platforms

| Platform | Features |
|----------|----------|
| **ChatGPT** | Full support with text & image sending |
| **Claude** | Full support with text & image sending |
| **DeepSeek** | Deep Thinking, Web Search, text & image |
| **Qwen** | Full support with text & image sending |
| **Custom** | Add any AI platform with custom CSS selectors |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + O` | Open PDF file |
| `Ctrl + F` | Search in PDF |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Reset zoom |
| `Esc` | Close modals/overlays |

---

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm run build:win` | Build Windows installer (NSIS) |
| `npm run build:mac` | Build macOS installer (DMG) |
| `npm run build:linux` | Build Linux packages (AppImage, deb) |
| `npm run preview` | Preview production build |

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

## 💖 Acknowledgments

- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://react.dev/) - User interface library
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering engine
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ozymandias-get">ozymandias-get</a>
</p>
