export default function (data) {
  // Analytics may be blocked by the host's CSP or a browser extension.
  // It must never interrupt the user's action.
  try {
    const layer = unsafeWindow.pttDataLayer
    if (layer && typeof layer.push === 'function') layer.push(data)
  } catch (error) {
    // Analytics is optional.
  }
}
