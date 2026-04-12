(function initTrustedTypesPolicy () {
  if (typeof document !== 'undefined' && document.documentElement && !document.body) {
    document.documentElement.appendChild(document.createElement('body'))
  }

  function createPolicyRules () {
    return {
      createHTML: function (string) { return string },
      createScriptURL: function (string) { return string },
      createScript: function (string) { return string }
    }
  }

  function createPolicySet (targetWindow) {
    const trustedTypesApi = targetWindow && targetWindow.trustedTypes

    if (!trustedTypesApi || typeof trustedTypesApi.createPolicy !== 'function') return {}

    const policyStore = targetWindow.__pttTrustedTypePolicies || (targetWindow.__pttTrustedTypePolicies = {})

    if (!trustedTypesApi.__pttPatchedCreatePolicy) {
      const originalCreatePolicy = trustedTypesApi.createPolicy.bind(trustedTypesApi)
      trustedTypesApi.createPolicy = function patchedCreatePolicy (policyName, rules) {
        if (policyStore[policyName]) return policyStore[policyName]

        const policy = originalCreatePolicy(policyName, rules)
        policyStore[policyName] = policy
        return policy
      }
      trustedTypesApi.__pttPatchedCreatePolicy = true
    }

    function ensurePolicy (policyName) {
      if (policyStore[policyName]) return policyStore[policyName]

      try {
        policyStore[policyName] = trustedTypesApi.createPolicy(policyName, createPolicyRules())
      } catch (error) {}

      return policyStore[policyName]
    }

    return {
      defaultPolicy: ensurePolicy('default'),
      vuePolicy: ensurePolicy('vue')
    }
  }

  function patchInnerHTMLSetter (targetWindow, htmlPolicy) {
    if (!htmlPolicy || !targetWindow || !targetWindow.Element) return

    const descriptor = Object.getOwnPropertyDescriptor(targetWindow.Element.prototype, 'innerHTML')
    if (!descriptor || typeof descriptor.set !== 'function' || descriptor.set.__pttTrustedHtmlPatched) return

    const patchedSetter = function patchedInnerHTMLSetter (value) {
      if (typeof value === 'string') {
        return descriptor.set.call(this, htmlPolicy.createHTML(value))
      }

      return descriptor.set.call(this, value)
    }

    patchedSetter.__pttTrustedHtmlPatched = true

    Object.defineProperty(targetWindow.Element.prototype, 'innerHTML', {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: patchedSetter
    })

    if (targetWindow.ShadowRoot) {
      const shadowDescriptor = Object.getOwnPropertyDescriptor(targetWindow.ShadowRoot.prototype, 'innerHTML')
      if (shadowDescriptor && typeof shadowDescriptor.set === 'function' && !shadowDescriptor.set.__pttTrustedHtmlPatched) {
        const patchedShadowSetter = function patchedShadowInnerHTMLSetter (value) {
          if (typeof value === 'string') {
            return shadowDescriptor.set.call(this, htmlPolicy.createHTML(value))
          }

          return shadowDescriptor.set.call(this, value)
        }

        patchedShadowSetter.__pttTrustedHtmlPatched = true

        Object.defineProperty(targetWindow.ShadowRoot.prototype, 'innerHTML', {
          configurable: shadowDescriptor.configurable,
          enumerable: shadowDescriptor.enumerable,
          get: shadowDescriptor.get,
          set: patchedShadowSetter
        })
      }
    }
  }

  function injectPagePolicy () {
    const root = document.documentElement || document.head || document.body
    if (!root) return

    const script = document.createElement('script')
    script.textContent = `(function () {
      var trustedTypesApi = window.trustedTypes
      if (!trustedTypesApi || typeof trustedTypesApi.createPolicy !== 'function') return
      var policyStore = window.__pttTrustedTypePolicies || (window.__pttTrustedTypePolicies = {})
      if (!trustedTypesApi.__pttPatchedCreatePolicy) {
        var originalCreatePolicy = trustedTypesApi.createPolicy.bind(trustedTypesApi)
        trustedTypesApi.createPolicy = function patchedCreatePolicy (policyName, rules) {
          if (policyStore[policyName]) return policyStore[policyName]
          var policy = originalCreatePolicy(policyName, rules)
          policyStore[policyName] = policy
          return policy
        }
        trustedTypesApi.__pttPatchedCreatePolicy = true
      }
      function createPolicyRules () {
        return {
          createHTML: function (string) { return string },
          createScriptURL: function (string) { return string },
          createScript: function (string) { return string }
        }
      }
      function ensurePolicy (policyName) {
        if (policyStore[policyName]) return policyStore[policyName]
        try {
          policyStore[policyName] = trustedTypesApi.createPolicy(policyName, createPolicyRules())
        } catch (error) {}
        return policyStore[policyName]
      }
      var htmlPolicy = ensurePolicy('vue') || ensurePolicy('default')
      var descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')
      if (htmlPolicy && descriptor && typeof descriptor.set === 'function' && !descriptor.set.__pttTrustedHtmlPatched) {
        var patchedSetter = function patchedInnerHTMLSetter (value) {
          if (typeof value === 'string') {
            return descriptor.set.call(this, htmlPolicy.createHTML(value))
          }
          return descriptor.set.call(this, value)
        }
        patchedSetter.__pttTrustedHtmlPatched = true
        Object.defineProperty(Element.prototype, 'innerHTML', {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: descriptor.get,
          set: patchedSetter
        })
      }
      ensurePolicy('default')
      ensurePolicy('vue')
    })();`

    root.appendChild(script)
    script.remove()
  }

  const sandboxPolicies = createPolicySet(window)
  patchInnerHTMLSetter(window, sandboxPolicies.vuePolicy || sandboxPolicies.defaultPolicy)

  if (typeof unsafeWindow !== 'undefined' && unsafeWindow !== window) {
    const pagePolicies = createPolicySet(unsafeWindow)
    patchInnerHTMLSetter(unsafeWindow, pagePolicies.vuePolicy || pagePolicies.defaultPolicy)
    injectPagePolicy()
  }
})()
