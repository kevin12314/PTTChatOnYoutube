export function shouldSyncPluginHeightFromContainer ({
  siteName,
  currentPluginHeight,
  nextContainerHeight
}) {
  return siteName === 'Youtube' && currentPluginHeight <= 0 && nextContainerHeight > 0
}

export function getInitialPluginHeight ({ customPluginSetting, sitePluginHeight, globalPluginHeight }) {
  if (customPluginSetting) return sitePluginHeight > 0 ? sitePluginHeight : -1
  return globalPluginHeight
}
