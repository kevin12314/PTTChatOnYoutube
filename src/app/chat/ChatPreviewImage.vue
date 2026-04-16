
<template>
  <teleport to="body">
    <div style="z-index:4600;">
      <img
        ref="imgel"
        :style="style"
        :src="previewImageURL"
        referrerpolicy="no-referrer"
        @load="handleImageLoad"
        @error="handleImageError"
      >
    </div>
  </teleport>
</template>

<script>
const DIRECT_IMAGE_HOSTS = ['i.urusai.cc']
const DIRECT_IMAGE_PATTERN = /\.(jpeg|jpg|gif|png|webp)(?:$|[?#])/i
const IMGUR_PAGE_HOSTS = ['imgur.com', 'www.imgur.com', 'm.imgur.com']
const IMGUR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const MEEE_DIRECT_IMAGE_HOSTS = ['i.mee.com.tw', 'i.meee.com.tw']
const MEEE_PAGE_HOSTS = ['meee.com.tw', 'www.meee.com.tw']
const MEEE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const PREVIEW_OFFSET = 12
const VIEWPORT_PADDING = 8

export default {
  data () {
    return {
      mousex: 0,
      mousey: 0,
      w: 0,
      h: 0,
      mouseMoveHandler: null,
      previewPointerHandler: null,
      previewIndex: 0
    }
  },

  computed: {
    preview: function () {
      return this.previewImageURL !== ''
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

      const width = this.w > 0 ? this.w : 400
      const height = this.h > 0 ? this.h : 400
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
        maxHeight: '400px',
        maxWidth: '400px',
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
    previewImage () {
      this.previewIndex = 0
      this.w = 0
      this.h = 0
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
    handleImageLoad () {
      const imageElement = this.$refs.imgel
      if (!imageElement) return

      const rect = imageElement.getBoundingClientRect()
      this.w = rect.width || imageElement.width || 400
      this.h = rect.height || imageElement.height || 400
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
    parseURL (text) {
      try {
        return new URL(text)
      } catch (e) {
        return null
      }
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
</style>
