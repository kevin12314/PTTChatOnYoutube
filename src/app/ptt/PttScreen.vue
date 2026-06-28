<template>
  <div
    :id="paneMainId"
    class="h-100 w-100 d-flex justify-content-start overflow-hidden px-0"
  >
    <ptt-screen-iframe
      ref="ifm"
      :key="getInstancePTTID"
    />
  </div>
</template>

<script>
import PttScreenIframe from './PttScreenIframe.vue'
export default {
  components: {
    'ptt-screen-iframe': PttScreenIframe
  },
  props: {
    paneMainId: {
      type: String,
      default: 'PTTChat-contents-PTT-main'
    }
  },
  computed: {
    ...Vuex.mapGetters([
      'getInstancePTTID'
    ])
  }
}
</script>

<style lang="scss">
</style>
