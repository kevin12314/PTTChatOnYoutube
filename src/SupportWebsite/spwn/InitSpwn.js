import InitApp from 'src/app/appindex'
import ChangeLog from 'src/ChangeLog'
import { store } from 'src/app/store/store'

export default function InitSpwn (messageposter, siteName) {
  const WhiteTheme = false
  const msg = messageposter
  let appHandle = null
  let checkTimer = null
  let lastPageToken = null
  let lastIsStream = null
  let waitingActionBarLogged = false

  function spwnDebug (stage, payload) {
    console.log('[PTTChatOnYT][SPWN]', stage, payload || {})
  }

  function scheduleCheck (delay) {
    if (checkTimer) clearTimeout(checkTimer)
    checkTimer = setTimeout(CheckChatInstanced, delay)
  }

  function isStreamingPage () {
    return /^\/events\/[^/]+\/streaming/.test(window.location.pathname)
  }

  function getCurrentVideoId () {
    try {
      return new URL(window.location.href).searchParams.get('vid') || ''
    } catch (e) {
      return ''
    }
  }

  function getPageToken () {
    return window.location.pathname + window.location.search
  }

  function getSpwnActionBar () {
    return document.querySelector('#Streaming .streaming_action_area > div:first-child') ||
      document.querySelector('#Streaming .streaming_action_area .jss36')
  }

  function getOrCreateAppHost () {
    const actionBar = getSpwnActionBar()
    if (!actionBar) return null

    let host = document.getElementById('PTTChatSpwnHost')
    if (!host) {
      host = document.createElement('div')
      host.id = 'PTTChatSpwnHost'
      host.style.zIndex = '2147483000'
      host.style.pointerEvents = 'none'
      host.style.overflow = 'visible'
    }

    if (getComputedStyle(actionBar).position === 'static') {
      actionBar.style.position = 'relative'
    }
    if (host.parentNode !== actionBar) actionBar.appendChild(host)
    host.style.position = 'absolute'
    host.style.top = '0'
    host.style.left = '0'
    host.style.right = 'auto'
    host.style.bottom = 'auto'
    host.style.width = '100%'
    host.style.height = Math.max(actionBar.getBoundingClientRect().height || 32, 32) + 'px'
    host.style.display = 'block'
    return $(host)
  }

  function applySpwnAppLayout (AppHost) {
    const host = AppHost && AppHost[0]
    if (!host) return

    const actionBar = getSpwnActionBar()
    const isInActionBar = actionBar && host.parentNode === actionBar
    const buttonLeft = isInActionBar ? '36px' : '0'
    const panelTop = isInActionBar ? Math.max(actionBar.getBoundingClientRect().height || 32, 32) + 'px' : '0'

    $('#PTTChat', AppHost).css({
      top: '0',
      left: '0',
      right: 'auto',
      width: '100%',
      overflow: 'visible'
    })
    $('#PTTMainBtn', AppHost).css({
      top: '0',
      left: buttonLeft,
      width: '32px',
      height: '32px',
      padding: '0',
      fontSize: '18px',
      lineHeight: '30px',
      borderRadius: '4px',
      zIndex: '2147483001'
    })
    $('#PTTMain', AppHost).css({
      top: panelTop,
      right: '0',
      left: 'auto',
      width: '100%',
      zIndex: '2147483001'
    })
  }

  function teardownCurrentApp () {
    if (appHandle && typeof appHandle.unmount === 'function') {
      appHandle.unmount()
      appHandle = null
      return
    }

    const app = document.getElementById('PTTChat')
    if (app && app.parentNode) app.parentNode.removeChild(app)
  }

  function resetVideoRelatedState () {
    store.dispatch('clearChat')
    ;[
      'videoType',
      'videoStartTime',
      'videoEndTime',
      'videoPlayedTime',
      'videoCurrentTime',
      'commentIndex'
    ].forEach(type => store.dispatch('removeLog', type))
  }

  function normalizeStreamingType (value) {
    if (typeof value !== 'string') return null
    if (/^vod$/i.test(value) || /^archive$/i.test(value)) return false
    if (/^live$/i.test(value)) return true
    return null
  }

  function readBooleanField (value) {
    if (!value || typeof value !== 'object') return null
    if (typeof value.hasVOD === 'boolean') return value.hasVOD
    if (typeof value.hasVod === 'boolean') return value.hasVod
    return null
  }

  function readDateField (value) {
    if (!value || typeof value !== 'object') return null
    if (value instanceof Date) return Number.isNaN(value.valueOf()) ? null : value
    if (typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000))
    }
    if (typeof value._seconds === 'number') {
      return new Date(value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1000000))
    }
    return null
  }

  function findVideoInfo (eventVideoMap, videoId) {
    if (!eventVideoMap || typeof eventVideoMap !== 'object') return null
    if (videoId && eventVideoMap[videoId]) return eventVideoMap[videoId]
    const values = Object.keys(eventVideoMap).map(key => eventVideoMap[key])
    return values.find(video => video && (video._id === videoId || video.id === videoId)) || null
  }

  function pushReactInternals (element, stack) {
    if (!element) return
    Object.keys(element).forEach(key => {
      if (/^__react/.test(key)) stack.push(element[key])
    })
  }

  function readSpwnStateFromReactInternals () {
    const stack = []
    const root = document.getElementById('root')
    pushReactInternals(root, stack)
    pushReactInternals(document.querySelector('.theoplayer-container'), stack)
    pushReactInternals(document.getElementById('aws-video-player'), stack)

    const seen = new WeakSet()
    const videoId = getCurrentVideoId()
    const result = {
      streamingType: null,
      eventHasVOD: null,
      videoHasVOD: null
    }
    let scanned = 0

    while (stack.length > 0 && scanned < 8000) {
      const current = stack.pop()
      if (!current || typeof current !== 'object' || seen.has(current)) continue
      seen.add(current)
      scanned++

      const streamingType = normalizeStreamingType(current.streamingType)
      if (typeof streamingType === 'boolean') result.streamingType = streamingType

      const eventVideoMap = current.eventVideoMap || (current.props && current.props.eventVideoMap)
      const videoInfo = findVideoInfo(eventVideoMap, videoId)
      const videoHasVOD = readBooleanField(videoInfo)
      if (typeof videoHasVOD === 'boolean') result.videoHasVOD = videoHasVOD

      const eventInfo = current.eventInfo || current.event || (current.props && (current.props.eventInfo || current.props.event))
      const eventHasVOD = readBooleanField(eventInfo)
      if (typeof eventHasVOD === 'boolean') result.eventHasVOD = eventHasVOD

      ;[
        'child',
        'sibling',
        'return',
        'alternate',
        'memoizedProps',
        'pendingProps',
        'props',
        'memoizedState',
        'state',
        'stateNode'
      ].forEach(key => {
        const value = current[key]
        if (value && typeof value === 'object') stack.push(value)
      })
    }

    if (typeof result.streamingType === 'boolean') return result.streamingType
    if (typeof result.eventHasVOD === 'boolean') {
      if (typeof result.videoHasVOD === 'boolean') return !(result.eventHasVOD && result.videoHasVOD)
      return !result.eventHasVOD
    }
    return null
  }

  function readSpwnVideoMetaFromReactInternals () {
    const stack = []
    const root = document.getElementById('root')
    pushReactInternals(root, stack)
    pushReactInternals(document.querySelector('.theoplayer-container'), stack)
    pushReactInternals(document.getElementById('aws-video-player'), stack)

    const seen = new WeakSet()
    const videoId = getCurrentVideoId()
    const result = {
      videoStartDate: null,
      videoPublishDate: null,
      videoEndDate: null,
      videoDuration: null
    }
    let scanned = 0

    while (stack.length > 0 && scanned < 8000) {
      const current = stack.pop()
      if (!current || typeof current !== 'object' || seen.has(current)) continue
      seen.add(current)
      scanned++

      const eventVideoMap = current.eventVideoMap || (current.props && current.props.eventVideoMap)
      const videoInfo = findVideoInfo(eventVideoMap, videoId)
      if (videoInfo) {
        const chatStart = readDateField(videoInfo.chatDatetime)
        if (chatStart) result.videoStartDate = chatStart

        const publishStart = readDateField(videoInfo.startAt)
        if (publishStart) result.videoPublishDate = publishStart

        const videoEnd = readDateField(videoInfo.endAt)
        if (videoEnd) result.videoEndDate = videoEnd

        if (typeof videoInfo.duration === 'number' && Number.isFinite(videoInfo.duration) && videoInfo.duration > 0) {
          result.videoDuration = videoInfo.duration
        }
      }

      if (!result.videoStartDate) {
        const eventStart = readDateField(current.eventStart || (current.state && current.state.eventStart) || current.memoizedState)
        if (eventStart) result.videoStartDate = eventStart
      }

      if (result.videoStartDate && result.videoPublishDate && result.videoEndDate && result.videoDuration) return result

      ;[
        'child',
        'sibling',
        'return',
        'alternate',
        'memoizedProps',
        'pendingProps',
        'props',
        'memoizedState',
        'state',
        'stateNode'
      ].forEach(key => {
        const value = current[key]
        if (value && typeof value === 'object') stack.push(value)
      })
    }

    return result
  }

  function detectByVisibleStatusText () {
    const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"], [class*="badge"], [class*="Badge"], [class*="label"], [class*="Label"]')
    for (let index = 0; index < statusElements.length; index++) {
      const element = statusElements[index]
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      const text = (element.textContent || '').trim()
      if (!text || text.length > 80) continue
      if (/アーカイブ配信|archive|vod|video on demand/i.test(text)) return false
      if (/配信中|ライブ配信|\blive\b/i.test(text)) return true
    }
    return null
  }

  function detectByPlayerDuration () {
    const video = document.getElementById('aws-video-player') || document.querySelector('.theoplayer-container video') || document.querySelector('video')
    if (!video || video.readyState === 0) return null
    if (video.duration === Infinity) return true
    if (Number.isFinite(video.duration) && video.duration > 0) return false
    return null
  }

  function checkVideoType () {
    const reactStateType = readSpwnStateFromReactInternals()
    if (typeof reactStateType === 'boolean') return reactStateType

    const playerType = detectByPlayerDuration()
    if (typeof playerType === 'boolean') return playerType

    const statusTextType = detectByVisibleStatusText()
    if (typeof statusTextType === 'boolean') return statusTextType

    return true
  }

  function syncVideoMetaToStore (isStream) {
    store.dispatch('isStream', isStream)
    store.dispatch('removeLog', 'videoType')
    store.dispatch('updateLog', { type: 'videoType', data: isStream ? '實況' : '影片' })

    if (isStream) return

    const videoMeta = readSpwnVideoMetaFromReactInternals()
    const videoStartDate = videoMeta.videoStartDate || videoMeta.videoPublishDate
    if (videoStartDate) {
      store.dispatch('updateVideoStartDate', videoStartDate)
    }

    const videoEndDate = (
      videoMeta.videoDuration && (videoStartDate || videoMeta.videoPublishDate)
        ? new Date((videoStartDate || videoMeta.videoPublishDate).valueOf() + videoMeta.videoDuration * 1000)
        : null
    ) || videoMeta.videoEndDate
    if (videoEndDate) {
      store.dispatch('removeLog', 'videoEndTime')
      store.dispatch('updateLog', { type: 'videoEndTime', data: videoEndDate.toLocaleDateString() + ' ' + videoEndDate.toLocaleTimeString() })
      return
    }

    if (!videoStartDate) store.dispatch('removeLog', 'videoStartTime')
    store.dispatch('removeLog', 'videoEndTime')
  }

  function CheckChatInstanced () {
    if (!isStreamingPage()) {
      lastPageToken = null
      lastIsStream = null
      waitingActionBarLogged = false
      teardownCurrentApp()
      scheduleCheck(2000)
      return
    }

    if (!getSpwnActionBar()) {
      if (!waitingActionBarLogged) {
        spwnDebug('waiting for streaming action bar before mounting P button', { href: window.location.href })
        waitingActionBarLogged = true
      }
      scheduleCheck(500)
      return
    }
    if (waitingActionBarLogged) {
      spwnDebug('streaming action bar found, mounting P button')
      waitingActionBarLogged = false
    }

    const currentPageToken = getPageToken()
    const isStream = checkVideoType()
    syncVideoMetaToStore(isStream)

    if (appHandle && (currentPageToken !== lastPageToken || isStream !== lastIsStream)) {
      teardownCurrentApp()
      resetVideoRelatedState()
    }

    const AppHost = getOrCreateAppHost()
    if (!AppHost) {
      scheduleCheck(500)
      return
    }
    applySpwnAppLayout(AppHost)
    const PTTApp = $('#PTTChat', AppHost)
    if (PTTApp.length < 1) {
      if (store.getters.getPluginHeight <= 0) {
        store.dispatch('setPluginHeight', Math.max(window.innerHeight - 20, 320))
      }
      appHandle = InitApp(AppHost, WhiteTheme, isStream, msg, siteName)
      setTimeout(() => applySpwnAppLayout(AppHost), 0)
      ChangeLog()
    }

    lastPageToken = currentPageToken
    lastIsStream = isStream
    scheduleCheck(1000)
  }

  CheckChatInstanced()
}
