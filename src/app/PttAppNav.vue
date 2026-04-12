<template>
  <ul
    id="PTTChat-navbar"
    class="nav nav-tabs justify-content-center"
    role="tablist"
  >
    <li
      class="nav-item"
      :go="isGotoChat"
    >
      <button
        id="nav-item-Chat"
        ref="chatbtn"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-toggle="tab"
        data-target="#PTTChat-contents-Chat"
        role="tab"
        aria-controls="PTTChat-contents-Chat"
        aria-selected="false"
        @click="showTab"
      >
        聊天室
      </button>
    </li>
    <li class="nav-item">
      <button
        id="nav-item-Connect"
        class="nav-link ptt-text bg-transparent active"
        type="button"
        data-toggle="tab"
        data-target="#PTTChat-contents-Connect"
        role="tab"
        aria-controls="PTTChat-contents-Connect"
        aria-selected="true"
        @click="showTab"
      >
        連線設定
      </button>
    </li>
    <li class="nav-item">
      <button
        id="nav-item-other"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-toggle="tab"
        data-target="#PTTChat-contents-other"
        role="tab"
        aria-controls="PTTChat-contents-other"
        aria-selected="false"
        @click="showTab"
      >
        說明
      </button>
    </li>
    <li class="nav-item">
      <button
        id="nav-item-PTT"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-toggle="tab"
        data-target="#PTTChat-contents-PTT"
        role="tab"
        aria-controls="PTTChat-contents-PTT"
        aria-selected="false"
        @click="showTab"
      >
        PTT畫面
      </button>
    </li>
    <li class="nav-item">
      <button
        id="nav-item-log"
        class="nav-link ptt-text bg-transparent"
        type="button"
        data-toggle="tab"
        data-target="#PTTChat-contents-log"
        role="tab"
        aria-controls="PTTChat-contents-log"
        aria-selected="false"
        @click="showTab"
      >
        log
      </button>
    </li>
    <li class="nav-item">
      <button
        id="nav-item-TimeSet"
        class="nav-link ptt-text bg-transparent d-none"
        type="button"
        data-toggle="collapse"
        data-target="#PTTChat-Time"
        aria-controls="PTTChat-Time"
        aria-expanded="false"
      >
        時間
      </button>
    </li>
  </ul>
</template>

<script>
export default {
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
      $(event.currentTarget).tab('show')
    }
  }
}
</script>

<style lang="scss">
</style>
