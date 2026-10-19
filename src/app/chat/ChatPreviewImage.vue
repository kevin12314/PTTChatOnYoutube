
<template>
  <teleport to="body">
    <div style="z-index:4600;">
      <img
        v-if="previewType === 'image' && resolvedPreviewImageURL !== ''"
        ref="imgel"
        :style="style"
        :src="resolvedPreviewImageURL"
        referrerpolicy="no-referrer"
        @load="handleImageLoad"
        @error="handleImageError"
      >
      <div
        v-else-if="previewType === 'tweet' && tweetCard.visible"
        ref="tweetCard"
        :style="style"
        class="ptt-chat-preview-card"
      >
        <div class="ptt-chat-preview-card__header">
          <span class="ptt-chat-preview-card__service">X</span>
          <div
            v-if="tweetCard.avatar || tweetCard.author"
            class="ptt-chat-preview-card__identity"
          >
            <img
              v-if="tweetCard.avatar"
              class="ptt-chat-preview-card__avatar"
              :src="tweetCard.avatar"
              referrerpolicy="no-referrer"
            >
            <span
              v-if="tweetCard.author"
              class="ptt-chat-preview-card__author"
            >{{ tweetCard.author }}</span>
          </div>
        </div>
        <div
          v-if="tweetCard.text"
          class="ptt-chat-preview-card__text"
          :class="{ 'ptt-chat-preview-card__text--with-image': tweetCard.image }"
        >
          {{ tweetCard.text }}{{ tweetCard.truncated ? '…' : '' }}
        </div>
        <div
          v-if="tweetCard.truncated"
          class="ptt-chat-preview-card__meta ptt-chat-preview-card__truncated"
        >
          {{ tweetCard.fullTextLoading ? '載入完整長文中...' : '長文僅顯示部分內容，完整內容請開啟連結。' }}
        </div>
        <div
          v-if="tweetCard.image"
          class="ptt-chat-preview-card__image-wrap"
        >
          <video
            v-if="tweetCard.gifSrc"
            ref="cardGif"
            class="ptt-chat-preview-card__image"
            :src="tweetCard.gifSrc"
            :poster="tweetCard.image"
            autoplay
            loop
            muted
            playsinline
            @loadeddata="handleCardGifLoad"
            @error="handleCardGifError"
          />
          <img
            v-else
            ref="cardImage"
            class="ptt-chat-preview-card__image"
            :src="tweetCard.image"
            referrerpolicy="no-referrer"
            @load="handleCardLoad"
            @error="handleCardImageError"
          >
          <div
            v-if="tweetCard.mediaType === 'video'"
            class="ptt-chat-preview-card__media-badge"
          >
            ▶{{ tweetCard.videoDuration > 0 ? ' ' + formatVideoDuration(tweetCard.videoDuration) : '' }}
          </div>
          <div
            v-else-if="tweetCard.mediaType === 'animated_gif'"
            class="ptt-chat-preview-card__media-badge"
          >
            GIF
          </div>
          <div
            v-if="tweetCard.mediaCount > 1"
            class="ptt-chat-preview-card__image-count"
          >
            +{{ tweetCard.mediaCount - 1 }}
          </div>
        </div>
        <div
          v-if="tweetCard.description && tweetCard.description !== tweetCard.text"
          class="ptt-chat-preview-card__description"
        >
          {{ tweetCard.description }}
        </div>
        <div
          v-if="tweetCard.loading"
          class="ptt-chat-preview-card__meta"
        >
          載入貼文預覽中...
        </div>
        <div
          v-else-if="tweetCard.error"
          class="ptt-chat-preview-card__meta"
        >
          {{ tweetCard.error }}
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
/* global GM_xmlhttpRequest */
const DIRECT_IMAGE_HOSTS = ['i.urusai.cc']
const DIRECT_IMAGE_PATTERN = /\.(jpeg|jpg|gif|png|webp)(?:$|[?#])/i
const IMGUR_PAGE_HOSTS = ['imgur.com', 'www.imgur.com', 'm.imgur.com']
const IMGUR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const VERB_DIRECT_IMAGE_HOSTS = ['i.verb.tw']
const VERB_PAGE_HOSTS = ['img.verb.tw']
const VERB_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const MEEE_DIRECT_IMAGE_HOSTS = ['i.mee.com.tw', 'i.meee.com.tw']
const MEEE_PAGE_HOSTS = ['meee.com.tw', 'www.meee.com.tw']
const MEEE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const TWITTER_HOSTS = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']
const TWEET_OEMBED_ENDPOINT = 'https://publish.twitter.com/oembed'
// Lightweight JSON endpoint used by X embeds: text, author, avatar and media in a single small response.
const TWEET_SYNDICATION_ENDPOINT = 'https://cdn.syndication.twimg.com/tweet-result'
// Third-party mirror used only for long posts (note tweets): X's own endpoints return them truncated.
const TWEET_FULL_TEXT_ENDPOINT = 'https://api.fxtwitter.com/status/'
const TWEET_PREFETCH_EVENT = 'pttchat-preview-prefetch'
const TWEET_GIF_CACHE_LIMIT = 20
const PREVIEW_OFFSET = 12
const VIEWPORT_PADDING = 8
const DEFAULT_PREVIEW_SIZE = 400
const EMPTY_TWEET_CARD = Object.freeze({
  visible: false,
  loading: false,
  author: '',
  authorUrl: '',
  avatar: '',
  text: '',
  description: '',
  image: '',
  mediaCount: 0,
  mediaType: '',
  videoDuration: 0,
  gifVideo: '',
  gifSrc: '',
  truncated: false,
  fullTextLoading: false,
  complete: false,
  error: ''
})

function cloneEmptyTweetCard () {
  return { ...EMPTY_TWEET_CARD }
}

export default {
  data () {
    return {
      mousex: 0,
      mousey: 0,
      w: 0,
      h: 0,
      mouseMoveHandler: null,
      previewPointerHandler: null,
      previewIndex: 0,
      previewType: 'none',
      previewImageUrlToken: 0,
      previewBlobUrl: '',
      resolvedPreviewImageURL: '',
      tweetCard: cloneEmptyTweetCard(),
      tweetPreviewCache: {},
      tweetAvatarCache: {},
      tweetMediaCache: {},
      activeTweetRequestUrl: '',
      prefetchHandler: null
    }
  },

  computed: {
    preview: function () {
      if (this.previewType === 'image') return this.resolvedPreviewImageURL !== ''
      if (this.previewType === 'tweet') return this.tweetCard.visible
      return false
    },
    style: function () {
      const styles = {
        position: 'fixed',
        display: 'none',
        zIndex: '2147483647',
        pointerEvents: 'none',
        left: '-10000px',
        top: '-10000px',
        marginTop: '0.5rem',
        marginBottom: '0.5rem'
      }
      if (!this.preview) return styles

      const width = this.w > 0 ? this.w : DEFAULT_PREVIEW_SIZE
      const height = this.h > 0 ? this.h : DEFAULT_PREVIEW_SIZE
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const maxLeft = Math.max(VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING)
      const maxTop = Math.max(VIEWPORT_PADDING, viewportHeight - height - VIEWPORT_PADDING)

      let left = this.mousex + PREVIEW_OFFSET
      let top = this.mousey + PREVIEW_OFFSET

      if (left + width + VIEWPORT_PADDING > viewportWidth) left = this.mousex - width - PREVIEW_OFFSET
      if (top + height + VIEWPORT_PADDING > viewportHeight) top = this.mousey - height - PREVIEW_OFFSET

      left = Math.min(Math.max(left, VIEWPORT_PADDING), maxLeft)
      top = Math.min(Math.max(top, VIEWPORT_PADDING), maxTop)

      return {
        position: 'fixed',
        display: 'block',
        zIndex: '2147483647',
        pointerEvents: 'none',
        maxHeight: this.previewType === 'tweet' ? '520px' : '400px',
        maxWidth: this.previewType === 'tweet' ? '360px' : '400px',
        left: left + 'px',
        top: top + 'px',
        marginTop: '0.5rem',
        marginBottom: '0.5rem'
      }
    },
    previewImageCandidates: function () {
      return this.resolvePreviewImageCandidates(this.previewImage)
    },
    previewImageURL: function () {
      return this.previewImageCandidates[this.previewIndex] || ''
    },
    ...Vuex.mapGetters(['previewImage'])
  },
  watch: {
    previewImage: {
      immediate: true,
      handler (value) {
        this.previewIndex = 0
        this.w = 0
        this.h = 0
        this.updatePreviewState(value)
      }
    },
    previewIndex () {
      this.w = 0
      this.h = 0
    },
    previewImageURL: {
      immediate: true,
      handler (value) {
        this.resolvePreviewImageUrl(value)
      }
    }
  },
  created () {
    // In-flight tweet requests keyed by canonical URL, so hover prefetch and the real preview share one request.
    this.tweetPendingRequests = {}
    // GIF mp4 blob URLs keyed by video URL, oldest first.
    this.tweetGifRequests = new Map()
    // Full text of long posts keyed by canonical URL; resolves to '' when unavailable.
    this.tweetFullTextRequests = {}
  },
  mounted () {
    this.mouseMoveHandler = (event) => {
      this.mousex = event.clientX
      this.mousey = event.clientY
    }
    this.previewPointerHandler = (event) => {
      if (!event || !event.detail) return
      this.mousex = event.detail.x
      this.mousey = event.detail.y
    }
    this.prefetchHandler = (event) => {
      if (!event || !event.detail) return
      this.prefetchTweetPreview(event.detail.url)
    }
    document.body.addEventListener('mousemove', this.mouseMoveHandler)
    window.addEventListener('pttchat-preview-pointer', this.previewPointerHandler)
    window.addEventListener(TWEET_PREFETCH_EVENT, this.prefetchHandler)
  },
  beforeUnmount () {
    this.previewImageUrlToken++
    this.revokePreviewBlobUrl()
    this.tweetGifRequests.forEach(request => request.then(blobUrl => { if (blobUrl) URL.revokeObjectURL(blobUrl) }))
    this.tweetGifRequests.clear()
    if (this.mouseMoveHandler) {
      document.body.removeEventListener('mousemove', this.mouseMoveHandler)
      this.mouseMoveHandler = null
    }
    if (this.previewPointerHandler) {
      window.removeEventListener('pttchat-preview-pointer', this.previewPointerHandler)
      this.previewPointerHandler = null
    }
    if (this.prefetchHandler) {
      window.removeEventListener(TWEET_PREFETCH_EVENT, this.prefetchHandler)
      this.prefetchHandler = null
    }
  },
  methods: {
    updatePreviewState (value) {
      const imageCandidates = this.resolvePreviewImageCandidates(value)
      if (imageCandidates.length > 0) {
        this.previewType = 'image'
        this.resetTweetCard()
        return
      }

      const tweetUrl = this.getTweetCanonicalUrl(value)
      if (tweetUrl !== null) {
        this.previewType = 'tweet'
        this.loadTweetPreview(tweetUrl)
        return
      }

      this.previewType = 'none'
      this.resetTweetCard()
    },
    resetTweetCard () {
      this.activeTweetRequestUrl = ''
      this.tweetCard = cloneEmptyTweetCard()
    },
    revokePreviewBlobUrl () {
      if (!this.previewBlobUrl) return
      URL.revokeObjectURL(this.previewBlobUrl)
      this.previewBlobUrl = ''
    },
    async resolvePreviewImageUrl (url) {
      const token = ++this.previewImageUrlToken
      this.revokePreviewBlobUrl()

      if (!url) {
        this.resolvedPreviewImageURL = ''
        return
      }

      if (!this.shouldUseBlobPreview(url)) {
        this.resolvedPreviewImageURL = url
        return
      }

      try {
        const response = await fetch(url, { method: 'GET' })
        if (!response.ok) throw new Error('Request failed with status ' + response.status)

        const imageBlob = await response.blob()
        if (token !== this.previewImageUrlToken) return

        const blobUrl = URL.createObjectURL(imageBlob)
        this.previewBlobUrl = blobUrl
        this.resolvedPreviewImageURL = blobUrl
      } catch (error) {
        if (token !== this.previewImageUrlToken) return
        this.resolvedPreviewImageURL = url
      }
    },
    shouldUseBlobPreview (text) {
      const url = this.parseURL(text)
      if (url === null) return false
      return VERB_DIRECT_IMAGE_HOSTS.includes(url.host)
    },
    handleImageLoad () {
      const imageElement = this.$refs.imgel
      if (!imageElement) return

      const rect = imageElement.getBoundingClientRect()
      this.w = rect.width || imageElement.width || DEFAULT_PREVIEW_SIZE
      this.h = rect.height || imageElement.height || DEFAULT_PREVIEW_SIZE
    },
    handleImageError () {
      this.w = 0
      this.h = 0
      if (this.previewIndex < this.previewImageCandidates.length - 1) {
        this.previewIndex++
        return
      }
      this.previewIndex = this.previewImageCandidates.length
    },
    handleCardLoad () {
      this.$nextTick(() => this.measureCard())
    },
    handleCardImageError () {
      this.tweetCard = {
        ...this.tweetCard,
        image: '',
        mediaCount: 0,
        mediaType: ''
      }
      this.$nextTick(() => this.measureCard())
    },
    handleCardGifLoad () {
      const gifElement = this.$refs.cardGif
      if (gifElement) {
        // Vue binds `muted` as a DOM property after insertion; re-assert it so autoplay is not blocked.
        gifElement.muted = true
        gifElement.play().catch(() => {})
      }
      this.handleCardLoad()
    },
    handleCardGifError () {
      // Fall back to the static thumbnail.
      this.tweetCard = {
        ...this.tweetCard,
        gifVideo: '',
        gifSrc: ''
      }
      this.$nextTick(() => this.measureCard())
    },
    measureCard () {
      this.$nextTick(() => {
        const cardElement = this.$refs.tweetCard
        if (!cardElement) return
        const rect = cardElement.getBoundingClientRect()
        this.w = rect.width || 360
        this.h = rect.height || 220
      })
    },
    resolvePreviewImageCandidates (text) {
      if (!text) return []

      const candidates = this.getVerbImageCandidates(text) ||
        this.getNormalImageCandidates(text) ||
        this.getMeeeImageCandidates(text) ||
        this.getKnownHostImageCandidates(text) ||
        this.getImgurImageCandidates(text) ||
        this.getYoutubeImageCandidates(text) ||
        []

      return candidates
    },
    getTweetCanonicalUrl (text) {
      const url = this.parseURL(text)
      if (url === null || !TWITTER_HOSTS.includes(url.host)) return null

      const pathParts = url.pathname.split('/').filter(Boolean)
      const statusIndex = pathParts.indexOf('status')
      if (statusIndex < 0) return null

      const tweetId = pathParts[statusIndex + 1]
      if (!/^\d+$/.test(tweetId)) return null

      return 'https://x.com/i/status/' + tweetId
    },
    parseURL (text) {
      try {
        return new URL(text)
      } catch (e) {
        return null
      }
    },
    async loadTweetPreview (tweetUrl) {
      this.activeTweetRequestUrl = tweetUrl

      if (this.tweetPreviewCache[tweetUrl]) {
        this.tweetCard = {
          ...this.tweetPreviewCache[tweetUrl],
          visible: true,
          loading: false,
          error: ''
        }
        this.ensureTweetAvatar(tweetUrl, this.tweetPreviewCache[tweetUrl].authorUrl)
        this.ensureTweetMedia(tweetUrl)
        this.ensureTweetGif(tweetUrl)
        this.ensureTweetFullText(tweetUrl)
        this.$nextTick(() => this.measureCard())
        return
      }

      this.tweetCard = {
        ...cloneEmptyTweetCard(),
        visible: true,
        loading: true
      }
      this.$nextTick(() => this.measureCard())

      try {
        const nextCard = await this.requestTweetPreview(tweetUrl)
        if (this.activeTweetRequestUrl !== tweetUrl || this.getTweetCanonicalUrl(this.previewImage) !== tweetUrl) return

        this.tweetCard = nextCard
        this.ensureTweetAvatar(tweetUrl, nextCard.authorUrl)
        this.ensureTweetMedia(tweetUrl)
        this.ensureTweetGif(tweetUrl)
        this.ensureTweetFullText(tweetUrl)
        this.$nextTick(() => this.measureCard())
      } catch (error) {
        if (this.activeTweetRequestUrl !== tweetUrl || this.getTweetCanonicalUrl(this.previewImage) !== tweetUrl) return
        this.tweetCard = {
          ...cloneEmptyTweetCard(),
          visible: true,
          loading: false,
          error: '目前無法載入這則貼文預覽。'
        }
        this.$nextTick(() => this.measureCard())
      }
    },
    prefetchTweetPreview (text) {
      const tweetUrl = this.getTweetCanonicalUrl(text)
      if (tweetUrl === null || this.tweetPreviewCache[tweetUrl]) return
      this.requestTweetPreview(tweetUrl).catch(() => {})
    },
    requestTweetPreview (tweetUrl) {
      if (this.tweetPendingRequests[tweetUrl]) return this.tweetPendingRequests[tweetUrl]

      const request = this.fetchTweetPreview(tweetUrl).then(previewData => {
        const nextCard = {
          visible: true,
          loading: false,
          author: previewData.author,
          authorUrl: previewData.authorUrl,
          avatar: previewData.avatar || '',
          text: previewData.text,
          description: previewData.description,
          image: previewData.image,
          mediaCount: previewData.mediaCount || 0,
          mediaType: previewData.mediaType || '',
          videoDuration: previewData.videoDuration || 0,
          gifVideo: previewData.gifVideo || '',
          gifSrc: '',
          truncated: Boolean(previewData.truncated),
          fullTextLoading: Boolean(previewData.truncated),
          complete: Boolean(previewData.complete),
          error: previewData.text || previewData.image ? '' : '目前無法解析這則貼文預覽。'
        }
        this.tweetPreviewCache = {
          ...this.tweetPreviewCache,
          [tweetUrl]: nextCard
        }
        this.preloadTweetImages(nextCard)
        if (nextCard.gifVideo) this.resolveTweetGif(nextCard.gifVideo)
        if (nextCard.truncated) this.resolveTweetFullText(tweetUrl)
        return nextCard
      }).finally(() => {
        delete this.tweetPendingRequests[tweetUrl]
      })

      this.tweetPendingRequests[tweetUrl] = request
      return request
    },
    async ensureTweetFullText (tweetUrl) {
      const cached = this.tweetPreviewCache[tweetUrl]
      if (!cached || !cached.truncated) return

      const fullText = await this.resolveTweetFullText(tweetUrl)
      const update = fullText
        ? { text: fullText, truncated: false, fullTextLoading: false }
        : { fullTextLoading: false }

      if (this.tweetPreviewCache[tweetUrl]) {
        this.tweetPreviewCache = {
          ...this.tweetPreviewCache,
          [tweetUrl]: {
            ...this.tweetPreviewCache[tweetUrl],
            ...update
          }
        }
      }

      if (this.activeTweetRequestUrl === tweetUrl && this.getTweetCanonicalUrl(this.previewImage) === tweetUrl) {
        this.tweetCard = {
          ...this.tweetCard,
          ...update
        }
        this.$nextTick(() => this.measureCard())
      }
    },
    resolveTweetFullText (tweetUrl) {
      if (!this.tweetFullTextRequests[tweetUrl]) {
        const tweetId = tweetUrl.split('/').pop()
        this.tweetFullTextRequests[tweetUrl] = this.gmRequest(TWEET_FULL_TEXT_ENDPOINT + tweetId, 'json', { anonymous: true })
          .then(response => {
            const text = response && response.tweet && response.tweet.text
            return text ? this.normalizeTweetText(text) : ''
          })
          .catch(() => '')
      }
      return this.tweetFullTextRequests[tweetUrl]
    },
    async ensureTweetGif (tweetUrl) {
      const gifVideo = this.tweetCard.gifVideo
      if (!gifVideo || this.tweetCard.gifSrc) return

      const gifSrc = await this.resolveTweetGif(gifVideo)
      if (!gifSrc || this.activeTweetRequestUrl !== tweetUrl || this.tweetCard.gifVideo !== gifVideo) return

      this.tweetCard = {
        ...this.tweetCard,
        gifSrc
      }
      this.$nextTick(() => this.measureCard())
    },
    resolveTweetGif (gifVideo) {
      // video.twimg.com rejects requests with a foreign Referer and <video> cannot opt out,
      // so download through GM_xmlhttpRequest (no page Referer) and play a blob URL.
      if (this.tweetGifRequests.has(gifVideo)) return this.tweetGifRequests.get(gifVideo)

      const request = this.gmRequest(gifVideo, 'blob', { anonymous: true })
        .then(blob => URL.createObjectURL(blob))
        .catch(() => {
          this.tweetGifRequests.delete(gifVideo)
          return ''
        })
      this.tweetGifRequests.set(gifVideo, request)

      if (this.tweetGifRequests.size > TWEET_GIF_CACHE_LIMIT) {
        const [oldestUrl, oldestRequest] = this.tweetGifRequests.entries().next().value
        this.tweetGifRequests.delete(oldestUrl)
        oldestRequest.then(blobUrl => {
          if (blobUrl && this.tweetCard.gifSrc !== blobUrl) URL.revokeObjectURL(blobUrl)
        })
      }
      return request
    },
    preloadTweetImages (card) {
      // Warm the browser cache so the avatar and media appear together with the text.
      [card.avatar, card.image].filter(Boolean).forEach(src => {
        const image = new Image()
        image.referrerPolicy = 'no-referrer'
        image.src = src
      })
    },
    async fetchTweetPreview (tweetUrl) {
      try {
        const syndicationResponse = await this.gmRequest(this.getTweetSyndicationUrl(tweetUrl), 'json', { anonymous: true })
        const parsedFromSyndication = this.parseTweetPreviewFromSyndication(syndicationResponse)
        if (parsedFromSyndication.text || parsedFromSyndication.image) return parsedFromSyndication
      } catch (error) {
        // Syndication may reject some tweets (deleted, age-restricted); fall back to oEmbed.
      }

      const oembedUrl = TWEET_OEMBED_ENDPOINT + '?omit_script=true&url=' + encodeURIComponent(tweetUrl)
      try {
        const oembedResponse = await this.gmRequest(oembedUrl, 'json')
        const parsedFromOembed = this.parseTweetPreviewFromOembed(oembedResponse)
        // Avatar is resolved afterwards by ensureTweetAvatar so the text is not blocked by the profile page.
        if (parsedFromOembed.text || parsedFromOembed.author) return parsedFromOembed
      } catch (error) {
        // Local/dev pages may be blocked by publish.twitter.com CORS changes; fall back to tweet HTML.
      }

      const html = await this.gmRequest(tweetUrl, 'text', { anonymous: true })
      const parsedFromHtml = this.parseTweetPreviewFromHtml(html)
      return parsedFromHtml
    },
    getTweetSyndicationUrl (tweetUrl) {
      const tweetId = tweetUrl.split('/').pop()
      // Same token derivation as X's own embed widget.
      const token = ((Number(tweetId) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '')
      return TWEET_SYNDICATION_ENDPOINT + '?id=' + tweetId + '&lang=zh-tw&token=' + token
    },
    parseTweetPreviewFromSyndication (response) {
      const empty = { author: '', authorUrl: '', avatar: '', text: '', description: '', image: '', mediaCount: 0, truncated: false, complete: false }
      if (!response || !response.user) return empty

      const user = response.user
      const entities = response.entities || {}
      let text = response.text || ''
      ;(entities.media || []).forEach(media => {
        if (media.url) text = text.split(media.url).join('')
      })
      ;(entities.urls || []).forEach(link => {
        if (link.url && link.expanded_url) text = text.split(link.url).join(link.expanded_url)
      })

      const mediaDetails = (response.mediaDetails || []).filter(media => media.media_url_https)
      const firstMedia = mediaDetails[0] || {}
      const videoInfo = firstMedia.video_info || {}
      const avatar = user.profile_image_url_https || ''

      return {
        author: user.name || '',
        authorUrl: user.screen_name ? 'https://x.com/' + user.screen_name : '',
        avatar: avatar.replace(/_normal(?=\.[a-z0-9]+(?:[?#].*)?$)/i, '_200x200'),
        text: this.normalizeTweetText(text),
        description: '',
        image: firstMedia.media_url_https || '',
        mediaCount: mediaDetails.length,
        truncated: Boolean(response.note_tweet),
        mediaType: firstMedia.type || '',
        videoDuration: firstMedia.type === 'video' ? (videoInfo.duration_millis || 0) : 0,
        gifVideo: firstMedia.type === 'animated_gif' ? this.pickSmallestMp4(videoInfo.variants) : '',
        complete: true
      }
    },
    pickSmallestMp4 (variants) {
      const mp4List = (variants || [])
        .filter(variant => variant.content_type === 'video/mp4' && variant.url)
        .sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0))
      return mp4List.length > 0 ? mp4List[0].url : ''
    },
    formatVideoDuration (millis) {
      const totalSeconds = Math.round(millis / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = String(totalSeconds % 60).padStart(2, '0')
      if (hours > 0) return hours + ':' + String(minutes).padStart(2, '0') + ':' + seconds
      return minutes + ':' + seconds
    },
    async ensureTweetAvatar (tweetUrl, authorUrl) {
      if (!authorUrl) return
      const cached = this.tweetPreviewCache[tweetUrl]
      if (cached && (cached.avatar || cached.complete)) {
        return
      }

      const avatar = await this.resolveTweetAuthorAvatar(authorUrl)
      if (!avatar) return

      if (this.tweetPreviewCache[tweetUrl]) {
        this.tweetPreviewCache = {
          ...this.tweetPreviewCache,
          [tweetUrl]: {
            ...this.tweetPreviewCache[tweetUrl],
            avatar
          }
        }
      }

      if (this.activeTweetRequestUrl === tweetUrl && this.getTweetCanonicalUrl(this.previewImage) === tweetUrl) {
        this.tweetCard = {
          ...this.tweetCard,
          avatar
        }
        this.$nextTick(() => this.measureCard())
      }
    },
    async ensureTweetMedia (tweetUrl) {
      if (!tweetUrl) return
      const cached = this.tweetPreviewCache[tweetUrl]
      if (cached && (cached.image || cached.complete)) return

      const media = await this.resolveTweetMedia(tweetUrl)
      if (!media.image) return

      if (this.tweetPreviewCache[tweetUrl]) {
        this.tweetPreviewCache = {
          ...this.tweetPreviewCache,
          [tweetUrl]: {
            ...this.tweetPreviewCache[tweetUrl],
            image: media.image,
            mediaCount: media.count
          }
        }
      }

      if (this.activeTweetRequestUrl === tweetUrl && this.getTweetCanonicalUrl(this.previewImage) === tweetUrl) {
        this.tweetCard = {
          ...this.tweetCard,
          image: media.image,
          mediaCount: media.count
        }
        this.$nextTick(() => this.measureCard())
      }
    },
    async resolveTweetAuthorAvatar (authorUrl) {
      if (!authorUrl) return ''
      if (Object.prototype.hasOwnProperty.call(this.tweetAvatarCache, authorUrl)) {
        return this.tweetAvatarCache[authorUrl]
      }

      try {
        const html = await this.gmRequest(authorUrl, 'text', { anonymous: true })
        const avatar = this.extractTweetAuthorAvatar(html, authorUrl)
        this.tweetAvatarCache = {
          ...this.tweetAvatarCache,
          [authorUrl]: avatar
        }
        return avatar
      } catch (error) {
        this.tweetAvatarCache = {
          ...this.tweetAvatarCache,
          [authorUrl]: ''
        }
        return ''
      }
    },
    async resolveTweetMedia (tweetUrl) {
      if (!tweetUrl) return { image: '', count: 0 }
      if (Object.prototype.hasOwnProperty.call(this.tweetMediaCache, tweetUrl)) return this.tweetMediaCache[tweetUrl]

      try {
        const html = await this.gmRequest(tweetUrl, 'text', { anonymous: true })
        const media = this.extractTweetMediaInfo(html)
        this.tweetMediaCache = {
          ...this.tweetMediaCache,
          [tweetUrl]: media
        }
        return media
      } catch (error) {
        this.tweetMediaCache = {
          ...this.tweetMediaCache,
          [tweetUrl]: { image: '', count: 0 }
        }
        return { image: '', count: 0 }
      }
    },
    gmRequest (url, responseType, options = {}) {
      if (typeof GM_xmlhttpRequest !== 'function') {
        return this.fetchRequest(url, responseType, options)
      }

      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          anonymous: Boolean(options.anonymous),
          responseType,
          headers: {
            Accept: this.getAcceptHeader(responseType)
          },
          onload: response => {
            if (response.status >= 200 && response.status < 300) {
              if (responseType === 'json' || responseType === 'blob') resolve(response.response)
              else resolve(response.responseText || response.response || '')
              return
            }
            reject(new Error('Request failed with status ' + response.status))
          },
          onerror: error => reject(error),
          ontimeout: error => reject(error)
        })
      })
    },
    getAcceptHeader (responseType) {
      if (responseType === 'json') return 'application/json, text/plain, */*'
      if (responseType === 'blob') return '*/*'
      return 'text/html,application/xhtml+xml'
    },
    async fetchRequest (url, responseType, options = {}) {
      const response = await fetch(url, {
        method: 'GET',
        credentials: options.anonymous ? 'omit' : 'same-origin',
        referrerPolicy: options.anonymous ? 'no-referrer' : 'strict-origin-when-cross-origin',
        headers: {
          Accept: this.getAcceptHeader(responseType)
        }
      })

      if (!response.ok) throw new Error('Request failed with status ' + response.status)
      if (responseType === 'json') return await response.json()
      if (responseType === 'blob') return await response.blob()
      return await response.text()
    },
    parseTweetPreviewFromHtml (html) {
      if (!html) return { author: '', text: '', description: '', image: '', mediaCount: 0 }

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const title = this.getMetaContent(doc, 'meta[property="og:title"]') || this.getMetaContent(doc, 'meta[name="twitter:title"]')
      const description = this.getMetaContent(doc, 'meta[property="og:description"]') || this.getMetaContent(doc, 'meta[name="twitter:description"]')
      const image = this.getMetaContent(doc, 'meta[property="og:image"]') || this.getMetaContent(doc, 'meta[name="twitter:image"]')
      const media = this.extractTweetMediaInfo(html)
      const authorInfo = this.extractTweetAuthorInfoFromHtml(html)
      const author = this.extractTweetAuthor(title) || authorInfo.author
      const authorUrl = authorInfo.authorUrl
      const avatar = this.extractTweetAuthorAvatar(html, authorUrl)
      const text = this.extractTweetText(description, author) || this.extractTweetTextFromHtml(html)

      return {
        author,
        authorUrl,
        avatar,
        text,
        description: description || text,
        image: this.normalizeTweetImage(image) || media.image,
        mediaCount: media.count
      }
    },
    parseTweetPreviewFromOembed (response) {
      const container = document.createElement('div')
      container.innerHTML = response && response.html ? response.html : ''

      const paragraph = container.querySelector('blockquote.twitter-tweet > p')
      const authorText = response && response.author_name ? response.author_name : ''

      return {
        author: authorText,
        authorUrl: response && response.author_url ? response.author_url : '',
        avatar: '',
        text: this.extractTweetTextFromElement(paragraph),
        description: '',
        image: '',
        mediaCount: 0
      }
    },
    extractTweetTextFromElement (element) {
      if (!element) return ''

      const clone = element.cloneNode(true)
      clone.querySelectorAll('br').forEach(lineBreak => {
        lineBreak.replaceWith(document.createTextNode('\n'))
      })

      return this.normalizeTweetText(clone.textContent || '')
    },
    getMetaContent (doc, selector) {
      const element = doc.querySelector(selector)
      const value = element ? element.getAttribute('content') : ''
      return value ? value.trim() : ''
    },
    extractTweetAuthor (title) {
      if (!title) return ''
      const match = /^(.*?) on X[: ]/i.exec(title)
      if (match && match[1]) return match[1].trim()
      return title.trim()
    },
    extractTweetText (description, author) {
      if (!description) return ''
      if (!author) return description.trim()

      const escapedAuthor = author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const prefixPattern = new RegExp('^' + escapedAuthor + '\\s+on\\s+X:\\s*', 'i')
      return description.replace(prefixPattern, '').trim()
    },
    extractTweetTextFromHtml (html) {
      if (!html) return ''

      const fullTextMatch = html.match(/"full_text":"((?:\\.|[^"\\])+)"/)
      const textMatch = html.match(/"text":"((?:\\.|[^"\\])+)"/)
      const rawText = fullTextMatch && fullTextMatch[1]
        ? fullTextMatch[1]
        : (textMatch && textMatch[1] ? textMatch[1] : '')

      return this.normalizeTweetText(this.decodeJsonString(rawText))
    },
    extractTweetAuthorInfoFromHtml (html) {
      if (!html) return { author: '', authorUrl: '' }

      const match = html.match(/"name":"((?:\\.|[^"\\])+)","screen_name":"((?:\\.|[^"\\])+)"/)
      if (!match) return { author: '', authorUrl: '' }

      const author = match[1] ? this.decodeJsonString(match[1]).trim() : ''
      const screenName = match[2] ? this.decodeJsonString(match[2]).trim() : ''

      return {
        author,
        authorUrl: screenName ? 'https://x.com/' + screenName : ''
      }
    },
    extractTweetScreenNameFromUrl (authorUrl) {
      if (!authorUrl) return ''

      const match = authorUrl.match(/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([^/?#]+)/i)
      return match && match[1] ? match[1].trim() : ''
    },
    normalizeTweetText (text) {
      if (!text) return ''

      return text
        .replace(/\u00a0/g, ' ')
        .replace(/([^\s])((?:https?:\/\/|pic\.twitter\.com\/))/g, '$1\n$2')
        .replace(/(?:\s+https:\/\/t\.co\/[A-Za-z0-9]+)+$/g, '')
        .replace(/(?:^|\s+)pic\.twitter\.com\/\S+/g, '')
        .replace(/^pic\.twitter\.com\/\S+$/gim, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    },
    decodeJsonString (value) {
      if (!value) return ''

      try {
        return JSON.parse('"' + value.replace(/"/g, '\\"') + '"')
      } catch (error) {
        return value
      }
    },
    normalizeTweetImage (imageUrl) {
      if (!imageUrl) return ''
      if (/amplify_video_thumb|profile_images|abs-0\.twimg\.com/i.test(imageUrl)) return ''
      return imageUrl
    },
    extractTweetAuthorAvatar (html, authorUrl = '') {
      if (!html) return ''

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const normalizedHtml = html
        .replace(/&quot;/ig, '"')
        .replace(/&#34;/ig, '"')
        .replace(/\\u0022/ig, '"')
        .replace(/\\u003a/ig, ':')
        .replace(/\\u002f/ig, '/')
        .replace(/\\\//g, '/')
      const metaAvatar = this.getMetaContent(doc, 'meta[name="twitter:image"]') || this.getMetaContent(doc, 'meta[property="og:image"]')
      const screenName = this.extractTweetScreenNameFromUrl(authorUrl)
      const escapedScreenName = screenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const fieldPattern = screenName
        ? new RegExp('["\']screen_name["\']\\s*:\\s*["\']' + escapedScreenName + '["\'][\\s\\S]{0,12000}?["\']profile_image_url_https["\']\\s*:\\s*["\']([^"\']+)["\']|["\']screen_name["\']\\s*:\\s*["\']' + escapedScreenName + '["\'][\\s\\S]{0,12000}?["\']profile_image_url["\']\\s*:\\s*["\']([^"\']+)["\']', 'i')
        : /["']profile_image_url_https["']\s*:\s*["']([^"']+)["']|["']profile_image_url["']\s*:\s*["']([^"']+)["']/
      const fieldMatch = normalizedHtml.match(fieldPattern)
      const fieldAvatar = fieldMatch
        ? this.decodeJsonString(fieldMatch[1] || fieldMatch[2] || '')
        : ''

      if (metaAvatar && /profile_images/i.test(metaAvatar)) {
        return metaAvatar.replace(/_normal(?=\.[a-z0-9]+(?:[?#].*)?$)/i, '_200x200')
      }

      if (fieldAvatar && /profile_images/i.test(fieldAvatar)) {
        return fieldAvatar.replace(/_normal(?=\.[a-z0-9]+(?:[?#].*)?$)/i, '_200x200')
      }

      return ''
    },
    extractTweetMediaInfo (html) {
      if (!html) return { image: '', count: 0 }

      const matches = html.match(/https:\/\/pbs\.twimg\.com\/media\/[^"'\\\s<]+/ig)
      if (!matches || matches.length === 0) return { image: '', count: 0 }

      const uniqueMatches = [...new Set(matches)]
      const imageList = uniqueMatches.filter(url => /\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i.test(url))
      const firstImage = imageList[0] || uniqueMatches[0] || ''

      return {
        image: firstImage,
        count: imageList.length > 0 ? imageList.length : (firstImage ? 1 : 0)
      }
    },
    getNormalImageCandidates (text) {
      const url = this.parseURL(text)
      const target = url ? url.pathname + url.search + url.hash : text
      if (DIRECT_IMAGE_PATTERN.test(target)) return [text]
      return null
    },
    getVerbImageCandidates (text) {
      const url = this.parseURL(text)
      if (url === null) return null

      if (VERB_DIRECT_IMAGE_HOSTS.includes(url.host)) {
        return this.buildVerbImageCandidates(url.pathname.split('/').filter(Boolean))
      }

      if (VERB_PAGE_HOSTS.includes(url.host)) {
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (pathParts[0] !== 'view') return null
        return this.buildVerbImageCandidates(pathParts.slice(1))
      }

      return null
    },
    buildVerbImageCandidates (pathParts) {
      if (pathParts.length !== 1) return null

      const imageName = pathParts[0]
      const match = /^([A-Za-z0-9_-]+)(?:\.(png|jpg|jpeg|gif|webp))?$/i.exec(imageName)
      if (!match || !match[1]) return null

      const imageId = match[1]
      const extension = match[2] ? match[2].toLowerCase() : ''
      if (extension) return ['https://i.verb.tw/' + imageId + '.' + extension]

      return VERB_EXTENSIONS.map(nextExtension => 'https://i.verb.tw/' + imageId + '.' + nextExtension)
    },
    getKnownHostImageCandidates (text) {
      const url = this.parseURL(text)
      if (url === null) return null
      if (DIRECT_IMAGE_HOSTS.includes(url.host)) return [url.toString()]
      return null
    },
    getMeeeImageCandidates (text) {
      const url = this.parseURL(text)
      if (url === null) return null

      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts.length !== 1) return null

      const imageId = pathParts[0]
      if (!/^[A-Za-z0-9_-]+$/.test(imageId)) return null

      if (MEEE_DIRECT_IMAGE_HOSTS.includes(url.host)) {
        return MEEE_EXTENSIONS.map(extension => 'https://' + url.host + '/' + imageId + '.' + extension)
      }

      if (MEEE_PAGE_HOSTS.includes(url.host)) {
        return MEEE_EXTENSIONS.map(extension => 'https://i.meee.com.tw/' + imageId + '.' + extension)
      }

      return null
    },
    getImgurImageCandidates (text) {
      const url = this.parseURL(text)
      if (url === null || !IMGUR_PAGE_HOSTS.includes(url.host)) return null

      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts.length !== 1) return null

      const imageId = pathParts[0]
      if (!/^\w+$/.test(imageId)) return null

      return IMGUR_EXTENSIONS.map(extension => 'https://i.imgur.com/' + imageId + '.' + extension)
    },
    getYoutubeImageCandidates (text) {
      const videoURL = this.isYoutubeVideo(text)
      if (videoURL !== null) { return ['https://i.ytimg.com/vi/' + videoURL + '/maxresdefault.jpg'] } else { return null }
    },
    isYoutubeVideo (text) {
      const youtubeURL = this.parseURL(text)
      if (youtubeURL === null) {
        return null
      }

      switch (youtubeURL.host) {
        case 'www.youtube.com':
        case 'm.youtube.com':
          return this.parseYoutubePreviewImage(youtubeURL)
        case 'youtu.be':
          return this.parseYoutubePreviewImageWithShortUrl(youtubeURL)
        default:
          return null
      }
    },
    parseYoutubePreviewImage (youtubeURL) {
      const youtubeURLArgs = youtubeURL.search.split('&')
      for (let i = 0; i < youtubeURLArgs.length; i++) {
        const isargvideo = this.parseYoutubeArgument(youtubeURLArgs[i])
        if (isargvideo !== null) return isargvideo
      }
      return null
    },
    parseYoutubeArgument (youtubeURLArg) {
      const isYoutubeURLArgVideo = youtubeURLArg.match('v=(.+)')
      if (isYoutubeURLArgVideo !== null) return isYoutubeURLArgVideo[1]
      else return null
    },
    parseYoutubePreviewImageWithShortUrl (url) {
      return url.pathname.split('/')[1]
    }
  },
  template: ''
}
</script>

<style lang="scss">
.ptt-chat-preview-card {
  width: 360px;
  max-width: 360px;
  max-height: 520px;
  overflow: hidden;
  padding: 12px;
  font-size: 16px;
  color: #111827;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 12px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.2);
}

.ptt-chat-preview-card__header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.ptt-chat-preview-card__identity {
  display: flex;
  gap: 7px;
  align-items: center;
  min-width: 0;
}

.ptt-chat-preview-card__avatar {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  object-fit: cover;
}

.ptt-chat-preview-card__service {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  color: #fff;
  font-weight: 700;
  background: #111827;
  border-radius: 999px;
}

.ptt-chat-preview-card__author {
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptt-chat-preview-card__text,
.ptt-chat-preview-card__description,
.ptt-chat-preview-card__meta {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.ptt-chat-preview-card__text {
  display: -webkit-box;
  margin-bottom: 8px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 16;
}

.ptt-chat-preview-card__text--with-image {
  -webkit-line-clamp: 8;
}

.ptt-chat-preview-card__truncated {
  margin-bottom: 8px;
  font-size: 12px;
}

.ptt-chat-preview-card__description,
.ptt-chat-preview-card__meta {
  color: #4b5563;
}

.ptt-chat-preview-card__description {
  margin-top: 8px;
}

.ptt-chat-preview-card__image-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.ptt-chat-preview-card__image {
  display: block;
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
}

.ptt-chat-preview-card__media-badge {
  bottom: 11px;
  left: 11px;
}

.ptt-chat-preview-card__image-count {
  top: 11px;
  right: 11px;
  min-width: 40px;
}

.ptt-chat-preview-card__media-badge,
.ptt-chat-preview-card__image-count {
  position: absolute;
  padding: 5px 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  letter-spacing: 0.02em;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 0.35rem 1rem rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}
</style>
