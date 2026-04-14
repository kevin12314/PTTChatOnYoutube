import InitApp from 'src/app/appindex'
import ChangeLog from 'src/ChangeLog'
import { ThemeCheck } from 'src/library'
import { store } from 'src/app/store/store'
import { types } from 'src/app/store/mutations_type'

export default function InitYT (messagePoster, siteName) {
  const msg = messagePoster
  let lastVideoKey = null
  let lastWatchToken = null
  let pendingReinitToken = null
  let checkTimer = null
  let hostLayoutFrame = null
  // Check Theme
  const WhiteTheme = ThemeCheck('html', 'rgb(249, 249, 249)')

  function ytDebug (stage, payload) {
    // debug logs temporarily disabled for verification
    if (reportMode && Date.now() < 0) {
      console.log('[PTTChatOnYT][InitYT]', stage, payload)
    }
  }

  function scheduleCheck (delay) {
    if (checkTimer) clearTimeout(checkTimer)
    checkTimer = setTimeout(CheckChatInstanced, delay)
    ytDebug('scheduleCheck', { delay })
  }

  function getMoviePlayer () {
    return document.getElementById('movie_player')
  }

  function getPreferredChatContainer () {
    const chatContainer = $('#chat-container')
    const liveChatFrame = $('ytd-live-chat-frame')

    if (liveChatFrame.length > 0) {
      const liveChatFrameElement = liveChatFrame[0]
      const liveChatFrameRect = liveChatFrameElement.getBoundingClientRect()
      if (liveChatFrameRect.width > 0 && liveChatFrameRect.height > 0) {
        return liveChatFrame
      }
    }

    if (chatContainer.length > 0) {
      const chatContainerElement = chatContainer[0]
      const chatContainerRect = chatContainerElement.getBoundingClientRect()
      if (chatContainerRect.width > 0 && chatContainerRect.height > 0) {
        return chatContainer
      }
    }

    return chatContainer.length > 0 ? chatContainer : liveChatFrame
  }

  function getOrCreateAppHost () {
    let host = document.getElementById('PTTChatYoutubeHost')
    if (!host) {
      host = document.createElement('div')
      host.id = 'PTTChatYoutubeHost'
      host.style.position = 'fixed'
      host.style.margin = '0'
      host.style.padding = '0'
      host.style.zIndex = '1000'
      host.style.overflow = 'visible'
      host.style.pointerEvents = 'none'
      document.body.appendChild(host)
    }
    return $(host)
  }

  function syncAppHostLayout (sourceContainer, appHost) {
    if (!appHost || appHost.length === 0) return

    const hostElement = appHost[0]
    const sourceElement = sourceContainer && sourceContainer[0]
    if (!sourceElement) {
      hostElement.style.display = 'none'
      return
    }

    const rect = sourceElement.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) {
      hostElement.style.display = 'none'
      return
    }

    hostElement.style.display = 'block'
    hostElement.style.top = rect.top + 'px'
    hostElement.style.left = rect.left + 'px'
    hostElement.style.width = rect.width + 'px'
    hostElement.style.height = rect.height + 'px'
  }

  function scheduleAppHostLayoutSync () {
    if (hostLayoutFrame !== null) return

    hostLayoutFrame = window.requestAnimationFrame(() => {
      hostLayoutFrame = null
      const chatContainer = getPreferredChatContainer()
      const appHost = getOrCreateAppHost()
      syncAppHostLayout(chatContainer, appHost)
    })
  }

  function getCurrentVideoKey () {
    const moviePlayer = getMoviePlayer()
    if (moviePlayer && typeof moviePlayer.getVideoData === 'function') {
      const videoData = moviePlayer.getVideoData()
      if (videoData && videoData.video_id) return 'watch:' + videoData.video_id
    }
    try {
      const url = new URL(window.location.href)
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v')
        return videoId ? 'watch:' + videoId : null
      }
      if (/^\/live\//.test(url.pathname)) {
        return 'live:' + url.pathname
      }
      return null
    } catch (e) {
      return null
    }
  }

  function getCurrentWatchToken () {
    if (!isWatchPage()) return null
    return window.location.pathname + window.location.search
  }

  function resetVideoRelatedState () {
    ytDebug('resetVideoRelatedState:start', { lastVideoKey, lastWatchToken })
    msg.targetWindow = null
    store.dispatch('pttState', 0)
    store.dispatch('clearChat')
    store.commit(types.UPDATEPOST, {
      key: '',
      board: '',
      title: '',
      date: new Date(),
      lastEndLine: 0,
      lastCommentTime: new Date(),
      commentCount: 0,
      nowComment: 0,
      gettedpost: false
    })
    ;[
      'videoType',
      'videoStartTime',
      'videoEndTime',
      'postKey',
      'postBoard',
      'postTitle',
      'postDate',
      'postEndLine',
      'postCommentCount',
      'postLastCommentTime',
      'videoPlayedTime',
      'videoCurrentTime',
      'commentIndex'
    ].forEach(type => store.dispatch('removeLog', type))
    ytDebug('resetVideoRelatedState:done')
  }

  function teardownCurrentApp () {
    const app = document.getElementById('PTTChat')
    if (app && app.parentNode) {
      ytDebug('teardownCurrentApp:remove', { hasParent: !!app.parentNode })
      app.parentNode.removeChild(app)
    } else {
      ytDebug('teardownCurrentApp:skip', { appExists: !!app })
    }
  }

  function getPlayerResponse () {
    const moviePlayer = getMoviePlayer()
    if (moviePlayer && typeof moviePlayer.getPlayerResponse === 'function') {
      const response = moviePlayer.getPlayerResponse()
      if (response && response.microformat) return response
    }
    // Fallback: in userscript sandbox, yt runtime data may live on unsafeWindow.
    const globalWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
    return globalWindow.ytInitialPlayerResponse || window.ytInitialPlayerResponse
  }

  function parseDateSafe (value) {
    if (!value) return null
    const parsedDate = new Date(value)
    return Number.isNaN(parsedDate.valueOf()) ? null : parsedDate
  }

  function getVideoTimeline () {
    const playerResponse = getPlayerResponse()
    if (!playerResponse) return {}

    const microformat = playerResponse.microformat && playerResponse.microformat.playerMicroformatRenderer
    const liveBroadcastDetails = microformat && microformat.liveBroadcastDetails

    const startDate = parseDateSafe(
      (liveBroadcastDetails && liveBroadcastDetails.startTimestamp) ||
      (microformat && microformat.publishDate) ||
      (microformat && microformat.uploadDate)
    )
    const endDate = parseDateSafe(liveBroadcastDetails && liveBroadcastDetails.endTimestamp)
    return { startDate, endDate }
  }

  function syncVideoMetaToStore () {
    let isStream = false
    try {
      isStream = checkVideoType()
    } catch (e) {
      if (reportMode) console.log('syncVideoMetaToStore checkVideoType failed', e)
    }
    store.dispatch('isStream', isStream)
    store.dispatch('updateLog', { type: 'videoType', data: isStream ? '實況' : '影片' })

    if (isStream) return

    const timeline = getVideoTimeline()
    if (timeline.startDate) {
      store.dispatch('updateVideoStartDate', timeline.startDate)
    }
    if (timeline.endDate) {
      store.dispatch('updateLog', { type: 'videoEndTime', data: timeline.endDate.toLocaleDateString() + ' ' + timeline.endDate.toLocaleTimeString() })
    }
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

  function CheckChatInstanced () {
    ytDebug('CheckChatInstanced:enter', {
      href: window.location.href,
      lastVideoKey,
      lastWatchToken
    })
    if (!isWatchPage()) {
      lastVideoKey = null
      lastWatchToken = null
      ytDebug('CheckChatInstanced:notWatchPage')
      scheduleCheck(2000)
      return
    }

    const currentWatchToken = getCurrentWatchToken()
    const currentVideoKey = getCurrentVideoKey()
    syncVideoMetaToStore()
    ytDebug('CheckChatInstanced:keys', { currentWatchToken, currentVideoKey, lastWatchToken, lastVideoKey })
    if (currentWatchToken && lastWatchToken && currentWatchToken !== lastWatchToken) {
      ytDebug('CheckChatInstanced:watchTokenChanged', { from: lastWatchToken, to: currentWatchToken })
      teardownCurrentApp()
      resetVideoRelatedState()
      pendingReinitToken = currentWatchToken
      lastWatchToken = currentWatchToken
      lastVideoKey = currentVideoKey
      scheduleCheck(1200)
      return
    }
    if (currentVideoKey && lastVideoKey && currentVideoKey !== lastVideoKey) {
      ytDebug('CheckChatInstanced:videoKeyChanged', { from: lastVideoKey, to: currentVideoKey })
      teardownCurrentApp()
      resetVideoRelatedState()
      pendingReinitToken = currentWatchToken || pendingReinitToken
      lastVideoKey = currentVideoKey
      lastWatchToken = currentWatchToken
      scheduleCheck(1200)
      return
    }
    if (currentWatchToken && !lastWatchToken) {
      lastWatchToken = currentWatchToken
    }
    if (currentVideoKey && !lastVideoKey) {
      lastVideoKey = currentVideoKey
    }

    const ChatContainer = getPreferredChatContainer()
    const AppHost = getOrCreateAppHost()
    syncAppHostLayout(ChatContainer, AppHost)
    const defaultChat = $('iframe', ChatContainer)
    const PTTApp = $('#PTTChat', AppHost)
    const appVideoToken = PTTApp.length > 0 ? PTTApp.attr('data-video-token') : null
    ytDebug('CheckChatInstanced:dom', {
      chatContainerLength: ChatContainer.length,
      appHostLength: AppHost.length,
      defaultChatLength: defaultChat.length,
      pttAppLength: PTTApp.length,
      appVideoToken,
      currentWatchToken
    })

    if (PTTApp.length > 0 && currentWatchToken && appVideoToken && appVideoToken !== currentWatchToken) {
      ytDebug('CheckChatInstanced:appTokenMismatchReinit', { appVideoToken, currentWatchToken })
      teardownCurrentApp()
      resetVideoRelatedState()
      pendingReinitToken = currentWatchToken
      lastWatchToken = currentWatchToken
      lastVideoKey = currentVideoKey
      scheduleCheck(1200)
      return
    }

    if (PTTApp.length > 0) {
      if (currentWatchToken && !appVideoToken) {
        PTTApp.attr('data-video-token', currentWatchToken)
      }
      ytDebug('CheckChatInstanced:alreadyInstanced')
      scheduleCheck(1000)
    } else if (defaultChat.length > 0) {
      if (pendingReinitToken && currentWatchToken !== pendingReinitToken) {
        ytDebug('CheckChatInstanced:waitPendingToken', { pendingReinitToken, currentWatchToken })
        scheduleCheck(500)
        return
      }
      ytDebug('CheckChatInstanced:initApp')
      const currentPosition = AppHost.css('position')
      if (!currentPosition || currentPosition === 'static') {
        AppHost.css({ position: 'fixed' })
      }

      // 生出套件
      let isStream = false
      try {
        isStream = checkVideoType()
      } catch (e) {
        console.log('checkVideoType failed, fallback as video mode', e)
      }
      ytDebug('CheckChatInstanced:videoType', { isStream })
      InitApp(AppHost, WhiteTheme, isStream, msg, siteName)
      setTimeout(() => {
        syncAppHostLayout(ChatContainer, AppHost)
        const currentApp = $('#PTTChat', AppHost)
        if (currentApp.length > 0 && currentWatchToken) {
          currentApp.attr('data-video-token', currentWatchToken)
        }
      }, 0)
      ChangeLog()
      pendingReinitToken = null
      if (currentVideoKey) lastVideoKey = currentVideoKey
      if (currentWatchToken) lastWatchToken = currentWatchToken
      scheduleCheck(1000)
    } else {
      ytDebug('CheckChatInstanced:noChatRoom')
      scheduleCheck(1000)
    }
  }

  if (!window.__PTTChatOnYT_YT_NAV_HOOKED__) {
    window.addEventListener('yt-navigate-finish', () => {
      ytDebug('event:yt-navigate-finish', { href: window.location.href })
      scheduleAppHostLayoutSync()
      scheduleCheck(50)
    }, true)
    window.addEventListener('yt-page-data-updated', () => {
      ytDebug('event:yt-page-data-updated', { href: window.location.href })
      scheduleAppHostLayoutSync()
      scheduleCheck(50)
    }, true)
    window.addEventListener('yt-player-updated', scheduleAppHostLayoutSync, true)
    window.addEventListener('resize', scheduleAppHostLayoutSync, true)
    window.addEventListener('scroll', scheduleAppHostLayoutSync, true)
    window.__PTTChatOnYT_YT_NAV_HOOKED__ = true
    ytDebug('eventHooks:registered')
  } else {
    ytDebug('eventHooks:alreadyRegistered')
  }

  CheckChatInstanced()
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
