
<template>
  <teleport to="body">
    <div style="z-index:4600;">
      <img
        v-if="previewType === 'image' && previewImageURL !== ''"
        ref="imgel"
        :style="style"
        :src="previewImageURL"
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
          <span
            v-if="tweetCard.author"
            class="ptt-chat-preview-card__author"
          >{{ tweetCard.author }}</span>
        </div>
        <div
          v-if="tweetCard.text"
          class="ptt-chat-preview-card__text"
        >
          {{ tweetCard.text }}
        </div>
        <img
          v-if="tweetCard.image"
          ref="cardImage"
          class="ptt-chat-preview-card__image"
          :src="tweetCard.image"
          referrerpolicy="no-referrer"
          @load="handleCardLoad"
          @error="handleCardImageError"
        >
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
const MEEE_DIRECT_IMAGE_HOSTS = ['i.mee.com.tw', 'i.meee.com.tw']
const MEEE_PAGE_HOSTS = ['meee.com.tw', 'www.meee.com.tw']
const MEEE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const TWITTER_HOSTS = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']
const TWEET_OEMBED_ENDPOINT = 'https://publish.twitter.com/oembed'
const PREVIEW_OFFSET = 12
const VIEWPORT_PADDING = 8
const DEFAULT_PREVIEW_SIZE = 400
const EMPTY_TWEET_CARD = Object.freeze({
  visible: false,
  loading: false,
  author: '',
  text: '',
  description: '',
  image: '',
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
      tweetCard: cloneEmptyTweetCard(),
      tweetPreviewCache: {},
      activeTweetRequestUrl: ''
    }
  },

  computed: {
    preview: function () {
      if (this.previewType === 'image') return this.previewImageURL !== ''
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
    }
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
    document.body.addEventListener('mousemove', this.mouseMoveHandler)
    window.addEventListener('pttchat-preview-pointer', this.previewPointerHandler)
  },
  beforeUnmount () {
    if (this.mouseMoveHandler) {
      document.body.removeEventListener('mousemove', this.mouseMoveHandler)
      this.mouseMoveHandler = null
    }
    if (this.previewPointerHandler) {
      window.removeEventListener('pttchat-preview-pointer', this.previewPointerHandler)
      this.previewPointerHandler = null
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
        image: ''
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

      const candidates = this.getNormalImageCandidates(text) ||
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
        const previewData = await this.fetchTweetPreview(tweetUrl)
        if (this.activeTweetRequestUrl !== tweetUrl || this.getTweetCanonicalUrl(this.previewImage) !== tweetUrl) return

        const nextCard = {
          visible: true,
          loading: false,
          author: previewData.author,
          text: previewData.text,
          description: previewData.description,
          image: previewData.image,
          error: previewData.text || previewData.image ? '' : '目前無法解析這則貼文預覽。'
        }
        this.tweetPreviewCache = {
          ...this.tweetPreviewCache,
          [tweetUrl]: nextCard
        }
        this.tweetCard = nextCard
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
    async fetchTweetPreview (tweetUrl) {
      const oembedUrl = TWEET_OEMBED_ENDPOINT + '?omit_script=true&url=' + encodeURIComponent(tweetUrl)
      const oembedResponse = await this.gmRequest(oembedUrl, 'json')
      const parsedFromOembed = this.parseTweetPreviewFromOembed(oembedResponse)
      if (parsedFromOembed.text || parsedFromOembed.author) return parsedFromOembed

      const html = await this.gmRequest(tweetUrl, 'text')
      return this.parseTweetPreviewFromHtml(html)
    },
    gmRequest (url, responseType) {
      if (typeof GM_xmlhttpRequest !== 'function') {
        return this.fetchRequest(url, responseType)
      }

      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          responseType,
          headers: {
            Accept: responseType === 'json' ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml'
          },
          onload: response => {
            if (response.status >= 200 && response.status < 300) {
              if (responseType === 'json') resolve(response.response)
              else resolve(response.responseText || '')
              return
            }
            reject(new Error('Request failed with status ' + response.status))
          },
          onerror: error => reject(error),
          ontimeout: error => reject(error)
        })
      })
    },
    async fetchRequest (url, responseType) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: responseType === 'json' ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml'
        }
      })

      if (!response.ok) throw new Error('Request failed with status ' + response.status)
      if (responseType === 'json') return await response.json()
      return await response.text()
    },
    parseTweetPreviewFromHtml (html) {
      if (!html) return { author: '', text: '', description: '', image: '' }

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const title = this.getMetaContent(doc, 'meta[property="og:title"]') || this.getMetaContent(doc, 'meta[name="twitter:title"]')
      const description = this.getMetaContent(doc, 'meta[property="og:description"]') || this.getMetaContent(doc, 'meta[name="twitter:description"]')
      const image = this.getMetaContent(doc, 'meta[property="og:image"]') || this.getMetaContent(doc, 'meta[name="twitter:image"]')
      const author = this.extractTweetAuthor(title)
      const text = this.extractTweetText(description, author)

      return {
        author,
        text,
        description,
        image: this.normalizeTweetImage(image)
      }
    },
    parseTweetPreviewFromOembed (response) {
      const container = document.createElement('div')
      container.innerHTML = response && response.html ? response.html : ''

      const paragraph = container.querySelector('blockquote.twitter-tweet > p')
      const authorAnchor = container.querySelector('blockquote.twitter-tweet > a')
      const authorText = response && response.author_name ? response.author_name : ''

      return {
        author: authorText,
        text: this.extractTweetTextFromElement(paragraph),
        description: '',
        image: '',
        sourceUrl: authorAnchor ? authorAnchor.href : ''
      }
    },
    extractTweetTextFromElement (element) {
      if (!element) return ''

      const clone = element.cloneNode(true)
      clone.querySelectorAll('br').forEach(lineBreak => {
        lineBreak.replaceWith(document.createTextNode('\n'))
      })

      const text = clone.textContent || ''
      return text
        .replace(/\u00a0/g, ' ')
        .replace(/([^\s])((?:https?:\/\/|pic\.twitter\.com\/))/g, '$1\n$2')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
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
    normalizeTweetImage (imageUrl) {
      if (!imageUrl) return ''
      if (/amplify_video_thumb|profile_images|abs-0\.twimg\.com/i.test(imageUrl)) return ''
      return imageUrl
    },
    getNormalImageCandidates (text) {
      const url = this.parseURL(text)
      const target = url ? url.pathname + url.search + url.hash : text
      if (DIRECT_IMAGE_PATTERN.test(target)) return [text]
      return null
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
  padding: 0.75rem;
  color: #111827;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 0.75rem;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.2);
}

.ptt-chat-preview-card__header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.ptt-chat-preview-card__service {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.35rem;
  color: #fff;
  font-weight: 700;
  background: #111827;
  border-radius: 999px;
}

.ptt-chat-preview-card__author {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptt-chat-preview-card__text,
.ptt-chat-preview-card__description,
.ptt-chat-preview-card__meta {
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.ptt-chat-preview-card__text {
  margin-bottom: 0.5rem;
}

.ptt-chat-preview-card__description,
.ptt-chat-preview-card__meta {
  color: #4b5563;
}

.ptt-chat-preview-card__description {
  margin-top: 0.5rem;
}

.ptt-chat-preview-card__image {
  display: block;
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 0.5rem;
}
</style>
