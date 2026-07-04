/*
  VS Code 內建瀏覽器 DevTools Snippet 用。
  用法：
  1. 先在專案根目錄執行 pnpm run dev
  2. 在 YouTube / Holodex 頁面開 F12 -> Sources -> Snippets
  3. 建立一個新 snippet，把這整份內容貼進去
  4. 每次頁面重新整理後執行一次 snippet
*/

void (async function bootstrapPttChatOnYoutubeDev () {
  const candidateBundleUrls = [
    window.__PTTChatOnYoutubeDevBundleUrl,
    'http://127.0.0.1:8080/main.user.js'
  ].filter(Boolean)
  const STORAGE_KEY = '__pttchatonyt_vscode_dev_values__'

  if (window.__PTTChatOnYoutubeVscodeDevRunning) {
    console.warn('[PTTChatOnYT][VSCode] Dev snippet already ran in this page. Refresh the page before running it again.')
    return
  }

  window.__PTTChatOnYoutubeVscodeDevRunning = true

  function readStore () {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch (error) {
      console.warn('[PTTChatOnYT][VSCode] Failed to read local GM store.', error)
      return {}
    }
  }

  function writeStore (store) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch (error) {
      console.warn('[PTTChatOnYT][VSCode] Failed to write local GM store.', error)
    }
  }

  function installValueApi () {
    const listeners = new Map()
    let nextListenerId = 1

    window.GM_getValue = function (key, defaultValue) {
      const store = readStore()
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : defaultValue
    }

    window.GM_setValue = function (key, value) {
      const store = readStore()
      const oldValue = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : undefined
      store[key] = value
      writeStore(store)

      for (const callback of listeners.values()) {
        try {
          callback(key, oldValue, value, false)
        } catch (error) {
          console.warn('[PTTChatOnYT][VSCode] GM_addValueChangeListener callback failed.', error)
        }
      }

      return value
    }

    window.GM_deleteValue = function (key) {
      const store = readStore()
      if (!Object.prototype.hasOwnProperty.call(store, key)) return

      const oldValue = store[key]
      delete store[key]
      writeStore(store)

      for (const callback of listeners.values()) {
        try {
          callback(key, oldValue, undefined, false)
        } catch (error) {
          console.warn('[PTTChatOnYT][VSCode] GM_addValueChangeListener callback failed.', error)
        }
      }
    }

    window.GM_addValueChangeListener = function (key, callback) {
      const listenerId = nextListenerId
      nextListenerId += 1

      listeners.set(listenerId, function (changedKey, oldValue, newValue, remote) {
        if (changedKey !== key) return
        callback(changedKey, oldValue, newValue, remote)
      })

      return listenerId
    }

    window.GM_removeValueChangeListener = function (listenerId) {
      listeners.delete(listenerId)
    }
  }

  function installMenuApi () {
    let nextMenuId = 1
    const registeredMenus = new Map()

    window.GM_registerMenuCommand = function (caption, onClick) {
      const menuId = nextMenuId
      nextMenuId += 1
      registeredMenus.set(menuId, { caption, onClick })
      return menuId
    }

    window.GM_unregisterMenuCommand = function (menuId) {
      registeredMenus.delete(menuId)
    }
  }

  function installTrustedTypesShim () {
    const trustedTypesApi = window.trustedTypes
    if (!trustedTypesApi || typeof trustedTypesApi.createPolicy !== 'function') return

    for (const policyName of ['default', 'vue']) {
      try {
        trustedTypesApi.createPolicy(policyName, {
          createHTML: string => string,
          createScriptURL: string => string,
          createScript: string => string
        })
      } catch (error) {}
    }
  }

  function installGlobals () {
    installValueApi()
    installMenuApi()
    installTrustedTypesShim()
    window.GM_info = { script: { version: '4.4.0-dev-vscode' } }
    window.unsafeWindow = window
  }

  async function loadBundle () {
    let lastError = null

    for (const bundleUrl of candidateBundleUrls) {
      try {
        const response = await fetch(`${bundleUrl}?t=${Date.now()}`, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Failed to load dev bundle: ${response.status} ${response.statusText}`)
        }

        const source = await response.text()

        // eslint-disable-next-line no-eval
        eval(source)
        return bundleUrl
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error('No reachable dev bundle URL found.')
  }

  installGlobals()

  try {
    const loadedBundleUrl = await loadBundle()
    console.log('[PTTChatOnYT][VSCode] Dev bundle loaded from', loadedBundleUrl)
  } catch (error) {
    window.__PTTChatOnYoutubeVscodeDevRunning = false
    console.error('[PTTChatOnYT][VSCode] Failed to load dev bundle. Confirm pnpm run dev is running, the localhost certificate is trusted, or set window.__PTTChatOnYoutubeDevBundleUrl before running this snippet.', error)
  }
})()