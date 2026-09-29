import { RunHandler } from './HandlerRunner'
import CheckIsLogined from './Handlers/CheckIsLogined'
import CheckIsInBoard from './Handlers/CheckIsInBoard.js'
import CheckIsCurrectPost from './Handlers/CheckIsCurrectPost'
import CheckIsInsideTitleInPost from './Handlers/CheckIsInsideTitleInPost.js'
import SetNewComment from './Handlers/SetNewComment.js'
import RecieveData from '../MessagePosterData/RecieveData.js'
import GetCommentByAnySearch from './GetCommentByAnySearch'

const setCommentTaskList = [
  () => { if (reportMode)console.log('run setCommentTaskList'); return { pass: true } },
  CheckIsLogined,
  CheckIsInBoard,
  CheckIsCurrectPost,
  CheckIsInsideTitleInPost
]
/**
 * @this {Ptt}
 */
function startPosting () {
  // Once the article is verified, dialogs belong to the posting handler.
  // Rechecking a title hidden by a dialog can send qq out of the article.
  this.addTask(RunHandler, [SetNewComment], recieveNewComment)
}
/**
 * @this {Ptt}
 */
function recieveNewComment () {
  if (reportMode) console.log(this.postData)
  this.msg.PostMessage('commentedText', this.recieveData)
  this.addTask(GetCommentByAnySearch, { board: this.postData.board, key: this.postData.key })
}
/**
 * @typedef {import("../PttController/Ptt").Ptt} Ptt
 * @this {Ptt}
 */
export default function SetComment (pushtext) {
  let allowedchar = 24
  let addedtext = ''
  let trytime = 7
  while (trytime >= 0 && allowedchar > 0 && pushtext.length > 0) {
    const addtextreg = '(.{0,' + allowedchar + '})(.*)' // (.{0,24})(.*)
    const result = new RegExp(addtextreg).exec(pushtext)
    addedtext += result[1]
    const halfchar = addedtext.match(/[A-Za-z0-9_ :/\\.?=%]/g)
    const halfcount = halfchar ? halfchar.length : 0
    allowedchar = parseInt((48 - addedtext.length * 2 + halfcount) / 2)
    pushtext = result[2]
    if (reportMode) {
      console.log('SetNewPushTask Text Reg==', addedtext.length * 2, '==', halfcount, '==', halfchar)
      console.log('SetNewPushTask Text Reg==', addedtext, '==', pushtext, '==', allowedchar, '==', result)
    }
    trytime--
  }
  this.postData.commentText = addedtext
  this.postData.TrySetNewComment = 0
  this.recieveData = new RecieveData()
  this.addTask(RunHandler, setCommentTaskList, startPosting)
  this.endTask()
}
