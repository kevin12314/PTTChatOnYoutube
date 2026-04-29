
<template>
  <div class="row mt-3">
    <div class="col-5">
      <label for="PTTid">PTT IDD</label>
      <input
        id="PTTid"
        v-model.lazy="id"
        type="text"
        class="form-control"
        placeholder="PTT ID"
        autocomplete="off"
        @keyup.13="login"
      >
    </div>
    <div class="col-5">
      <label for="PTTpw">PTT密碼</label>
      <input
        id="PTTpw"
        v-model.lazy="pw"
        type="password"
        class="form-control"
        placeholder="PTT密碼"
        autocomplete="off"
        @keyup.13="login"
      >
    </div>
    <div class="col-2 px-0">
      <label
        for="PTTlogin"
        class="col-2"
      >&nbsp;</label>
      <button
        id="PTTlogin"
        class="btn ptt-btnoutline w-100"
        type="button"
        @click.self="login()"
      >
        登入
      </button>
    </div>
  </div>
</template>

<script>
import { GenerateCryptKey } from 'src/library'

export default {
  inject: ['msg'],
  data () {
    return {
      id: GM_getValue('PTTID', ''),
      pw: '',
      cryptkey: GenerateCryptKey(),
      pendingLoginTimer: null,
      pendingLoginRetryCount: 0
    }
  },
  computed: {
    ...Vuex.mapGetters(['getDeleteOtherConnect', 'pttState'])
  },
  beforeUnmount () {
    this.clearPendingLogin()
  },
  methods: {
    debugLogin: function (stage, payload) {
      console.log('[PTTChatOnYT][Login]', stage, payload || {})
    },
    syncHolodexTargetWindow: function () {
      if (this.msg.ownerorigin !== 'https://holodex.net') return this.msg.targetWindow

      const pttFrame = document.getElementById('PTTframe')
      if (pttFrame && pttFrame.contentWindow) {
        this.msg.targetWindow = pttFrame.contentWindow
      }

      return this.msg.targetWindow
    },
    sendLoginMessage: function () {
      GM_setValue('PTTID', this.id)
      this.cryptkey = GenerateCryptKey()
      const i = CryptoJS.AES.encrypt(this.id, this.cryptkey).toString()
      const p = CryptoJS.AES.encrypt(this.pw, this.cryptkey).toString()
      if (showAllLog)console.log(`this.cryptkey ${this.cryptkey}`)
      const sent = this.msg.PostMessage('login', { id: i, pw: p, cryptkey: this.cryptkey, DeleteOtherConnect: this.getDeleteOtherConnect })
      this.debugLogin('sendLoginMessage', { sent, ownerorigin: this.msg.ownerorigin, targetorigin: this.msg.targetorigin, hasTargetWindow: !!this.msg.targetWindow, pttReady: this.msg.pttReady })
      return sent
    },
    clearPendingLogin: function () {
      if (!this.pendingLoginTimer) return
      clearInterval(this.pendingLoginTimer)
      this.pendingLoginTimer = null
      this.pendingLoginRetryCount = 0
    },
    waitPttReadyThenLogin: function () {
      if (this.pendingLoginTimer) return

      this.debugLogin('waitPttReadyThenLogin:start', { ownerorigin: this.msg.ownerorigin, targetorigin: this.msg.targetorigin, hasTargetWindow: !!this.msg.targetWindow, pttReady: this.msg.pttReady })
      this.$store.dispatch('Alert', { type: 1, msg: 'PTT畫面初始化中，稍候會自動登入。' })
      this.pendingLoginRetryCount = 0
      this.pendingLoginTimer = setInterval(() => {
        this.syncHolodexTargetWindow()

        if (this.msg.pttReady) {
          this.debugLogin('waitPttReadyThenLogin:ready', { retryCount: this.pendingLoginRetryCount })
          this.clearPendingLogin()
          this.sendLoginMessage()
          return
        }

        this.pendingLoginRetryCount++
        if (this.pendingLoginRetryCount >= 20) {
          this.clearPendingLogin()
          this.debugLogin('waitPttReadyThenLogin:timeout', { ownerorigin: this.msg.ownerorigin, targetorigin: this.msg.targetorigin, hasTargetWindow: !!this.msg.targetWindow, pttReady: this.msg.pttReady })
          this.$store.dispatch('Alert', { type: 0, msg: 'PTT畫面尚未完成初始化，請切換到「PTT畫面」頁籤確認 term.ptt.cc 已載入，並確認腳本允許在 iframe 中執行。' })
        }
      }, 250)
    },
    login: function () {
      this.syncHolodexTargetWindow()
      this.debugLogin('click', { hasId: this.id !== '', hasPassword: this.pw !== '', ownerorigin: this.msg.ownerorigin, targetorigin: this.msg.targetorigin, hasTargetWindow: !!this.msg.targetWindow, pttReady: this.msg.pttReady, pttState: this.pttState })

      if (this.id === '' || this.pw === '') {
        this.debugLogin('blocked:emptyCredentials')
        this.$store.dispatch('Alert', { type: 0, msg: '帳號或密碼不得為空。' })
        return
      } else if (!this.msg.targetWindow) {
        this.debugLogin('blocked:noTargetWindow')
        this.$store.dispatch('Alert', { type: 0, msg: 'PTT畫面尚未就緒，請切換到「PTT畫面」頁籤稍候再試。' })
        return
      } else if (this.pttState > 0) {
        this.debugLogin('blocked:alreadyLoggedIn', { pttState: this.pttState })
        this.$store.dispatch('Alert', { type: 0, msg: '已經登入，請勿重複登入。' })
        return
      } else if (!this.msg.pttReady) {
        this.waitPttReadyThenLogin()
        return
      }
      this.sendLoginMessage()
    }
  }
}
</script>

<style lang="scss">
</style>
