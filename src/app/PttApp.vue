<template>
  <div
    :id="panelId"
    :class="shellClasses"
  >
    <PTTAppMain
      :instance-id="instanceId"
      :shell-mode="shellMode"
      :style="panelContentStyle"
    />
  </div>
</template>

<script>
import PTTAppMain from './PttAppMain.vue'

export default {
  components: {
    PTTAppMain: PTTAppMain
  },
  props: {
    instanceId: {
      type: String,
      default: ''
    },
    shellMode: {
      type: String,
      default: 'classic'
    }
  },
  computed: {
    panelId () {
      return this.instanceId ? `PTTMain-${this.instanceId}` : 'PTTMain'
    },
    panelContentStyle () {
      if (this.shellMode === 'embedded') {
        return {
          height: '100%'
        }
      }

      return {
        height: this.$store.getters.getPluginHeight + 'px'
      }
    },
    shellClasses () {
      const classes = ['pttchat', 'rounded-bottom', 'w-100']

      if (this.shellMode === 'embedded') {
        classes.push('h-100', 'd-flex', 'flex-column')
      } else {
        classes.push('rounded-right', 'position-absolute', 'collapse')
      }

      return classes
    }
  },
  mounted () {
    GM_deleteValue('PostAID')
    GM_deleteValue('A-custom-PushIntervalMax')
    GM_deleteValue('A-custom-PushIntervalMin')
    GM_deleteValue('DisablePushGray')
    GM_deleteValue('PushInterval')
    GM_deleteValue('TitleList')
    GM_deleteValue('lastupdateframe')
    GM_deleteValue('lastupdatetop')
  }
}
</script>

<style lang="scss" scoped>
.pttchat {
  z-index: 3010 !important;
  pointer-events: auto;
}
</style>
