<template>
  <a
    id="PTTMainBtn"
    class="btn btn-lg ptt-btnoutline position-absolute openpttchat"
    type="button"
    data-bs-toggle="collapse"
    data-bs-target="#PTTMain"
    aria-expanded="false"
    aria-controls="PTTMain"
    @click.self="$_PttAppButton_Openpttchat()"
  >P</a>
</template>

<script>
import gaUseExtensionEvent from 'src/ga/useExtensionEvent'
export default {
  methods: {
    $_PttAppButton_Openpttchat: function () {
      gaUseExtensionEvent()
    }
  }
}
</script>

<style lang="scss" scoped>
a {
  z-index: 4000 !important;
  pointer-events: auto;
}
</style>
