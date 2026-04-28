
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
      cryptkey: GenerateCryptKey()
    }
  },
  computed: {
    ...Vuex.mapGetters(['getDeleteOtherConnect', 'pttState'])
  },
  methods: {
    syncHolodexTargetWindow: function () {
      if (this.msg.ownerorigin !== 'https://holodex.net') return this.msg.targetWindow

      const pttFrame = document.getElementById('PTTframe')
      if (pttFrame && pttFrame.contentWindow) {
        this.msg.targetWindow = pttFrame.contentWindow
      }

      return this.msg.targetWindow
    },
    login: function () {
      this.syncHolodexTargetWindow()

      if (this.id === '' || this.pw === '') {
        this.$store.dispatch('Alert', { type: 0, msg: '帳號或密碼不得為空。' })
        return
      } else if (!this.msg.targetWindow) {
        this.$store.dispatch('Alert', { type: 0, msg: 'PTT畫面尚未就緒，請切換到「PTT畫面」頁籤稍候再試。' })
        return
      } else if (this.pttState > 0) {
        this.$store.dispatch('Alert', { type: 0, msg: '已經登入，請勿重複登入。' })
        return
      }
      GM_setValue('PTTID', this.id)
      this.cryptkey = GenerateCryptKey()
      const i = CryptoJS.AES.encrypt(this.id, this.cryptkey).toString()
      const p = CryptoJS.AES.encrypt(this.pw, this.cryptkey).toString()
      if (showAllLog)console.log(`this.cryptkey ${this.cryptkey}`)
      this.msg.PostMessage('login', { id: i, pw: p, cryptkey: this.cryptkey, DeleteOtherConnect: this.getDeleteOtherConnect })
    }
  }
}
</script>

<style lang="scss">
</style>
