<template>
  <div
    :id="instanceIds.appRootId"
    :class="rootClasses"
  >
    <PTTAppNav
      :instance-ids="instanceIds"
      :instance-id="instanceId"
      :shell-mode="shellMode"
    />
    <PTTAppContent :instance-ids="instanceIds" />
  </div>
</template>

<script>
import PTTAppNav from './PttAppNav.vue'
import PTTAppContent from './PttAppContent.vue'

function createScopedId (baseId, instanceId) {
  return instanceId ? `${baseId}-${instanceId}` : baseId
}

export default {
  components: {
    PTTAppNav: PTTAppNav,
    PTTAppContent: PTTAppContent
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
    rootClasses () {
      const classes = ['ptt-app-root', 'ptt-bg', 'ptt-border-bottom', 'rounded', 'w-100', 'd-flex', 'flex-column']
      if (this.shellMode === 'embedded') classes.push('h-100')
      return classes
    },
    instanceIds () {
      return {
        panelId: createScopedId('PTTMain', this.instanceId),
        appRootId: createScopedId('PTTChat-app', this.instanceId),
        navbarId: createScopedId('PTTChat-navbar', this.instanceId),
        contentId: createScopedId('PTTChat-contents', this.instanceId),
        chatNavId: createScopedId('nav-item-Chat', this.instanceId),
        connectNavId: createScopedId('nav-item-Connect', this.instanceId),
        otherNavId: createScopedId('nav-item-other', this.instanceId),
        pttNavId: createScopedId('nav-item-PTT', this.instanceId),
        logNavId: createScopedId('nav-item-log', this.instanceId),
        timeSetNavId: createScopedId('nav-item-TimeSet', this.instanceId),
        timeCollapseId: createScopedId('PTTChat-Time', this.instanceId),
        chatPaneId: createScopedId('PTTChat-contents-Chat', this.instanceId),
        connectPaneId: createScopedId('PTTChat-contents-Connect', this.instanceId),
        otherPaneId: createScopedId('PTTChat-contents-other', this.instanceId),
        pttPaneId: createScopedId('PTTChat-contents-PTT', this.instanceId),
        pttPaneMainId: createScopedId('PTTChat-contents-PTT-main', this.instanceId),
        logPaneId: createScopedId('PTTChat-contents-log', this.instanceId)
      }
    }
  }
}
</script>

<style lang="scss">
.ptt-app-root {
  min-height: 0;
}
</style>
