const pkg = require('../package.json')
module.exports = {
  license: pkg.license,
  name: 'Youtube聊天室顯示PTT推文Next',
  namespace: 'https://github.com/kevin12314/PTTChatOnYoutube',
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
  connect: [
    'x.com',
    'www.x.com',
    'twitter.com',
    'www.twitter.com',
    'publish.twitter.com'
  ],
  'run-at': 'document-body',
  require: [],
  homepageURL:
    'https://github.com/kevin12314/PTTChatOnYoutube/tree/master/homepage',
  downloadURL:
    'https://github.com/kevin12314/PTTChatOnYoutube/releases/latest/download/PttChatOnYtNext.user.js',
  updateURL:
    'https://github.com/kevin12314/PTTChatOnYoutube/releases/latest/download/PttChatOnYtNext.user.js'
}
