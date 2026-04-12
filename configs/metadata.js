const pkg = require('../package.json')
module.exports = {
  license: pkg.license,
  name: 'Youtube聊天室顯示PTT推文',
  namespace: 'https://github.com/zoosewu/PTTChatOnYoutube',
  description: '連結PTT推文到Youtube聊天室  讓你簡單追實況搭配推文',
  match: [
    'https://www.youtube.com/*',
    'https://youtu.be/*',
    'https://term.ptt.cc/*',
    'https://hololive.jetri.co/*',
    'https://www.twitch.tv/*',
    'https://niji-mado.web.app/home',
    'https://lin.ee/*',
    'https://blank.org/*',
    'https://holodex.net/*',
    'https://lolesports.com/*'
  ],
  grant: [
    'GM_xmlhttpRequest',
    'GM_info',
    'unsafeWindow',
    'GM_getValue',
    'GM_setValue',
    'GM_deleteValue',
    'GM_addValueChangeListener',
    'GM_removeValueChangeListener',
    'GM_registerMenuCommand',
    'GM_unregisterMenuCommand'
  ],
  'run-at': 'document-start',
  require: [],
  homepageURL:
    'https://github.com/zoosewu/PTTChatOnYoutube/tree/master/homepage',
  downloadURL:
    'https://greasyfork.org/scripts/418469-pttchatonyt/code/PttChatOnYt.user.js',
  updateURL:
    'https://greasyfork.org/scripts/418469-pttchatonyt/code/PttChatOnYt.user.js'
}
