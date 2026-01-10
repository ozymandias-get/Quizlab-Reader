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
    ipcMain.handle('capture-screen', async () => {
        try {
            const mainWindow = BrowserWindow.getAllWindows()[0]
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

        const menu = new Menu()

        // 📄 Tam Sayfa SS
        menu.append(new MenuItem({
            label: '📄 Tam Sayfa Görüntüsü Al',
            accelerator: 'F',
            click: () => {
                win.webContents.send('trigger-screenshot', 'full-page')
            }
        }))

        // 📸 Alan Seçerek SS
        menu.append(new MenuItem({
            label: '📸 Alan Seçerek Görüntü Al',
            accelerator: 'C',
            click: () => {
                win.webContents.send('trigger-screenshot', 'crop')
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
