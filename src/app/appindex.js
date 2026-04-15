import PttApp from './PttApp.vue'
import PttAppButton from './PttAppButton.vue'
import { createApp, h, markRaw } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import { store } from './store/store'
let appinscount = 0
/**
 *
 * @param {*} chatContainer
 * @param {*} isWhitetheme
 * @param {*} isStreaming
 * @param {*} messagePoster
 */
export default function InitApp (
  chatContainer,
  isWhitetheme,
  isStreaming,
  messagePoster,
  siteName
) {
  // generate crypt key everytime;
  InitChatApp(chatContainer)
  function InitChatApp (cn) {
    const shouldSyncPluginHeight = siteName === 'Youtube'

    function getChatContainerHeight () {
      const containerElement = cn && cn[0]
      if (!containerElement) return 0

      const rectHeight = Math.round(containerElement.getBoundingClientRect().height || 0)
      const clientHeight = Math.round(containerElement.clientHeight || 0)
      const offsetHeight = Math.round(containerElement.offsetHeight || 0)
      return Math.max(rectHeight, clientHeight, offsetHeight, 0)
    }

    function getYoutubePlayerResponse () {
      // movie_player.getPlayerResponse() is updated on every video load including SPA navigation.
      // ytInitialPlayerResponse is only set on full page load (server-side), not on SPA navigation.
      try {
        const moviePlayer = document.getElementById('movie_player')
        if (moviePlayer && typeof moviePlayer.getPlayerResponse === 'function') {
          const response = moviePlayer.getPlayerResponse()
          if (response && response.microformat) return response
        }
      } catch (e) { /* ignore */ }
      const globalWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
      return globalWindow.ytInitialPlayerResponse || window.ytInitialPlayerResponse
    }

    function parseDateSafe (value) {
      if (!value) return null
      const parsedDate = new Date(value)
      return Number.isNaN(parsedDate.valueOf()) ? null : parsedDate
    }

    function getYoutubeTimeline () {
      const playerResponse = getYoutubePlayerResponse()
      if (!playerResponse) return {}

      const microformat = playerResponse.microformat && playerResponse.microformat.playerMicroformatRenderer
      const liveBroadcastDetails = microformat && microformat.liveBroadcastDetails

      const startDate = parseDateSafe(
        (liveBroadcastDetails && liveBroadcastDetails.startTimestamp) ||
        (microformat && microformat.publishDate) ||
        (microformat && microformat.uploadDate)
      )
      const endDate = parseDateSafe(liveBroadcastDetails && liveBroadcastDetails.endTimestamp)

      return { startDate, endDate, playerResponse }
    }

    /* -----------------------------------preInitApp----------------------------------- */
    // init property
    const ele = document.createElement('div')
    // Keep mount container ID distinct so selector-based layout logic always targets
    // the rendered app root (#PTTChat) instead of an empty wrapper.
    ele.id = 'PTTChatMount'
    if (cn) cn[0].appendChild(ele)
    const bootsrtapicon = document.createElement('link')
    bootsrtapicon.setAttribute('rel', 'stylesheet')
    bootsrtapicon.setAttribute('href', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.2/font/bootstrap-icons.css')
    if (cn) cn[0].appendChild(bootsrtapicon)

    const themewhite = 'pttbgc-19 pttc-5'
    const themedark = 'pttbgc-2 pttc-2'

    const chatHeight = getChatContainerHeight()
    if (shouldSyncPluginHeight && store.getters.getPluginHeight <= 0 && chatHeight > 0) {
      store.dispatch('setPluginHeight', chatHeight)
      if (showAllLog) console.log('PluginHeight auto initialized from chat container:', chatHeight)
    } else if (siteName === 'Holodex' && store.getters.getPluginHeight <= 1) {
      store.dispatch('setPluginHeight', 400)
      if (showAllLog) console.log('PluginHeight restored for Holodex:', 400)
    }

    if (showAllLog)console.log('Instance PTTChatOnYT App, index', appinscount)
    const pttRootOptions = {
      store,
      components: {
        PTTAppBtn: PttAppButton,
        PTTApp: PttApp
      },
      provide: function () {
        return {
          msg: markRaw(this.rootmsg),
          isStream: isStreaming,
          nowPluginWidth: GM_getValue('PluginWidth', 400)
        }
      },
      data () {
        return {
          index: appinscount,
          rootmsg: markRaw(messagePoster),
          player: document.getElementsByTagName('video')[0],
          playertime: null,
          exist: null,
          customPluginSettingListenerId: 0,
          chatContainerResizeObserver: null,
          syncPluginHeightHandler: null
        }
      },
      computed: {
        classes: function () {
          const classes = ['position-absolute', 'w-100']
          if (reportMode) console.log('Appindex set theme', this.getTheme)
          switch (+this.getTheme) {
            case 0:
              if (isWhitetheme) {
                classes.push(themewhite)
              } else {
                classes.push(themedark)
              }
              break
            case 1:
              classes.push(themewhite)
              break
            case 2:
              classes.push(themedark)
              break
            case 3:
              classes.push('pttbgc-' + this.getThemeColorBG)
              classes.push('pttc-' + (10 - this.getThemeColorBorder))
              break
            default:
              break
          }
          return classes.join(' ')
        },
        ...Vuex.mapGetters([
          'getTheme',
          'getThemeColorBG',
          'getThemeColorBorder'
        ])
      },
      mounted () {
        const syncPluginHeight = () => {
          if (!shouldSyncPluginHeight) return

          const nextHeight = getChatContainerHeight()
          if (nextHeight > 0 && nextHeight !== this.$store.getters.getPluginHeight) {
            this.$store.dispatch('setPluginHeight', nextHeight)
            if (showAllLog) console.log('PluginHeight synced from chat container:', nextHeight)
          }
        }

        this.$store.dispatch('updateLog', { type: 'videoType', data: isStreaming ? '實況' : '影片' })
        this.customPluginSettingListenerId = GM_addValueChangeListener('menuCommand-customPluginSetting-' + siteName,
          (name, oldValue, newValue, remote) => this.$store.dispatch('setCustomPluginSetting', newValue)
        )
        this.$store.dispatch('setSiteName', siteName)
        this.$store.dispatch('setCustomPluginSetting', GM_getValue('menuCommand-customPluginSetting-' + siteName, false))
        if (showAllLog)console.log('dispatch setCustomPluginSetting', GM_getValue('menuCommand-customPluginSetting-' + siteName, false))
        appinscount++
        if (shouldSyncPluginHeight) {
          this.syncPluginHeightHandler = syncPluginHeight
          syncPluginHeight()
          window.addEventListener('resize', this.syncPluginHeightHandler, true)
          window.addEventListener('yt-player-updated', this.syncPluginHeightHandler, true)
          window.addEventListener('yt-navigate-finish', this.syncPluginHeightHandler, true)
        }
        if (shouldSyncPluginHeight && typeof ResizeObserver === 'function' && cn && cn[0]) {
          this.chatContainerResizeObserver = new ResizeObserver(() => {
            syncPluginHeight()
          })
          this.chatContainerResizeObserver.observe(cn[0])
        }
        this.playertime = window.setInterval(() => {
          if (this.player) {
            this.$store.dispatch('updateVideoPlayedTime', this.player.currentTime)
          } else clearInterval(this.playertime)
        }, 1000)
        this.exist = window.setInterval(() => {
          const self = document.querySelector('#PTTChat[ins="' + this.index + '"')
          if (!self) {
            if (showAllLog)console.log('Instance ' + this.index + ' destroyed.')
            app.unmount()
          } else {
            // console.log("Instance " + this.index + " alive.");
          }
        }, 1000)
        this.$store.dispatch('isStream', isStreaming)
        if (!isStreaming) {
          const self = this
          let retryCount = 0
          const maxRetries = 5
          const retryDelay = 2000
          ;(function tryFetchVideoTimeline () {
            try {
              let foundStart = false

              const timeline = getYoutubeTimeline()
              if (timeline.startDate) {
                if (reportMode) console.log('startDate from ytInitialPlayerResponse', timeline.startDate)
                self.$store.dispatch('updateVideoStartDate', timeline.startDate)
                foundStart = true
              }
              if (timeline.endDate) {
                if (reportMode) console.log('endDate from ytInitialPlayerResponse', timeline.endDate)
                self.$store.dispatch('updateLog', { type: 'videoEndTime', data: timeline.endDate.toLocaleDateString() + ' ' + timeline.endDate.toLocaleTimeString() })
              }

              if (!foundStart) {
                const scriptTag = document.getElementById('scriptTag')
                if (!scriptTag || !scriptTag.innerHTML) {
                  if (reportMode) console.log('skip video publication parse: scriptTag not found')
                } else {
                  const videoinfo = JSON.parse(scriptTag.innerHTML)
                  const publication = videoinfo && videoinfo.publication && videoinfo.publication[0]
                  if (!publication || !publication.startDate) {
                    if (reportMode) console.log('skip video publication parse: invalid publication payload', videoinfo)
                  } else {
                    const startDate = parseDateSafe(publication.startDate)
                    const endDate = parseDateSafe(publication.endDate)
                    if (startDate) {
                      if (reportMode) console.log('startDate from scriptTag', startDate)
                      self.$store.dispatch('updateVideoStartDate', startDate)
                      foundStart = true
                    }
                    if (endDate) {
                      if (reportMode) console.log('endDate from scriptTag', endDate)
                      self.$store.dispatch('updateLog', { type: 'videoEndTime', data: endDate.toLocaleDateString() + ' ' + endDate.toLocaleTimeString() })
                    }
                  }
                }
              }

              if (!foundStart && retryCount < maxRetries) {
                retryCount++
                if (reportMode) console.log('video timeline not ready, retry', retryCount, '/', maxRetries)
                setTimeout(tryFetchVideoTimeline, retryDelay)
              }
            } catch (e) {
              console.log(e)
            }
          })()
        }
        this.rootmsg.pttState = data => { this.$store.dispatch('pttState', data) }
      },
      beforeUnmount () {
        GM_removeValueChangeListener(this.customPluginSettingListenerId)
        if (this.chatContainerResizeObserver) {
          this.chatContainerResizeObserver.disconnect()
          this.chatContainerResizeObserver = null
        }
        if (this.syncPluginHeightHandler) {
          window.removeEventListener('resize', this.syncPluginHeightHandler, true)
          window.removeEventListener('yt-player-updated', this.syncPluginHeightHandler, true)
          window.removeEventListener('yt-navigate-finish', this.syncPluginHeightHandler, true)
          this.syncPluginHeightHandler = null
        }
        clearInterval(this.playertime)
        clearInterval(this.exist)
      },
      render () {
        const rootStyle = { top: '0px' }
        if (siteName === 'Youtube') {
          rootStyle.pointerEvents = 'none'
        }

        return h('div', {
          id: 'PTTChat',
          class: this.classes,
          ins: this.index,
          style: rootStyle
        }, [
          h(PttAppButton),
          h(PttApp)
        ])
      }
    }

    const app = createApp(pttRootOptions)
    app.config.devtools = reportMode
    app.use(store)
    app.component('DynamicScroller', DynamicScroller)
    app.component('DynamicScrollerItem', DynamicScrollerItem)
    app.mount(ele)
  }
}
