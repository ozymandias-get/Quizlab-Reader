<p align="center">
  <img src="../resources/icon.png" alt="Quizlab Reader Logo" width="180" height="180">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.0.10-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<h1 align="center">Quizlab 阅读器</h1>

<p align="center">
  <strong>一款现代化的分屏 Electron 应用程序，将 PDF 阅读与 AI 助手功能完美结合</strong>
</p>

<p align="center">
  <a href="../README.md">🇬🇧 English</a> •
  <a href="../README_TR.md">🇹🇷 Türkçe</a> •
  <a href="./README_HI.md">🇮🇳 हिन्दी</a> •
  <a href="./README_ES.md">🇪🇸 Español</a> •
  <a href="./README_AR.md">🇸🇦 العربية</a>
</p>

---

## 🎯 概述

**Quizlab Reader** 是一款专为学生和研究人员设计的强大桌面应用程序，旨在提升阅读和学习体验。它提供无缝的分屏界面，您可以在一侧查看 PDF 文档，同时在另一侧与 AI 助手（ChatGPT 或 Gemini）进行交互。

### ✨ 主要功能

| 功能 | 描述 |
|------|------|
| 📄 **PDF 查看器** | 功能齐全的 PDF 查看器，支持缩放、导航和文本选择 |
| 🤖 **AI 集成** | 内置 ChatGPT 和 Google Gemini 支持 |
| ✂️ **文本选择** | 从 PDF 中选择文本，一键发送到 AI |
| 📸 **截图工具** | 捕获 PDF 的任意区域并发送到 AI 进行分析 |
| 🔄 **自动发送模式** | 自动将选中的文本发送到 AI |
| 📐 **可调整面板** | 拖动调整面板大小，按您的喜好定制 |
| 💾 **持久设置** | 您的偏好设置会在会话之间保存 |
| 🎨 **现代界面** | 流畅动画的毛玻璃效果设计 |
| 🔄 **自动更新** | 内置更新系统，始终保持最新版本 |

---

## 🚀 开始使用

### 系统要求

- **Node.js** 18.x 或更高版本
- **npm** 9.x 或更高版本
- **Git**（用于克隆仓库）

### 安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/ozymandias-get/Quizlab-Reader.git
   cd Quizlab-Reader
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式运行**
   ```bash
   npm run dev
   ```

4. **生产环境构建**（可选）
   ```bash
   npm run build
   ```

---

## 📖 使用指南

### 打开 PDF

1. 点击 PDF 查看器工具栏中的 **"选择 PDF 文件"** 按钮
2. 从您的计算机中选择一个 PDF 文件
3. PDF 将显示在左侧面板中

### 向 AI 发送文本

1. 在 PDF 查看器中通过点击并拖动来 **选择文本**
2. 将出现一个浮动的 **"发送到 AI"** 按钮
3. 点击该按钮将选中的文本发送到当前的 AI

### 使用自动发送

1. 切换 PDF 工具栏中的 **自动发送** 按钮（激活时为绿色）
2. 启用后，选中的文本会自动发送到 AI

### 截图

1. 点击 PDF 工具栏中的 **📸 相机图标**
2. 在您想要捕获的区域周围绘制一个矩形
3. 截图将被发送到 AI 进行分析

### 切换 AI 平台

1. 将鼠标悬停在底部栏上以显示控制面板
2. 点击 **ChatGPT** 或 **Gemini** 切换平台
3. 您的选择将保存以供将来使用

---

## ⌨️ 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl + O` | 打开 PDF 文件 |
| `Ctrl + +` | 放大 |
| `Ctrl + -` | 缩小 |
| `Ctrl + 0` | 重置缩放 |
| `Escape` | 取消截图模式 |

---

## 🔄 更新

应用程序包含内置更新系统。检查更新：

1. 打开 **设置**（点击底部栏中的齿轮图标）
2. 转到 **关于** 选项卡
3. 点击 **检查更新**
4. 如果有更新，点击 **下载更新**
5. 下载完成后，点击 **安装并重启**

---

## 📝 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](../LICENSE) 文件。

---

<p align="center">
  用 ❤️ 为学生和研究人员制作
</p>
