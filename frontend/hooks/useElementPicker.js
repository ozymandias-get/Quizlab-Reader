import { useCallback, useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'

/**
 * Element Picker Logic as a Hook
 * Managed globally via AppContext
 */
export function useElementPicker(webviewInstance) {
    const [isPickerActive, setIsPickerActive] = useState(false)
    const { showSuccess, showError, showInfo } = useToast()
    const { t } = useLanguage()

    // Handle Picker Console Messages
    useEffect(() => {
        const webview = webviewInstance
        if (!webview || typeof webview.addEventListener !== 'function') return

        const handleConsoleMessage = async (e) => {
            if (e.message && e.message.includes('__AI')) {
                console.log('[ElementPicker] Console message received:', e.message.substring(0, 100))
            }

            if (e.message && e.message.startsWith('__AI_PICKER_RESULT__')) {
                try {
                    const jsonStr = e.message.replace('__AI_PICKER_RESULT__', '').trim()
                    const config = JSON.parse(jsonStr)

                    if (config.input && config.button) {
                        const url = webview.getURL()
                        const hostname = new URL(url).hostname

                        const saved = await window.electronAPI.saveAiConfig(hostname, config)

                        if (saved) {
                            showSuccess('sent_successfully')
                        } else {
                            showError('picker_save_failed')
                        }
                    } else {
                        showError('picker_selection_missing')
                    }
                } catch (err) {
                    console.error('[ElementPicker] Picker result error:', err)
                    showError('toast_pdf_load_error', null, { error: err.message })
                } finally {
                    setIsPickerActive(false)
                }
            }
        }

        webview.addEventListener('console-message', handleConsoleMessage)

        return () => {
            try {
                if (webview && typeof webview.removeEventListener === 'function') {
                    webview.removeEventListener('console-message', handleConsoleMessage)
                }
            } catch (e) { }
        }
    }, [webviewInstance, showSuccess, showError, isPickerActive])

    const startPicker = useCallback(async () => {
        if (!webviewInstance) {
            showError('picker_webview_not_found')
            return
        }

        try {
            const pickerTranslations = {
                picker_step: t('picker_step'),
                picker_done_btn: t('picker_done_btn'),
                picker_intro_title: t('picker_intro_title'),
                picker_intro_text: t('picker_intro_text'),
                picker_typing_title: t('picker_typing_title'),
                picker_typing_text: t('picker_typing_text'),
                picker_submit_title: t('picker_submit_title'),
                picker_submit_text: t('picker_submit_text'),
                picker_completed: t('picker_completed'),
                picker_saving: t('picker_saving'),
                picker_good_choice: t('picker_good_choice'),
                picker_maybe: t('picker_maybe'),
                picker_wrong: t('picker_wrong'),
                picker_hint_input_correct: t('picker_hint_input_correct'),
                picker_hint_submit_correct: t('picker_hint_submit_correct'),
                picker_hint_button_send: t('picker_hint_button_send'),
                picker_hint_div_input: t('picker_hint_div_input'),
                picker_hint_textarea_perfect: t('picker_hint_textarea_perfect'),
                picker_hint_generic_box: t('picker_hint_generic_box'),
                picker_hint_icon: t('picker_hint_icon'),
                picker_hint_text: t('picker_hint_text'),
                picker_hint_form: t('picker_hint_form'),
                picker_hint_clickable: t('picker_hint_clickable'),
                // Element Labels
                picker_el_input: t('picker_el_input'),
                picker_el_submit: t('picker_el_submit'),
                picker_el_input_field: t('picker_el_input_field'),
                picker_el_msg_box: t('picker_el_msg_box'),
                picker_el_button: t('picker_el_button'),
                picker_el_msg_area: t('picker_el_msg_area'),
                picker_el_clickable: t('picker_el_clickable'),
                picker_el_container: t('picker_el_container'),
                picker_el_icon: t('picker_el_icon'),
                picker_el_link: t('picker_el_link'),
                picker_el_text: t('picker_el_text'),
                picker_el_form: t('picker_el_form')
            }
            const script = await window.electronAPI.automation.generatePickerScript(pickerTranslations)
            if (!script) {
                throw new Error('Failed to generate picker script')
            }
            await webviewInstance.executeJavaScript(script)
            setIsPickerActive(true)
            showInfo('picker_started_hint')
        } catch (err) {
            console.error('Failed to start picker:', err)
            showError('picker_init_failed')
            setIsPickerActive(false)
        }
    }, [webviewInstance, showError, showInfo])

    const stopPicker = useCallback(async () => {
        if (!webviewInstance) return
        try {
            await webviewInstance.executeJavaScript('if (window._aiPickerCleanup) window._aiPickerCleanup();')
            setIsPickerActive(false)
            showInfo('picker_cancelled')
        } catch (err) {
            console.error('Failed to stop picker:', err)
            setIsPickerActive(false)
        }
    }, [webviewInstance, showInfo])

    const togglePicker = useCallback(async () => {
        if (isPickerActive) {
            await stopPicker()
        } else {
            await startPicker()
        }
    }, [isPickerActive, startPicker, stopPicker])

    return {
        isPickerActive,
        startPicker,
        stopPicker,
        togglePicker
    }
}

