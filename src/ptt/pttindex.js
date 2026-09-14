import { Ptt } from './PttController/Ptt.js'
import eventBind from './eventBind.js'
import { bindTerminalUpdates } from './terminalAdapter.js'
/**
 * @param {import('../MessagePoster').MessagePoster} messagePoster
 */
export function InitPTT (messagePoster) {
  const ptt = new Ptt(messagePoster)
  function OnUpdate () {
    if (reportMode) console.log('===OnUpdate start===')
    if (showAllLog) console.log('Ptt.clearScreen()')
    ptt.clearScreen()
    if (showAllLog) console.log('Ptt.frame.update()')
    ptt.frame.update()
    if (showAllLog) console.log('runAutoCommand()')
    const skipThisFrame = ptt.autoCommand.runAutoCommand()
    if (!skipThisFrame) {
      if (showAllLog) console.log('runCommand()')
      ptt.command.execute()
    }
    if (reportMode) console.log('===OnUpdate end===')
  }
  eventBind.apply(ptt)
  bindTerminalUpdates(unsafeWindow, () => {
    ptt.state.lastUpdateTime = Date.now()
    ptt.state.serverfull = false
    OnUpdate()
  })
}
