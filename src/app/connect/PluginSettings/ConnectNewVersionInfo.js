export let ConnectNewVersionInfo = {
  inject: ['pluginWidth'],
  computed: {
    Classes: function () {
      if (this.pluginWidth < 399) return "px-0";
      else return "px-5";
    },

  },
  template: `<div :class="Classes">
  <h4 class="text-center my-1">近期改版</h4>
  <p class="text-center my-1">完整說明請到PTT搜尋YT聊天室顯示PTT推文</p>
  <hr class="mt-1 mb-2">
  <p class="mt-1 mb-0">支援Twitch</p>
  <hr class="mt-1 mb-2">
  <p class="mt-1 mb-0">新增套件長度、推文更新、字體尺寸、推文間隔</p>
  <p class="mt-1 mb-0">套件長度最大值現在可以到850</p>
</div>`,
}