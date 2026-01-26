/**
 * Shared constants for the Main Process
 */
const APP_CONFIG = {
    PARTITIONS: {
        AI: 'persist:ai_session',
        PDF: 'persist:pdf_viewer'
    },
    GITHUB: {
        OWNER: 'ozymandias-get',
        REPO: 'Quizlab-Reader'
    },
    CHROME_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    WINDOW: {
        MIN_WIDTH: 1000,
        MIN_HEIGHT: 600,
        DEFAULT_WIDTH: 1400,
        DEFAULT_HEIGHT: 900
    },
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
        FORCE_PASTE: 'force-paste-in-webview',
        SAVE_AI_CONFIG: 'save-ai-config',
        GET_AI_CONFIG: 'get-ai-config',
        DELETE_AI_CONFIG: 'delete-ai-config',
        DELETE_ALL_AI_CONFIGS: 'delete-all-ai-configs',
        // AI Registry & Automation (Main Process Data)
        GET_AI_REGISTRY: 'get-ai-registry',
        GET_AUTOMATION_SCRIPTS: 'get-automation-scripts',
        ADD_CUSTOM_AI: 'add-custom-ai',
        DELETE_CUSTOM_AI: 'delete-custom-ai',
        IS_AUTH_DOMAIN: 'is-auth-domain'
    },
    SCREENSHOT_TYPES: {
        FULL: 'full-page',
        CROP: 'crop'
    }
}

module.exports = APP_CONFIG
