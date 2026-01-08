import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAISender } from '../hooks/useAISender'

describe('useAISender', () => {
    let mockWebviewRef

    beforeEach(() => {
        mockWebviewRef = {
            current: {
                executeJavaScript: vi.fn()
            }
        }
    })

    describe('sendTextToAI', () => {
        it('boş metin için false döndürmeli', async () => {
            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            const success = await result.current.sendTextToAI('')
            expect(success).toBe(false)
        })

        it('null metin için false döndürmeli', async () => {
            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            const success = await result.current.sendTextToAI(null)
            expect(success).toBe(false)
        })

        it('webviewRef yoksa false döndürmeli', async () => {
            const { result } = renderHook(() => useAISender({ current: null }, false))

            const success = await result.current.sendTextToAI('test metin')
            expect(success).toBe(false)
        })

        it('normal metin için executeJavaScript çağırmalı', async () => {
            mockWebviewRef.current.executeJavaScript.mockResolvedValue({ success: true })

            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            const success = await result.current.sendTextToAI('test metin')

            expect(mockWebviewRef.current.executeJavaScript).toHaveBeenCalledTimes(1)
            expect(success).toBe(true)
        })

        it('backtick içeren metni güvenli şekilde gönderebilmeli', async () => {
            mockWebviewRef.current.executeJavaScript.mockResolvedValue({ success: true })

            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            const textWithBacktick = 'Kod: `console.log("test")`'
            const success = await result.current.sendTextToAI(textWithBacktick)

            expect(success).toBe(true)
            // Script içinde JSON.stringify kullanıldığını doğrula
            const calledScript = mockWebviewRef.current.executeJavaScript.mock.calls[0][0]
            expect(calledScript).toContain('"Kod: `console.log(\\"test\\")`"')
        })

        it('kod bloğu içeren metni güvenli şekilde gönderebilmeli', async () => {
            mockWebviewRef.current.executeJavaScript.mockResolvedValue({ success: true })

            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            const codeBlock = `\`\`\`javascript
const x = 1;
console.log(x);
\`\`\``

            const success = await result.current.sendTextToAI(codeBlock)

            expect(success).toBe(true)
        })

        it('özel karakterler içeren metni gönderebilmeli', async () => {
            mockWebviewRef.current.executeJavaScript.mockResolvedValue({ success: true })

            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            // Backslash, dolar işareti, yeni satır
            const specialText = 'Path: C:\\Users\\Test\nPrice: $100'
            const success = await result.current.sendTextToAI(specialText)

            expect(success).toBe(true)
        })

        it('hata durumunda false döndürmeli', async () => {
            mockWebviewRef.current.executeJavaScript.mockRejectedValue(new Error('Test error'))

            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            const success = await result.current.sendTextToAI('test')

            expect(success).toBe(false)
        })

        it('autoSend true iken mesaj gönderme fonksiyonunu çağırmalı', async () => {
            mockWebviewRef.current.executeJavaScript
                .mockResolvedValueOnce({ success: true }) // sendTextToAI
                .mockResolvedValueOnce({ sent: true })    // sendMessage

            const { result } = renderHook(() => useAISender(mockWebviewRef, true))

            await act(async () => {
                await result.current.sendTextToAI('test')
            })

            // İki kez çağrılmalı: biri metin için, biri Enter için
            expect(mockWebviewRef.current.executeJavaScript).toHaveBeenCalledTimes(2)
        })
    })

    describe('sendMessage', () => {
        it('webviewRef yoksa hata vermeden çalışmalı', async () => {
            const { result } = renderHook(() => useAISender({ current: null }, false))

            // Hata fırlatmamalı
            await expect(result.current.sendMessage()).resolves.toBeUndefined()
        })

        it('gönder butonunu simüle etmeli', async () => {
            mockWebviewRef.current.executeJavaScript.mockResolvedValue({ sent: true })

            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            await result.current.sendMessage()

            expect(mockWebviewRef.current.executeJavaScript).toHaveBeenCalled()
        })
    })

    describe('sendImageToAI', () => {
        it('boş imageData için çalışmamalı', async () => {
            const { result } = renderHook(() => useAISender(mockWebviewRef, false))

            await result.current.sendImageToAI(null)

            expect(mockWebviewRef.current.executeJavaScript).not.toHaveBeenCalled()
        })

        it('webviewRef yoksa çalışmamalı', async () => {
            const { result } = renderHook(() => useAISender({ current: null }, false))

            await result.current.sendImageToAI('data:image/png;base64,test')

            // Hata fırlatmadan çıkmalı
        })
    })
})
