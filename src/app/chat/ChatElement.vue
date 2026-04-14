<template>
  <div
    class="ptt-chat d-flex px-3"
    :style="bgc"
  >
    <div class="flex-grow-1 mw-100">
      <div
        class="ptt-chat-info d-flex flex-row"
        :style="infoStyle"
      >
        <p :class="typeclass">
          {{ item.type }}
        </p>
        <p class="ptt-chat-id me-2 mb-0 flex-grow-1">
          {{ item.pttid }}
        </p>
        <p class="ptt-chat-time mb-0">
          {{ timeH }}:{{ timem }}
        </p>
      </div>
      <div>
        <p
          ref="p"
          class="ptt-chat-msg mb-0 mx-2"
          :style="msgStyle"
          v-html="item.msg"
        />
      </div>
      <div :style="spaceStyle" />
    </div>
  </div>
</template>

<script>
import { paddingLeft } from 'src/library'

export default {
  props: {
    item: { type: Object, required: true },
    index: { type: Number, required: true },
    msgStyle: { type: Object, required: true },
    infoStyle: { type: Object, required: true },
    spaceStyle: { type: Object, required: true },
    activeChat: { type: Number, required: true }
  },
  data () {
    return {
      previewTimer: null,
      previewDelay: 500,
      previewSourceUrl: '',
      mouseOverHandler: null,
      mouseOutHandler: null,
      clickHandler: null
    }
  },
  computed: {
    timeH: function () { return paddingLeft(this.item.time.getHours(), +2) },
    timem: function () { return paddingLeft(this.item.time.getMinutes(), +2) },
    typeclass: function () {
      const typecolor = this.item.type === '推 ' ? 'ptt-chat-type' : 'ptt-chat-type-n'
      return typecolor + ' me-2 mb-0'
    },
    bgc: function () {
      if (this.getDisableCommentGray) return ''
      const isUnchat = this.item.gray ? '0.25' : '0'
      const color = 'rgba(128, 128, 128, ' + isUnchat + ')'
      return { backgroundColor: color, transition: '2s' }
    },
    ...Vuex.mapGetters(['getDisableCommentGray', 'previewImage'])
  },
  watch: {
    activeChat: function () { this.$_ChatElementMessage_GrayCheck() }
  },
  mounted () {
    if (!this.getDisableCommentGray) this.$_ChatElementMessage_GrayCheck()
    this.$nextTick(function () {
      this.mouseOverHandler = (event) => {
        const linkElement = event.target.closest('a[href]')
        if (!linkElement || !this.$refs.p.contains(linkElement)) return
        if (event.relatedTarget && linkElement.contains(event.relatedTarget)) return
        this.$_ChatElementMessage_MoueseEnter(linkElement.href, event)
      }
      this.mouseOutHandler = (event) => {
        const linkElement = event.target.closest('a[href]')
        if (!linkElement || !this.$refs.p.contains(linkElement)) return
        if (event.relatedTarget && linkElement.contains(event.relatedTarget)) return
        this.$_ChatElementMessage_MoueseLeave(linkElement.href, event)
      }
      this.clickHandler = (event) => {
        const searchElement = event.target.closest('[data-any-search]')
        if (!searchElement || !this.$refs.p.contains(searchElement)) return
        event.preventDefault()
        this.$_ChatElementMessage_AddAnySrarch(searchElement.dataset.anySearch)
      }
      this.$refs.p.addEventListener('mouseover', this.mouseOverHandler)
      this.$refs.p.addEventListener('mouseout', this.mouseOutHandler)
      this.$refs.p.addEventListener('click', this.clickHandler)
    })
  },
  beforeUnmount () {
    this.$_ChatElementMessage_ClearPreviewTimer()
    if (this.$refs.p && this.mouseOverHandler) this.$refs.p.removeEventListener('mouseover', this.mouseOverHandler)
    if (this.$refs.p && this.mouseOutHandler) this.$refs.p.removeEventListener('mouseout', this.mouseOutHandler)
    if (this.$refs.p && this.clickHandler) this.$refs.p.removeEventListener('click', this.clickHandler)
    if (this.previewImage === this.previewSourceUrl) this.$store.dispatch('previewImage', '')
  },
  updated () { if (showScrollLog) console.log('updated, listIndex, chatIndex, msg', this.item.id, this.item.msg) },
  methods: {
    $_ChatElementMessage_ClearPreviewTimer () {
      if (this.previewTimer !== null) {
        clearTimeout(this.previewTimer)
        this.previewTimer = null
      }
    },
    $_ChatElementMessage_GrayCheck () {
      if (reportMode) console.log('GrayCheck', this.item, 'id', this.item.id, 'index', this.index, 'activeChat', this.activeChat, this.item, 'id>activeChat', this.item.id > this.activeChat, '->', this.item.gray, 'getDisableCommentGray', this.getDisableCommentGray)
      if (this.index > this.activeChat && !this.item.gray) this.$emit('updategray', this.index, true)
      else if (this.index <= this.activeChat && this.item.gray) this.$emit('updategray', this.index, false)
    },
    $_ChatElementMessage_UpdatePreviewPointer (mouseEvent) {
      if (!mouseEvent) return
      window.dispatchEvent(new CustomEvent('pttchat-preview-pointer', {
        detail: {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        }
      }))
    },
    $_ChatElementMessage_MoueseEnter (url, mouseEvent) {
      this.$_ChatElementMessage_ClearPreviewTimer()
      this.$_ChatElementMessage_UpdatePreviewPointer(mouseEvent)
      if (this.previewImage === this.previewSourceUrl) this.$store.dispatch('previewImage', '')
      this.previewSourceUrl = url
      this.previewTimer = window.setTimeout(() => {
        if (this.previewSourceUrl === url) this.$store.dispatch('previewImage', url)
        this.previewTimer = null
      }, this.previewDelay)
    },
    $_ChatElementMessage_MoueseLeave (url, mouseEvent) {
      this.$_ChatElementMessage_ClearPreviewTimer()
      this.$_ChatElementMessage_UpdatePreviewPointer(mouseEvent)
      if (this.previewImage === this.previewSourceUrl) this.$store.dispatch('previewImage', '')
      this.previewSourceUrl = ''
    },
    $_ChatElementMessage_AddAnySrarch (search) {
      if (reportMode) console.log('click addAnySearch')
      this.$store.dispatch('addAnySearch', search)
    }
  }
}
</script>

<style lang="scss">
</style>
