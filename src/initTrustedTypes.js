// Minimal YouTube-only Trusted Types bootstrap.
// Keep this limited to creating the default policy in page context.
// Do not reintroduce global prototype patches or createPolicy monkey patches here,
// because they break compatibility with other extensions such as Enhancer for YouTube.
(function initYoutubeTrustedTypesBootstrap () {
  if (typeof location === 'undefined' || !/(^|\.)youtube\.com$/i.test(location.hostname)) return

  function ensureMinimalDefaultPolicy (targetWindow) {
    const trustedTypesApi = targetWindow && targetWindow.trustedTypes
    if (!trustedTypesApi || typeof trustedTypesApi.createPolicy !== 'function') return

    try {
      trustedTypesApi.createPolicy('default', {
        createHTML: function (string) { return string },
        createScriptURL: function (string) { return string },
        createScript: function (string) { return string }
      })
    } catch (error) {}
  }

  function injectMinimalPagePolicy () {
    const root = document.documentElement || document.head || document.body
    if (!root) return

    const script = document.createElement('script')
    script.textContent = `(function () {
      if (!window.trustedTypes || typeof window.trustedTypes.createPolicy !== 'function') return
      try {
        window.trustedTypes.createPolicy('default', {
          createHTML: function (string) { return string },
          createScriptURL: function (string) { return string },
          createScript: function (string) { return string }
        })
      } catch (error) {}
    })();`

    root.appendChild(script)
    script.remove()
  }

  ensureMinimalDefaultPolicy(window)
  injectMinimalPagePolicy()
})()
