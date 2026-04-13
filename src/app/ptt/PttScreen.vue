<template>
  <div
    id="PTTChat-contents-PTT-main"
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
  computed: {
    ...Vuex.mapGetters([
      'getInstancePTTID'
    ])
  }
}
</script>

<style lang="scss">
</style>
