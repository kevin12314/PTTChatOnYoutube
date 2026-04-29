export function MessagePoster () {
  this.targetorigin = ''
  this.ownerorigin = ''
  this.targetWindow = null
  this.pttReady = false
  this.DebugLog = function (stage, payload) {
    console.log('[PTTChatOnYT][MessagePoster]', stage, payload || {})
  }
  this.PostMessage = function (msg, data) {
    if (this.targetWindow === null) {
      this.DebugLog('PostMessage skipped: targetWindow is null', { msg, ownerorigin: this.ownerorigin, targetorigin: this.targetorigin })
      return false
    }
    const d = { m: msg, d: data }
    try {
      this.targetWindow.postMessage(d, this.targetorigin)
    } catch (error) {
      this.DebugLog('PostMessage failed', { msg, ownerorigin: this.ownerorigin, targetorigin: this.targetorigin, error })
      return false
    }
    if (msg !== 'PlayerUpdate') {
      this.DebugLog('PostMessage sent', { msg, ownerorigin: this.ownerorigin, targetorigin: this.targetorigin, pttReady: this.pttReady })
    }
    if (showMessage && msg !== 'PlayerUpdate') {
      console.log(this.ownerorigin + ' posted message to ' + this.targetorigin, d, this)
    }
    return true
  }
  this.onMessage = function (event) {
    // Check sender origin to be trusted
    if (event.origin !== this.targetorigin) return
    const data = event.data
    if (!data || typeof data !== 'object') {
      this.DebugLog('Message ignored: invalid data', { origin: event.origin, dataType: typeof data })
      return
    }
    if (typeof this[data.m] === 'function') {
      this[data.m].call(null, data.d)
    }
    if (data.m === 'pttReady') {
      this.pttReady = true
      this.DebugLog('pttReady received', { ownerorigin: this.ownerorigin, targetorigin: this.targetorigin, data: data.d })
    } else if (data.m !== 'PlayerUpdate') {
      this.DebugLog('Message received', { msg: data.m, ownerorigin: this.ownerorigin, targetorigin: this.targetorigin })
    }
    if (showMessage && data.m !== 'PlayerUpdate') {
      console.log(this.ownerorigin + ' get message from ' + this.targetorigin, data)
    }
  }
  if (window.addEventListener) {
    if (showMessage) console.log('addEventListener message')
    /* eslint-disable no-useless-call */
    window.addEventListener('message',
      event => {
        this.onMessage.call(this, event)
      }, false)
  } else if (window.attachEvent) {
    if (showMessage) console.log('addEventListener onmessage')
    window.attachEvent('onmessage',
      event => {
        this.onMessage.call(this, event)
      }, false)
    /* eslint-enable no-useless-call */
  }
}
