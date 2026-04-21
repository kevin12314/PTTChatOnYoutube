<template>
  <ul
    :id="instanceIds.navbarId"
    class="nav nav-tabs justify-content-center"
    role="tablist"
  >
    <li
      class="nav-item"
      :go="isGotoChat"
    >
      <button
        :id="instanceIds.chatNavId"
        ref="chatbtn"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-bs-toggle="tab"
        :data-bs-target="`#${instanceIds.chatPaneId}`"
        role="tab"
        :aria-controls="instanceIds.chatPaneId"
        aria-selected="false"
        @click="showTab"
      >
        聊天室
      </button>
    </li>
    <li class="nav-item">
      <button
        :id="instanceIds.connectNavId"
        class="nav-link ptt-text bg-transparent active"
        type="button"
        data-bs-toggle="tab"
        :data-bs-target="`#${instanceIds.connectPaneId}`"
        role="tab"
        :aria-controls="instanceIds.connectPaneId"
        aria-selected="true"
        @click="showTab"
      >
        連線設定
      </button>
    </li>
    <li class="nav-item">
      <button
        :id="instanceIds.otherNavId"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-bs-toggle="tab"
        :data-bs-target="`#${instanceIds.otherPaneId}`"
        role="tab"
        :aria-controls="instanceIds.otherPaneId"
        aria-selected="false"
        @click="showTab"
      >
        說明
      </button>
    </li>
    <li class="nav-item">
      <button
        :id="instanceIds.pttNavId"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-bs-toggle="tab"
        :data-bs-target="`#${instanceIds.pttPaneId}`"
        role="tab"
        :aria-controls="instanceIds.pttPaneId"
        aria-selected="false"
        @click="showTab"
      >
        PTT畫面
      </button>
    </li>
    <li class="nav-item">
      <button
        :id="instanceIds.logNavId"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-bs-toggle="tab"
        :data-bs-target="`#${instanceIds.logPaneId}`"
        role="tab"
        :aria-controls="instanceIds.logPaneId"
        aria-selected="false"
        @click="showTab"
      >
        log
      </button>
    </li>
    <li class="nav-item">
      <button
        :id="instanceIds.timeSetNavId"
        class="nav-link ptt-text bg-transparent d-none"
        type="button"
        data-bs-toggle="collapse"
        :data-bs-target="`#${instanceIds.timeCollapseId}`"
        :aria-controls="instanceIds.timeCollapseId"
        aria-expanded="false"
      >
        時間
      </button>
    </li>
  </ul>
</template>

<script>
import { showTab as showBootstrapTab } from 'src/bootstrap'

function getDefaultInstanceIds () {
  return {
    navbarId: 'PTTChat-navbar',
    chatNavId: 'nav-item-Chat',
    connectNavId: 'nav-item-Connect',
    otherNavId: 'nav-item-other',
    pttNavId: 'nav-item-PTT',
    logNavId: 'nav-item-log',
    timeSetNavId: 'nav-item-TimeSet',
    timeCollapseId: 'PTTChat-Time',
    chatPaneId: 'PTTChat-contents-Chat',
    connectPaneId: 'PTTChat-contents-Connect',
    otherPaneId: 'PTTChat-contents-other',
    pttPaneId: 'PTTChat-contents-PTT',
    logPaneId: 'PTTChat-contents-log'
  }
}

export default {
  props: {
    instanceId: {
      type: String,
      default: ''
    },
    shellMode: {
      type: String,
      default: 'classic'
    },
    instanceIds: {
      type: Object,
      default: getDefaultInstanceIds
    }
  },
  data () {
    return {}
  },
  computed: {
    isGotoChat: function () {
      const go = this.gotoChat
      if (reportMode) console.log('isGotoChat', go)
      if (go) {
        this.$store.dispatch('gotoChat', false)
        this.$refs.chatbtn.click()
        if (reportMode) console.log('gotoChat')
      }
      return go
    },
    ...Vuex.mapGetters([
      'gotoChat'
    ])
  },
  methods: {
    showTab: function (event) {
      event.preventDefault()
      event.stopPropagation()
      showBootstrapTab(event.currentTarget)
    }
  }
}
</script>

<style lang="scss">
</style>
