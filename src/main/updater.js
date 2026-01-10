/**
 * Update Checker Module (GitHub Releases)
 * 
 * OTOMATİK GÜNCELLEME YOK!
 * Sadece GitHub releases'dan versiyon kontrolü yapar.
 * Güncelleme varsa kullanıcıyı GitHub'a yönlendirir.
 * 
 * Bu yaklaşımın avantajları:
 * - electron-updater karmaşıklığı yok
 * - Code signing gerekmiyor
 * - Kullanıcı güncellemeyi manuel kontrol ediyor
 * - Daha az hata ve güvenlik riski
 */
const { app, ipcMain, shell } = require('electron')
const https = require('https')

// GitHub repository bilgileri
const GITHUB_OWNER = 'ozymandias-get'
const GITHUB_REPO = 'Quizlab-Reader'
const RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`

// Güncelleme durumu
let updateInfo = null
let isChecking = false
let lastCheckTime = 0
const CHECK_DEBOUNCE_MS = 5000 // 5 saniye içinde tekrar kontrol engelle

// Duplicate handler koruması
let ipcHandlersSetup = false

/**
 * Versiyon karşılaştırma (semver benzeri)
 * @param {string} v1 - Versiyon 1 (örn: "1.3.6")
 * @param {string} v2 - Versiyon 2
 * @returns {number} - v1 > v2 ise 1, v1 < v2 ise -1, eşitse 0
 */
function compareVersions(v1, v2) {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number)
    const parts2 = v2.replace(/^v/, '').split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0
        const p2 = parts2[i] || 0

        if (p1 > p2) return 1
        if (p1 < p2) return -1
    }
    return 0
}

/**
 * GitHub API'den son release bilgisini al
 * @returns {Promise<Object|null>}
 */
function fetchLatestRelease() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
            method: 'GET',
            headers: {
                'User-Agent': `${GITHUB_REPO}/${app.getVersion()}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        }

        const req = https.request(options, (res) => {
            let data = ''

            res.on('data', chunk => { data += chunk })
            res.on('end', () => {
                try {
                    // 404 = Release yok (henüz publish edilmemiş) - bu normal durum
                    if (res.statusCode === 404) {
                        console.log('[Updater] No releases found on GitHub')
                        resolve({ noReleases: true })
                        return
                    }

                    // Rate limit (403) veya diğer hata durumları - HATA olarak işaret et
                    if (res.statusCode !== 200) {
                        console.warn(`[Updater] GitHub API error: ${res.statusCode}`)
                        resolve({ error: `HTTP ${res.statusCode}` })
                        return
                    }

                    const release = JSON.parse(data)
                    resolve({
                        version: release.tag_name.replace(/^v/, ''),
                        tagName: release.tag_name,
                        name: release.name,
                        body: release.body, // Release notes (markdown)
                        htmlUrl: release.html_url,
                        publishedAt: release.published_at,
                        assets: release.assets?.map(a => ({
                            name: a.name,
                            downloadUrl: a.browser_download_url,
                            size: a.size
                        })) || []
                    })
                } catch (error) {
                    console.error('[Updater] JSON parse error:', error)
                    resolve({ error: 'Invalid response format' })
                }
            })
        })

        req.on('error', (error) => {
            console.error('[Updater] Network error:', error)
            resolve({ error: `Network error: ${error.code || error.message}` })
        })

        req.setTimeout(10000, () => {
            console.warn('[Updater] Request timeout')
            req.destroy()
            resolve({ error: 'Request timeout' })
        })

        req.end()
    })
}

/**
 * IPC Handlers kurulumu
 */
function setupUpdaterIPC() {
    // Zaten kurulduysa tekrar ekleme
    if (ipcHandlersSetup) {
        console.log('[Updater] IPC handlers already setup, skipping...')
        return
    }
    ipcHandlersSetup = true

    // Güncelleme kontrolü
    ipcMain.handle('check-for-updates', async () => {
        // Race condition kontrolü
        if (isChecking) {
            console.log('[Updater] Check already in progress, returning cached state')
            return {
                available: updateInfo !== null,
                version: updateInfo?.version || null,
                releaseNotes: updateInfo?.body || null,
                cached: true
            }
        }

        // Debounce kontrolü
        const now = Date.now()
        if (now - lastCheckTime < CHECK_DEBOUNCE_MS && updateInfo !== null) {
            console.log('[Updater] Check debounced, returning cached state')
            return {
                available: true,
                version: updateInfo.version,
                releaseNotes: updateInfo.body,
                cached: true
            }
        }

        try {
            isChecking = true
            lastCheckTime = now

            console.log('[Updater] Checking for updates...')
            const latestRelease = await fetchLatestRelease()

            // Hata durumu - kullanıcıyı bilgilendir
            if (latestRelease?.error) {
                updateInfo = null
                console.warn('[Updater] Check failed:', latestRelease.error)
                return { available: false, error: latestRelease.error }
            }

            // Release henüz yayınlanmamış (404) - bu güncel sayılır
            if (latestRelease?.noReleases) {
                updateInfo = null
                console.log('[Updater] No releases published yet')
                return { available: false }
            }

            const currentVersion = app.getVersion()
            const remoteVersion = latestRelease.version

            console.log(`[Updater] Current: ${currentVersion}, Latest: ${remoteVersion}`)

            // Karşılaştır: remoteVersion > currentVersion ise güncelleme var
            if (compareVersions(remoteVersion, currentVersion) > 0) {
                updateInfo = latestRelease
                console.log(`[Updater] ✅ Update available: ${remoteVersion}`)
                return {
                    available: true,
                    version: remoteVersion,
                    releaseNotes: latestRelease.body,
                    releaseName: latestRelease.name,
                    downloadUrl: latestRelease.htmlUrl
                }
            }

            // Güncelleme yok
            updateInfo = null
            console.log('[Updater] ✓ Already up to date')
            return { available: false }

        } catch (error) {
            console.error('[Updater] Check error:', error)
            return { available: false, error: error.message }
        } finally {
            isChecking = false
        }
    })

    // GitHub Releases sayfasını aç
    ipcMain.handle('open-releases-page', async () => {
        try {
            // Eğer spesifik bir release bilgisi varsa o sayfayı aç
            const url = updateInfo?.htmlUrl || RELEASES_URL
            await shell.openExternal(url)
            return { success: true }
        } catch (error) {
            console.error('[Updater] Failed to open releases page:', error)
            return { success: false, error: error.message }
        }
    })

    // Mevcut sürümü al
    ipcMain.handle('get-app-version', () => {
        return app.getVersion()
    })

    console.log('[Updater] IPC handlers setup complete')
}

/**
 * Güncelleme modülünü başlat
 */
function initUpdater() {
    setupUpdaterIPC()
    console.log('[Updater] Manual update checker initialized (GitHub Releases mode)')
}

module.exports = {
    initUpdater
}
