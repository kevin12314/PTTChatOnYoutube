
<template>
  <div class="row my-3">
    <label class="col-3 col-form-label">重啟PTT</label>
    <div class="col-2 px-0 ms-2">
      <button
        id="reinstance-ptt-btn"
        class="btn ptt-btnoutline w-100 px-2"
        type="button"
        @click.self="reLaunchPtt"
      >
        點我
      </button>
    </div>
    <label class="col col-form-label ms-2">PTT跑到奇怪的畫面壞掉時使用</label>
  </div>
</template>

<script>
export default {
  inject: ['msg'],
  methods: {
    reLaunchPtt: function () {
      if (this.msg.ownerorigin === 'https://holodex.net') {
        const pttFrame = document.getElementById('PTTframe')
        const pttFrameParent = document.getElementById('ptt-frame-parent')
        if (!pttFrame || !pttFrameParent) return

        const newPttFrame = pttFrame.cloneNode(true)
        pttFrame.remove()
        pttFrameParent.appendChild(newPttFrame)
        this.msg.targetWindow = newPttFrame.contentWindow
      } else {
        this.reInstancePTT()
      }
    },
    ...Vuex.mapActions([
      'reInstancePTT' // 将 `this.reInstancePTT()` 映射为 `this.$store.dispatch('reInstancePTT')`
    ])
  }
}
</script>

<style lang="scss">
</style>
