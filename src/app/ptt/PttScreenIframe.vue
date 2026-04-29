<template>
  <iframe
    v-if="!removePttFrame"
    id="PTTframe"
    :src="src"
    class="h-100 flex-grow-1"
    @load="onPttFrameLoad"
  >你的瀏覽器不支援 iframe</iframe>
</template>

<script>
export default {
  inject: ['msg'],
  data () {
    return {
      src: '//term.ptt.cc/?url=' + this.msg.ownerorigin,
      removePttFrame: false
    }
  },
  mounted () {
    this.msg.pttReady = false
    this.debugPttFrame('mounted', { src: this.src, ownerorigin: this.msg.ownerorigin })
    if (this.msg.ownerorigin === 'https://holodex.net') {
      this.removePttFrame = true
      this.$nextTick(function () {
        const t = setInterval(() => {
          if (document.getElementById('PTTframe') !== null) {
            this.msg.targetWindow = document.getElementById('PTTframe').contentWindow
            this.debugPttFrame('targetWindow assigned for holodex', { hasTargetWindow: !!this.msg.targetWindow })
            clearInterval(t)
          }
        }, 200)
      })
    } else {
      this.msg.targetWindow = this.$el.contentWindow
      this.debugPttFrame('targetWindow assigned', { hasTargetWindow: !!this.msg.targetWindow })
    }
    window.addEventListener('beforeunload', this.removeiframe)
  },
  beforeUnmount () {
    window.removeEventListener('beforeunload', this.removeiframe)
  },
  methods: {
    debugPttFrame: function (stage, payload) {
      console.log('[PTTChatOnYT][PttFrame]', stage, payload || {})
    },
    onPttFrameLoad: function () {
      this.debugPttFrame('iframe load', { src: this.src, hasTargetWindow: !!this.msg.targetWindow, pttReady: this.msg.pttReady })
    },
    removeiframe: function (event) {
      if (this.msg.ownerorigin === 'https://holodex.net') {
        const frame = document.getElementById('PTTframe')
        if (frame && frame.parentElement) {
          frame.parentElement.remove()
        }
      } else {
        if (this.$el && this.$el.parentNode) {
          this.$el.parentNode.removeChild(this.$el)
        }
      }
    }
  }
}

</script>

<style lang="scss" scoped>
iframe {
  zoom: 1.65;
  z-index: 3510;
  -moz-transform: scale(1);
}
</style>
