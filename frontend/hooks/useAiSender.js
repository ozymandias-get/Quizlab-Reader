import { useCallback } from 'react'
import { Logger } from '../utils/logger'
import { safeWebviewPaste } from '../utils/webviewUtils'

const CLIPBOARD_WAIT_DELAY = 800

export function useAiSender(webviewRef, currentAI, autoSend, aiRegistry) {


    const sendTextToAI = useCallback(async (text) => {
        const webview = webviewRef.current
        if (!webview || !text) return { success: false, error: 'invalid_input' }
        if (!aiRegistry) return { success: false, error: 'registry_not_loaded' }

        const API = window.electronAPI
        if (!API) return { success: false, error: 'api_unavailable' }

        try {
            // Get base config from registry
            let aiConfig = aiRegistry[currentAI]
            if (!aiConfig) return { success: false, error: 'config_not_found' }

            if (typeof webview.getURL !== 'function') {
                return { success: false, error: 'webview_api_missing' }
            }

            const currentUrl = webview.getURL()

            // Check for custom selectors saved by element picker
            try {
                const hostname = new URL(currentUrl).hostname
                const customConfig = await API?.getAiConfig?.(hostname)
                if (customConfig && customConfig.input && customConfig.button) {
                    // Merge custom selectors with base config
                    aiConfig = {
                        ...aiConfig,
                        input: customConfig.input,
                        button: customConfig.button,
                        submitMode: customConfig.submitMode || aiConfig.submitMode || 'click'
                    }
                    Logger.info('[useAiSender] Using custom selectors for:', hostname)
                }
            } catch (e) {
                // Ignore errors, use default config
            }

            if (aiConfig.domainRegex) {
                const regex = new RegExp(aiConfig.domainRegex)
                if (!regex.test(currentUrl)) {
                    return { success: false, error: 'wrong_url', actualUrl: currentUrl }
                }
            }

            const script = await API.automation.generateAutoSendScript(aiConfig, text, autoSend)
            if (!script) return { success: false, error: 'script_generation_failed' }

            const result = await webview.executeJavaScript(script)
            if (!result || result.success === false) {
                return { success: false, error: result?.error || 'script_failed' }
            }

            return { success: true, mode: result.mode || aiConfig.submitMode }
        } catch (error) {
            Logger.error('[useAiSender] Hata:', error)
            return { success: false, error: error.message || 'unknown_error' }
        }
    }, [currentAI, autoSend, webviewRef, aiRegistry])

    const sendImageToAI = useCallback(async (imageDataUrl) => {
        const webview = webviewRef.current
        if (!webview || !imageDataUrl) return { success: false, error: 'invalid_input' }
        if (!aiRegistry) return { success: false, error: 'registry_not_loaded' }

        // Sanity check for data URL
        if (!imageDataUrl.startsWith('data:image/')) {
            Logger.error('[useAiSender] Geçersiz resim formatı')
            return { success: false, error: 'invalid_image_format' }
        }

        const API = window.electronAPI
        if (!API) return { success: false, error: 'api_unavailable' }

        try {
            // Get base config from registry
            let aiConfig = aiRegistry[currentAI]
            if (!aiConfig) return { success: false, error: 'config_not_found' }

            // Check for custom selectors saved by element picker
            if (typeof webview.getURL === 'function') {
                try {
                    const currentUrl = webview.getURL()
                    const hostname = new URL(currentUrl).hostname
                    const customConfig = await API?.getAiConfig?.(hostname)
                    if (customConfig && customConfig.input && customConfig.button) {
                        // Merge custom selectors with base config
                        aiConfig = {
                            ...aiConfig,
                            input: customConfig.input,
                            button: customConfig.button,
                            submitMode: customConfig.submitMode || aiConfig.submitMode || 'click'
                        }
                    }
                } catch (e) {
                    Logger.debug('[useAiSender] Custom config loading skipped')
                }
            }

            const copied = await API?.copyImageToClipboard(imageDataUrl)
            if (!copied) return { success: false, error: 'clipboard_failed' }

            // Focus webview
            try {
                webview.focus()
            } catch (e) { }

            await new Promise(r => setTimeout(r, 100))

            const focusScript = await API.automation.generateFocusScript(aiConfig)
            if (!focusScript) return { success: false, error: 'focus_script_failed' }

            const focused = await webview.executeJavaScript(focusScript)
            if (!focused) return { success: false, error: 'focus_failed' }

            // Wait for clipboard to be ready in the remote process
            await new Promise(r => setTimeout(r, CLIPBOARD_WAIT_DELAY))

            let pasteSuccess = false

            // Try native paste if available (Electron 22+)
            if (webview.pasteNative && typeof webview.getWebContentsId === 'function') {
                try {
                    const wcId = webview.getWebContentsId()
                    if (wcId) pasteSuccess = await webview.pasteNative(wcId)
                } catch (err) {
                    pasteSuccess = false
                }
            }

            // Fallback to JS paste
            if (!pasteSuccess) {
                pasteSuccess = safeWebviewPaste(webview)
            }

            if (!pasteSuccess) return { success: false, error: 'paste_failed' }

            if (autoSend) {
                // Wait for image to upload/process in the AI interface
                let waitTime = aiConfig.imageWaitTime || 1000
                await new Promise(r => setTimeout(r, waitTime))

                const clickScript = await API.automation.generateClickSendScript(aiConfig)
                if (!clickScript) return { success: false, error: 'click_script_failed' }

                const clickResult = await webview.executeJavaScript(clickScript)
                if (!clickResult) return { success: false, error: 'autosend_failed_draft_saved' }

                return { success: true, mode: 'auto_click' }
            }

            return { success: true, mode: 'paste_only' }
        } catch (error) {
            Logger.error('[useAiSender] Resim gönderme hatası:', error)
            return { success: false, error: error.message || 'unknown_error' }
        }
    }, [currentAI, webviewRef, autoSend, aiRegistry])

    return { sendTextToAI, sendImageToAI }
}
