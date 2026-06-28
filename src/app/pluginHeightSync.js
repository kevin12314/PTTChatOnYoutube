export function shouldSyncPluginHeightFromContainer ({
  siteName,
  currentPluginHeight,
  nextContainerHeight
}) {
  return siteName === 'Youtube' && currentPluginHeight <= 0 && nextContainerHeight > 0
}
