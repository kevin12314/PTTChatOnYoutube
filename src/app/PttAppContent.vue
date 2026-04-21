<template>
  <div
    :id="instanceIds.contentId"
    class="ptt-chat-contents tab-content rounded-bottom ptt-text ptt-contents-border"
  >
    <!-------- 聊天室 -------->
    <div
      :id="instanceIds.chatPaneId"
      class="ptt-chat-pane tab-pane w-100 mx-0 position-relative fade"
      role="tabpanel"
      :aria-labelledby="instanceIds.chatNavId"
    >
      <PTTApp-Chat />
    </div>
    <!-------- 連線設定 -------->
    <div
      :id="instanceIds.connectPaneId"
      class="tab-pane h-100 w-100 mx-0 row fade show active"
      role="tabpanel"
      :aria-labelledby="instanceIds.connectNavId"
    >
      <PTTApp-Connect />
      <PTTApp-Alert />
    </div>
    <!-------- 其他 -------->
    <div
      :id="instanceIds.otherPaneId"
      class="tab-pane h-100 w-100 mx-0 bg-transparent overflow-auto row fade"
      role="tabpanel"
      :aria-labelledby="instanceIds.otherNavId"
    >
      <PTTApp-Other />
    </div>
    <!-------- PTT畫面 -------->
    <div
      :id="instanceIds.pttPaneId"
      class="tab-pane h-100 w-100 mx-0 fade"
      role="tabpanel"
      :aria-labelledby="instanceIds.pttNavId"
    >
      <PTTApp-PTT :pane-main-id="instanceIds.pttPaneMainId" />
    </div>
    <!-------- Log -------->
    <div
      :id="instanceIds.logPaneId"
      class="tab-pane h-100 w-100 mx-0 fade"
      role="tabpanel"
      :aria-labelledby="instanceIds.logNavId"
      style="overscroll-behavior: contain;"
    >
      <PTTApp-Log />
    </div>
  </div>
</template>

<script>
import Chat from './chat/Chat'
import Connect from './connect/Connect.vue'
import ConnectAlert from './connect/ConnectAlert.vue'
import Other from './other/Other.vue'
import PTTScreen from './ptt/PttScreen.vue'
import Log from './log/Log.vue'

function getDefaultInstanceIds () {
  return {
    contentId: 'PTTChat-contents',
    chatPaneId: 'PTTChat-contents-Chat',
    connectPaneId: 'PTTChat-contents-Connect',
    otherPaneId: 'PTTChat-contents-other',
    pttPaneId: 'PTTChat-contents-PTT',
    pttPaneMainId: 'PTTChat-contents-PTT-main',
    logPaneId: 'PTTChat-contents-log',
    chatNavId: 'nav-item-Chat',
    connectNavId: 'nav-item-Connect',
    otherNavId: 'nav-item-other',
    pttNavId: 'nav-item-PTT',
    logNavId: 'nav-item-log'
  }
}

export default {
  props: {
    instanceIds: {
      type: Object,
      default: getDefaultInstanceIds
    }
  },
  components: {
    'PTTApp-Chat': Chat,
    'PTTApp-Alert': ConnectAlert,
    'PTTApp-Connect': Connect,
    'PTTApp-Other': Other,
    'PTTApp-PTT': PTTScreen,
    'PTTApp-Log': Log
  }
}
</script>

<style lang="scss" scoped>
.ptt-chat-contents {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden auto;
}

.ptt-chat-pane {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
