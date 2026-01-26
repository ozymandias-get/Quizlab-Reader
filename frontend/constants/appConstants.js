export const APP_CONSTANTS = {
    // External URLs
    GITHUB_RELEASES_URL: 'https://github.com/ozymandias-get/Quizlab-Reader/releases',
    GITHUB_REPO_URL: 'https://github.com/ozymandias-get/Quizlab-Reader',

    // App Info
    APP_NAME: 'QuizLab Reader',

    // Update Check
    UPDATE_CHECK_INTERVAL: 1000 * 60 * 60 * 24, // 24 hours

    // UI Constants
    LEFT_PANEL_TABS: {
        EXPLORER: 'explorer',
        VIEWER: 'viewer'
    },

    // IPC Channels (Sync with main process constants.js)
    IPC_CHANNELS: {
        SELECT_PDF: 'select-pdf',
        GET_PDF_STREAM_URL: 'get-pdf-stream-url',
        CAPTURE_SCREEN: 'capture-screen',
        COPY_IMAGE: 'copy-image-to-clipboard',
        OPEN_EXTERNAL: 'open-external',
        SHOW_PDF_CONTEXT_MENU: 'show-pdf-context-menu',
        TRIGGER_SCREENSHOT: 'trigger-screenshot',
        CHECK_FOR_UPDATES: 'check-for-updates',
        OPEN_RELEASES: 'open-releases-page',
        GET_APP_VERSION: 'get-app-version',
        FORCE_PASTE: 'force-paste-in-webview'
    },

    SCREENSHOT_TYPES: {
        FULL: 'full-page',
        CROP: 'crop'
    }
}

export default APP_CONSTANTS
