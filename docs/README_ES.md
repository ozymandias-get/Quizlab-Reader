<p align="center">
  <img src="../resources/icon.png" alt="Quizlab Reader Logo" width="180" height="180">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.0.10-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge" alt="Licencia">
</p>

<h1 align="center">Quizlab Reader</h1>

<p align="center">
  <strong>Una aplicación Electron moderna de pantalla dividida que combina la lectura de PDF con asistencia de IA</strong>
</p>

<p align="center">
  <a href="../README.md">🇬🇧 English</a> •
  <a href="../README_TR.md">🇹🇷 Türkçe</a> •
  <a href="./README_ZH.md">🇨🇳 中文</a> •
  <a href="./README_HI.md">🇮🇳 हिन्दी</a> •
  <a href="./README_AR.md">🇸🇦 العربية</a>
</p>

---

## 🎯 Descripción General

**Quizlab Reader** es una potente aplicación de escritorio diseñada para estudiantes e investigadores que desean mejorar su experiencia de lectura y estudio. Proporciona una interfaz de pantalla dividida donde puedes ver documentos PDF en un lado e interactuar con asistentes de IA (ChatGPT o Gemini) en el otro.

### ✨ Características Principales

| Característica | Descripción |
|----------------|-------------|
| 📄 **Visor de PDF** | Visor de PDF completo con zoom, navegación y selección de texto |
| 🤖 **Integración de IA** | Soporte integrado para ChatGPT y Google Gemini |
| ✂️ **Selección de Texto** | Selecciona texto del PDF y envíalo directamente a la IA con un clic |
| 📸 **Herramienta de Captura** | Captura cualquier área del PDF y envíala a la IA para análisis |
| 🔄 **Modo de Envío Automático** | Envía automáticamente el texto seleccionado a la IA |
| 📐 **Paneles Redimensionables** | Arrastra para redimensionar los paneles según tu preferencia |
| 💾 **Configuración Persistente** | Tus preferencias se guardan entre sesiones |
| 🎨 **Interfaz Moderna** | Diseño glassmorphism con animaciones suaves |
| 🔄 **Actualizaciones Automáticas** | Sistema de actualización integrado |

---

## 🚀 Comenzando

### Requisitos Previos

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- **Git** (para clonar el repositorio)

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/ozymandias-get/Quizlab-Reader.git
   cd Quizlab-Reader
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Ejecuta en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Compila para producción** (opcional)
   ```bash
   npm run build
   ```

---

## 📖 Guía de Uso

### Abrir un PDF

1. Haz clic en el botón **"Seleccionar archivo PDF"** en la barra de herramientas
2. Selecciona un archivo PDF de tu computadora
3. El PDF se mostrará en el panel izquierdo

### Enviar Texto a la IA

1. **Selecciona texto** en el visor de PDF haciendo clic y arrastrando
2. Aparecerá un botón flotante **"Enviar a IA"**
3. Haz clic en el botón para enviar el texto seleccionado a la IA actual

### Usar el Envío Automático

1. Activa el botón de **envío automático** en la barra de herramientas (verde cuando está activo)
2. Cuando está habilitado, el texto seleccionado se envía automáticamente a la IA

### Tomar Capturas de Pantalla

1. Haz clic en el **📸 icono de cámara** en la barra de herramientas
2. Dibuja un rectángulo alrededor del área que deseas capturar
3. La captura se enviará a la IA para análisis

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + O` | Abrir archivo PDF |
| `Ctrl + +` | Acercar |
| `Ctrl + -` | Alejar |
| `Ctrl + 0` | Restablecer zoom |
| `Escape` | Cancelar modo de captura |

---

## 🔄 Actualizaciones

La aplicación incluye un sistema de actualización integrado. Para buscar actualizaciones:

1. Abre **Configuración** (haz clic en el icono de engranaje en la barra inferior)
2. Ve a la pestaña **Acerca de**
3. Haz clic en **Buscar Actualizaciones**
4. Si hay una disponible, haz clic en **Descargar Actualización**
5. Cuando se complete, haz clic en **Instalar y Reiniciar**

---

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](../LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ para estudiantes e investigadores
</p>
