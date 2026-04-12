// ==UserScript==
// @name        test script
// @namespace   Test Script
// @description test your script on userscript manager
// @match       https://blank.org/
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_xmlhttpRequest
// @version     1.0
// @author      -
// @run-at      document-start
// ==/UserScript==

/* the '@match' and '@grant' MUST be same with the headers in 'configs/webpack.build.js' EXCEPT for 'GM_xmlhttpRequest' */
/* paste these code on your userscript manager and test it */

;(function initTrustedTypesPolicy () {
  function createDefaultPolicy (targetWindow) {
    const trustedTypesApi = targetWindow && targetWindow.trustedTypes

    if (!trustedTypesApi || typeof trustedTypesApi.createPolicy !== 'function') return

    try {
      trustedTypesApi.createPolicy('default', {
        createHTML: string => string,
        createScriptURL: string => string,
        createScript: string => string
      })
    } catch (error) {
      console.log('Trusted Types default policy already exists or cannot be created.', error)
    }
  }

  function injectPagePolicy () {
    const root = document.documentElement || document.head || document.body
    if (!root) return

    const script = document.createElement('script')
    script.textContent = `(function () {
      var trustedTypesApi = window.trustedTypes
      if (!trustedTypesApi || typeof trustedTypesApi.createPolicy !== 'function') return
      try {
        trustedTypesApi.createPolicy('default', {
          createHTML: function (string) { return string },
          createScriptURL: function (string) { return string },
          createScript: function (string) { return string }
        })
      } catch (error) {}
    })();`

    root.appendChild(script)
    script.remove()
  }

  createDefaultPolicy(window)

  if (typeof unsafeWindow !== 'undefined' && unsafeWindow !== window) {
    createDefaultPolicy(unsafeWindow)
    injectPagePolicy()
  }
})()

GM_xmlhttpRequest({
  method: "GET",
  url: "https://localhost:8080/main.js",
  onload: response => {
    eval(response.responseText)
  }
})