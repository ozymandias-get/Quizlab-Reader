const { app, ipcMain, shell, net } = require('electron')
const path = require('path')
const APP_CONFIG = require('./constants')
const fetch = require('cross-fetch')

// Local state
let updateInfo = null
let isChecking = false
let lastCheckTime = 0
const CHECK_DEBOUNCE_MS = 5000

/**
 * Semver comparison helper
 */
function isNewer(remote, current) {
    if (!remote || !current) return false

    // Remove 'v' prefix and any build metadata (+...)
    const cleanRemote = remote.replace(/^v/, '').split('+')[0]
    const cleanCurrent = current.replace(/^v/, '').split('+')[0]

    const r = cleanRemote.split('.').map(num => parseInt(num, 10))
    const c = cleanCurrent.split('.').map(num => parseInt(num, 10))

    // Compare major, minor, patch
    for (let i = 0; i < Math.max(r.length, c.length); i++) {
        const rVal = isNaN(r[i]) ? 0 : r[i]
        const cVal = isNaN(c[i]) ? 0 : c[i]

        if (rVal > cVal) return true
        if (rVal < cVal) return false
    }
    return false
}

/**
 * Fetch latest release from GitHub
 */
async function getLatestRelease() {
    const { OWNER, REPO } = APP_CONFIG.GITHUB
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`

    console.log(`[Updater] Checking for updates: ${url}`)

    try {
        // Attempt 1: Try with cross-fetch (standard)
        const response = await fetch(url, {
            headers: {
                'User-Agent': `Electron-App/${app.getVersion()}`, // Generic UA to avoid GitHub blocking
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 5000 // 5s timeout
        })

        if (!response.ok) {
            console.warn(`[Updater] Fetch failed: ${response.status} ${response.statusText}`)
            return { error: `HTTP ${response.status}` }
        }

        const release = await response.json()

        // Validate response structure
        if (!release || !release.tag_name) {
            return { error: 'Invalid release data' }
        }

        return {
            version: release.tag_name,
            body: release.body || 'New version available.',
            htmlUrl: release.html_url
        }

    } catch (err) {
        console.error(`[Updater] Network error:`, err.message)

        // Attempt 2: Fallback to Electron's native 'net' module (if fetch fails due to proxy/env issues)
        if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
            return new Promise((resolve) => {
                const request = net.request(url)
                request.setHeader('User-Agent', `Electron-App/${app.getVersion()}`)
                request.on('response', (response) => {
                    let data = ''
                    response.on('data', (chunk) => { data += chunk })
                    response.on('end', () => {
                        try {
                            if (response.statusCode !== 200) {
                                resolve({ error: `HTTP ${response.statusCode}` })
                            } else {
                                const release = JSON.parse(data)
                                resolve({
                                    version: release.tag_name,
                                    body: release.body,
                                    htmlUrl: release.html_url
                                })
                            }
                        } catch (e) {
                            resolve({ error: 'Parse error' })
                        }
                    })
                })
                request.on('error', (error) => {
                    resolve({ error: error.message })
                })
                request.end()
            })
        }

        return { error: err.message }
    }
}

/**
 * Initialize Updater IPC
 */
function initUpdater() {
    const { IPC_CHANNELS } = APP_CONFIG

    ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
        if (isChecking) return { available: !!updateInfo, cached: true }

        const now = Date.now()
        // Cache geçerlilik süresini kontrol et
        if (now - lastCheckTime < CHECK_DEBOUNCE_MS && updateInfo) {
            return {
                available: true,
                version: updateInfo.version,
                releaseNotes: updateInfo.body,
                cached: true
            }
        }

        isChecking = true
        lastCheckTime = now

        try {
            const latest = await getLatestRelease()

            if (latest.error) {
                console.warn('[Updater] Check failed:', latest.error)
                return { available: false, error: latest.error }
            }

            const currentVersion = app.getVersion()
            console.log(`[Updater] Remote: ${latest.version}, Current: ${currentVersion}`)

            if (isNewer(latest.version, currentVersion)) {
                updateInfo = latest
                return {
                    available: true,
                    version: latest.version,
                    releaseNotes: latest.body || ''
                }
            }

            updateInfo = null
            return { available: false }
        } catch (catastrophicError) {
            console.error('[Updater] Catastrophic error:', catastrophicError)
            return { available: false, error: catastrophicError.message }
        } finally {
            isChecking = false
        }
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_RELEASES, async () => {
        const { OWNER, REPO } = APP_CONFIG.GITHUB
        const url = updateInfo?.htmlUrl || `https://github.com/${OWNER}/${REPO}/releases`
        await shell.openExternal(url)
    })

    ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => app.getVersion())
}

module.exports = { initUpdater }
