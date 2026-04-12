import InitApp from 'src/app/appindex'
import ChangeLog from 'src/ChangeLog'
import { ThemeCheck } from 'src/library'

export default function InitYT (messagePoster, siteName) {
  const msg = messagePoster
  // Check Theme
  const WhiteTheme = ThemeCheck('html', 'rgb(249, 249, 249)')

  function getPlayerResponse () {
    // In userscript sandbox, yt runtime data may live on unsafeWindow.
    const globalWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
    return globalWindow.ytInitialPlayerResponse || window.ytInitialPlayerResponse
  }

  function checkLiveByPlayerResponse () {
    const playerResponse = getPlayerResponse()
    if (!playerResponse) return

    const microformat = playerResponse.microformat && playerResponse.microformat.playerMicroformatRenderer
    const liveBroadcastDetails = microformat && microformat.liveBroadcastDetails
    if (liveBroadcastDetails && typeof liveBroadcastDetails.isLiveNow === 'boolean') {
      return liveBroadcastDetails.isLiveNow
    }

    const videoDetails = playerResponse.videoDetails
    if (videoDetails && typeof videoDetails.isLiveContent === 'boolean') {
      return videoDetails.isLiveContent
    }
  }

  function isWatchPage () {
    const pathname = window.location.pathname
    return pathname === '/watch' || /^\/live\//.test(pathname)
  }

  (function CheckChatInstanced () {
    if (!isWatchPage()) {
      if (showAllLog) console.log('not watch video.')
      setTimeout(CheckChatInstanced, 2000)
      return
    }
    const ChatContainer = $('#chat-container').length > 0
      ? $('#chat-container')
      : $('ytd-live-chat-frame')
    const defaultChat = $('iframe', ChatContainer)
    const PTTApp = $('#PTTChat', ChatContainer)
    if (PTTApp.length > 0) {
      if (showAllLog) console.log('PTTApp already instanced.')
      setTimeout(CheckChatInstanced, 5000)
    } else if (defaultChat.length > 0) {
      if (showAllLog) console.log('PTTApp frame instance!')
      ChatContainer.css({ position: 'relative' })

      // 生出套件
      let isStream = false
      try {
        isStream = checkVideoType()
      } catch (e) {
        console.log('checkVideoType failed, fallback as video mode', e)
      }
      InitApp(ChatContainer, WhiteTheme, isStream, msg, siteName)
      ChangeLog()
      setTimeout(CheckChatInstanced, 5000)
    } else {
      if (showAllLog) console.log('watching video without chatroom.')
      setTimeout(CheckChatInstanced, 5000)
    }
  })()
  function getScriptTag () {
    const scriptTagElement = document.getElementById('scriptTag')
    if (scriptTagElement == null) return
    try {
      return JSON.parse(scriptTagElement.innerHTML)
    } catch (e) {
      if (reportMode) console.log('scriptTag parse failed', e)
    }
  }
  function checkVideoType () {
    const isLiveByPlayerResponse = checkLiveByPlayerResponse()
    if (typeof isLiveByPlayerResponse === 'boolean') {
      if (reportMode) console.log('detected by ytInitialPlayerResponse [is streaming]:', isLiveByPlayerResponse)
      return isLiveByPlayerResponse
    }

    const scriptTag = getScriptTag()
    const publication = scriptTag && scriptTag.publication && scriptTag.publication[0]
    if (publication === undefined) {
      if (/^\/live\//.test(window.location.pathname)) {
        if (reportMode) console.log('detected by /live path [is streaming]')
        return true
      }
      if (reportMode) console.log('scriptTag have no publication [fallback as video]')
      return false
    } else {
      if (publication.endDate === undefined) {
        if (reportMode) console.log('scriptTag have no endDate [is streaming]')
        return true
      } else {
        if (reportMode) console.log('scriptTag have endDate [is end stream]')
        return false
      }
    }
  }
}
