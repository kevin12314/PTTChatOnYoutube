import { Login } from './Tasks/Login'
import GetCommentByAID from './Tasks/GetCommentByAID'
import GetCommentByAnySearch from './Tasks/GetCommentByAnySearch'
import SetComment from './Tasks/SetComment'
/**
 * @typedef {import("./PttController/Ptt").Ptt} Ptt
 * @this {Ptt}
 */
export default function eventBind () {
  this.pendingSearch = null
  this.flushPendingSearch = () => {
    if (this.state.lock || !this.pendingSearch) return
    const { event, data } = this.pendingSearch
    this.pendingSearch = null
    bindEvent.call(this, event, data)
  }
  this.msg.login = data => bindEvent.apply(this, [Login, data])
  this.msg.getCommentByAID = data => bindEvent.apply(this, [GetCommentByAID, data])
  this.msg.getCommentByAnySearch = data => bindEvent.apply(this, [GetCommentByAnySearch, data])
  this.msg.setNewcomment = data => bindEvent.apply(this, [SetComment, data])
}
/**
 * @this {Ptt}
 */
function bindEvent (event, data) {
  const isSearch = event === GetCommentByAID || event === GetCommentByAnySearch
  if (isSearch && data.background && this.pendingSearch) return
  if (this.state.lock) {
    if (isSearch && !data.background) {
      this.pendingSearch = { event, data: { ...data } }
      this.msg.PostMessage('alert', { type: 1, msg: '已收到搜尋，將於目前操作完成後切換文章。' })
    }
    return
  }
  if (isSearch && !data.background) this.pendingSearch = null
  this.lock()
  this.addTask(event, data)
}
