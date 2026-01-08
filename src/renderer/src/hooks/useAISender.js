import { useCallback } from 'react'

/**
 * AI platformlarına metin ve görüntü gönderme işlemlerini yöneten hook
 * @param {Object} webviewRef - Webview için React ref
 * @param {boolean} autoSend - Otomatik gönderme ayarı
 * @returns {Object} - AI gönderme fonksiyonları
 */
export function useAISender(webviewRef, autoSend) {

  /**
   * Seçili metni AI input alanına gönder
   * @param {string} text - Gönderilecek metin
   * @returns {Promise<boolean>} - Başarılı ise true
   */
  const sendTextToAI = useCallback(async (text) => {
    if (!text || !webviewRef?.current) return false

    // JSON.stringify kullanarak güvenli kaçış - kod blokları, backtick'ler ve 
    // diğer özel karakterler otomatik olarak doğru şekilde escape edilir
    const safeText = JSON.stringify(text)

    const script = `
      (function() {
        const text = ${safeText};
        
        // AI platformlarına göre sıralanmış selector listesi
        const selectors = [
          // ChatGPT
          '#prompt-textarea',
          'div[id="prompt-textarea"]',
          
          // Gemini
          'div[contenteditable="true"][data-placeholder]',
          '.ql-editor[contenteditable="true"]',
          'rich-textarea div[contenteditable="true"]',
          
          // Genel fallback
          'div[contenteditable="true"]',
          'textarea:not([readonly]):not([disabled])',
          'input[type="text"]:not([readonly]):not([disabled])'
        ];
        
        let inputElement = null;
        
        // Önce selector listesine göre ara
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              if (rect.width > 0 && rect.height > 0 && 
                  style.display !== 'none' && 
                  style.visibility !== 'hidden' &&
                  !el.disabled &&
                  !el.readOnly) {
                inputElement = el;
                break;
              }
            }
            if (inputElement) break;
          } catch(e) {}
        }
        
        if (inputElement) {
          inputElement.focus();
          inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
            // Native value setter kullan (React/Angular için)
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 'value'
            )?.set || Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            )?.set;
            
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(inputElement, text);
            } else {
              inputElement.value = text;
            }
            
            inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          } else if (inputElement.contentEditable === 'true') {
            inputElement.textContent = text;
            inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            
            // ContentEditable için InputEvent de gönder
            const inputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: text
            });
            inputElement.dispatchEvent(inputEvent);
          }
          
          return { success: true, element: inputElement.tagName, selector: inputElement.className };
        }
        
        return { success: false, error: 'Input alanı bulunamadı' };
      })();
    `

    try {
      const result = await webviewRef.current.executeJavaScript(script)

      if (result?.success) {
        // Otomatik gönder açıksa Enter tuşuna bas
        if (autoSend) {
          await new Promise(resolve => setTimeout(resolve, 100))
          await sendMessage()
        }
        return true
      }
      return false
    } catch (error) {
      console.error('AI gönderme hatası:', error)
      return false
    }
  }, [webviewRef, autoSend])

  /**
   * Gönder butonuna tıkla veya Enter tuşu simüle et
   */
  const sendMessage = useCallback(async () => {
    if (!webviewRef?.current) return

    await webviewRef.current.executeJavaScript(`
      (function() {
        // Gönder butonunu bul ve tıkla
        const sendButtons = [
          // ChatGPT
          'button[data-testid="send-button"]',
          'button[aria-label="Send prompt"]',
          // Gemini
          'button[aria-label="Send message"]',
          'button.send-button',
          // Genel
          'button[type="submit"]'
        ];
        
        for (const selector of sendButtons) {
          const btn = document.querySelector(selector);
          if (btn && !btn.disabled) {
            btn.click();
            return { sent: true };
          }
        }
        
        // Buton bulunamazsa Enter tuşu simüle et
        const activeEl = document.activeElement;
        if (activeEl) {
          activeEl.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          }));
        }
        return { sent: true };
      })();
    `)
  }, [webviewRef])

  /**
   * Görüntüyü AI'ya gönder (clipboard üzerinden)
   * @param {string} imageData - Base64 formatında görüntü verisi
   */
  const sendImageToAI = useCallback(async (imageData) => {
    if (!webviewRef?.current || !imageData) return

    try {
      // Base64'ü blob'a çevir (CSP uyumlu yöntem)
      const base64ToBlob = (base64Data) => {
        const parts = base64Data.split(',')
        const contentType = parts[0].match(/:(.*?);/)[1]
        const raw = atob(parts[1])
        const rawLength = raw.length
        const uInt8Array = new Uint8Array(rawLength)

        for (let i = 0; i < rawLength; i++) {
          uInt8Array[i] = raw.charCodeAt(i)
        }

        return new Blob([uInt8Array], { type: contentType })
      }

      const blob = base64ToBlob(imageData)

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])

      console.log('Görüntü clipboard\'a kopyalandı')

      // AI input alanına focus ver ve otomatik CTRL+V simüle et
      const script = `
        (function() {
          // AI platformlarına göre dosya yükleme veya paste alanı bul
          const selectors = [
            // ChatGPT
            '#prompt-textarea',
            'div[id="prompt-textarea"]',
            
            // Gemini
            'div[contenteditable="true"][data-placeholder]',
            '.ql-editor[contenteditable="true"]',
            'rich-textarea div[contenteditable="true"]',
            
            // Genel fallback
            'div[contenteditable="true"]',
            'textarea:not([readonly]):not([disabled])'
          ];
          
          let inputElement = null;
          
          for (const selector of selectors) {
            try {
              const elements = document.querySelectorAll(selector);
              for (const el of elements) {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                if (rect.width > 0 && rect.height > 0 && 
                    style.display !== 'none' && 
                    style.visibility !== 'hidden') {
                  inputElement = el;
                  break;
                }
              }
              if (inputElement) break;
            } catch(e) {}
          }
          
          if (inputElement) {
            inputElement.focus();
            inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Clipboard'dan yapıştır komutu gönder
            document.execCommand('paste');
            
            return { success: true, message: 'Görüntü yapıştırıldı' };
          }
          
          return { success: false, error: 'Input alanı bulunamadı' };
        })();
      `

      await webviewRef.current.executeJavaScript(script)
    } catch (error) {
      console.error('Görüntü gönderme hatası:', error)
    }
  }, [webviewRef])

  return {
    sendTextToAI,
    sendImageToAI,
    sendMessage
  }
}
