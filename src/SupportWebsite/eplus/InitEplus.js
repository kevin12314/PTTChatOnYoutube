import InitApp from 'src/app/appindex'
import { store } from 'src/app/store/store'
import { createEplusTabbedHost, findEplusChatContainer, isEplusPlayerPage } from './eplusLayout'

export default function InitEplus (messageposter, siteName) {
  const WhiteTheme = false
  const msg = messageposter
  let appHandle = null
  let checkTimer = null
  let waitingChatLogged = false

  function eplusDebug (stage, payload) {
    console.log('[PTTChatOnYT][Eplus]', stage, payload || {})
  }

  function scheduleCheck (delay) {
    if (checkTimer) clearTimeout(checkTimer)
    checkTimer = setTimeout(CheckChatInstanced, delay)
  }

  function teardownCurrentApp () {
    if (appHandle && typeof appHandle.unmount === 'function') {
      appHandle.unmount()
      appHandle = null
    }
  }

  function CheckChatInstanced () {
    if (!isEplusPlayerPage(window.location)) {
      waitingChatLogged = false
      teardownCurrentApp()
      scheduleCheck(2000)
      return
    }

    const chatContainer = findEplusChatContainer(document)
    if (!chatContainer) {
      if (!waitingChatLogged) {
        eplusDebug('waiting for chat container before mounting tabs', { href: window.location.href })
        waitingChatLogged = true
      }
      scheduleCheck(500)
      return
    }

    if (waitingChatLogged) {
      eplusDebug('chat container found, mounting tabs')
      waitingChatLogged = false
    }

    const tabbedHost = createEplusTabbedHost(document, chatContainer)
    if (!tabbedHost || !tabbedHost.pttMount) {
      scheduleCheck(500)
      return
    }

    if (!appHandle) {
      store.dispatch('setPluginHeight', Math.max(chatContainer.getBoundingClientRect().height || 360, 360))
      appHandle = InitApp([tabbedHost.pttMount], WhiteTheme, true, msg, siteName, {
        instanceId: 'eplus',
        shellMode: 'embedded'
      })
    }

    scheduleCheck(1000)
  }

  CheckChatInstanced()
}
