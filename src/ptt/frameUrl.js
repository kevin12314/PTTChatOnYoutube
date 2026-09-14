export function createPttFrameUrl (ownerOrigin, reloadToken = Date.now()) {
  const url = new URL('https://term.ptt.cc/')
  url.searchParams.set('url', ownerOrigin)
  // A cached HTML entry can reference assets removed by a terminal deployment.
  url.searchParams.set('pttchatReload', String(reloadToken))
  return url.href
}

export function readPttOwnerOrigin (href) {
  const owner = new URL(href).searchParams.get('url')
  if (!owner) throw new Error('Missing PTT host origin')
  return new URL(owner).origin
}
