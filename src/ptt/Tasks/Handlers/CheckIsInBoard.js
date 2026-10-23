import { FrameState } from 'PttController/PttState.js'

/**
 * @typedef {import("../../PttController/Ptt").Ptt} Ptt
 * @this {Ptt}
 */
function gotoBoard () {
  this.postData.isCurrectboard = false
  this.insertText('s' + this.postData.board + '\n')
}
function chechBoardInfo () {
  this.insertText('i')
}
function leaveBoardInfo () {
  // 舊版看板資訊頁按任意鍵離開，新版「看板設定與管理」選單需按 q 離開
  this.insertText('q')
}

/**
 * @this {Ptt}
 * @returns {import('./CheckIsCurrectLineInPost.js').HandlerResult} result
 */
export default function CheckIsInBoard () {
  const result = { pass: true, callback: gotoBoard }
  if (this.state.frame === FrameState.main) {
    result.pass = false
  } else if (this.state.frame === FrameState.boardInfo) {
    const reg = '《' + this.postData.board + '》看板設定|看板名稱:\\s*' + this.postData.board + '(?:\\s|$)'
    const isCurrectBoard = this.match(reg, 'i')
    if (isCurrectBoard) {
      this.postData.isCurrectboard = true
    }
    result.pass = false
    result.callback = leaveBoardInfo
  } else if (this.state.frame === FrameState.board) {
    if (this.postData.isCurrectboard) return result
    const isBoardkeyExist = this.match(/【(?:板主:.+|徵求中)】.+(?:看板|系列)《.+》/)
    if (isBoardkeyExist) {
      if (showAllLog)console.log('isBoardkeyExist', this.postData.isCurrectboard, isBoardkeyExist)
      const reg = '【(?:板主:.+|徵求中)】.+(?:看板|系列)《' + this.postData.board + '》'
      const isCurrectBoard = this.match(reg, 'i')
      if (isCurrectBoard) this.postData.isCurrectboard = true
      else result.pass = false
    } else {
      if (showAllLog)console.log('!isBoardkeyExist', this.postData.isCurrectboard)
      result.pass = false
      result.callback = chechBoardInfo
    }
  }
  return result
}
