/**
 * IPC Handlers Module
 * Genel IPC handler'ları - ekran yakalama, clipboard, external link, context menu
 */
const { ipcMain, BrowserWindow, shell, Menu, MenuItem } = require('electron')

/**
 * Genel IPC handler'ları kaydet
 */
function registerGeneralHandlers() {
    // Ekran görüntüsü yakalama
    ipcMain.handle('capture-screen', async (event) => {
        try {
            const mainWindow = BrowserWindow.fromWebContents(event.sender)
            if (!mainWindow) return null

            const image = await mainWindow.webContents.capturePage()
            return image.toDataURL()
        } catch (error) {
            console.error('Ekran yakalama hatası:', error)
            return null
        }
    })

    // Görüntüyü clipboard'a kopyala
    ipcMain.handle('copy-image-to-clipboard', async (event, dataUrl) => {
        try {
            // DataURL string kontrolü
            if (!dataUrl || typeof dataUrl !== 'string') {
                console.warn('[Clipboard] Geçersiz dataUrl:', typeof dataUrl)
                return false
            }

            // DataURL format kontrolü (data:image/... ile başlamalı)
            if (!dataUrl.startsWith('data:image/')) {
                console.warn('[Clipboard] Geçersiz dataURL formatı')
                return false
            }

            const { clipboard, nativeImage } = require('electron')

            const image = nativeImage.createFromDataURL(dataUrl)

            if (image.isEmpty()) {
                console.error('[Clipboard] Görüntü boş!')
                return false
            }

            clipboard.writeImage(image)
            return true
        } catch (error) {
            console.error('[Clipboard] Görüntü kopyalama hatası:', error)
            return false
        }
    })

    // Harici linki sistem tarayıcısında aç
    ipcMain.handle('open-external', async (event, url) => {
        try {
            // URL string kontrolü
            if (!url || typeof url !== 'string') {
                console.warn('[OpenExternal] Geçersiz URL:', url)
                return false
            }

            const parsedUrl = new URL(url)
            if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                await shell.openExternal(url)
                return true
            }
            return false
        } catch (error) {
            console.error('Harici bağlantı açma hatası:', error)
            return false
        }
    })

    // PDF Context Menu
    ipcMain.on('show-pdf-context-menu', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) {
            console.warn('[ContextMenu] Window bulunamadı veya yok edildi')
            return
        }

        const menu = new Menu()

        // 📄 Tam Sayfa SS
        menu.append(new MenuItem({
            label: '📄 Tam Sayfa Görüntüsü Al',
            accelerator: 'F',
            click: () => {
                if (win && !win.isDestroyed()) {
                    win.webContents.send('trigger-screenshot', 'full-page')
                }
            }
        }))

        // 📸 Alan Seçerek SS
        menu.append(new MenuItem({
            label: '📸 Alan Seçerek Görüntü Al',
            accelerator: 'C',
            click: () => {
                if (win && !win.isDestroyed()) {
                    win.webContents.send('trigger-screenshot', 'crop')
                }
            }
        }))

        menu.append(new MenuItem({ type: 'separator' }))

        // 🔍 Zoom kontrolleri
        menu.append(new MenuItem({
            label: '🔍 Yakınlaştır',
            accelerator: 'CmdOrCtrl+Plus',
            role: 'zoomIn'
        }))

        menu.append(new MenuItem({
            label: '🔍 Uzaklaştır',
            accelerator: 'CmdOrCtrl+-',
            role: 'zoomOut'
        }))

        menu.append(new MenuItem({
            label: '↺ Zoom Sıfırla',
            accelerator: 'CmdOrCtrl+0',
            role: 'resetZoom'
        }))

        menu.append(new MenuItem({ type: 'separator' }))

        // 🔄 Yenile
        menu.append(new MenuItem({
            label: '🔄 Sayfayı Yenile',
            accelerator: 'CmdOrCtrl+R',
            role: 'reload'
        }))

        menu.popup({ window: win })
    })
}

module.exports = {
    registerGeneralHandlers
}
