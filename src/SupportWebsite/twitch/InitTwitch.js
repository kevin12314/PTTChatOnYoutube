import { ReportMode } from '../../logsetting.js'
import { InitApp } from '../../app/AppIndex.js'
import { ChangeLog } from '../../ChangeLog.js'
import { ThemeCheck } from '../../library.js'

export function InitTwitch (messageposter) {
  // Check Theme
  const WhiteTheme = ThemeCheck('body', 'rgb(247, 247, 248)');

  // run app instance loop
  (function ChechChatInstanced () {
    setTimeout(ChechChatInstanced, 1000)
    TryInsChat()
  })()
  function TryInsChat () {
    const parent = $('section.chat-room')
    if (ReportMode) console.log('parent', parent)
    if (parent.length > 0) {
      const PTTApp = $('#PTTChat', parent)
      if (PTTApp.length < 1) {
        if (ReportMode) console.log('InitApp')
        InitApp(parent, WhiteTheme, true, messageposter)
        ChangeLog()
      }
    }
  }
}
