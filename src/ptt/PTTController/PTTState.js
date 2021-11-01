import { Ptt } from './Ptt'

export const FrameState = Object.freeze({ login: 0, main: 1, board: 2, firstPageofPost: 3, otherPageofPost: 4, boardInfo: 5 })

/**
 * @this {Ptt}
 * @typedef {{connection, login, lock, screenUpdated, lastUpdateTime, frame, screen, serverfull, reconnectTime, deleteOtherConnection}} PttState
 */
export function PttState () {
  return {
    connection: true, // 自動 連線狀態
    login: false, // 自動 登入狀態
    lock: false, // 手動 任務是否執行中
    screenUpdated: false, // 自動
    lastUpdateTime: 0, // 自動 最後更新時間
    frame: 0, // 自動 PTT頁面狀態 0未登入畫面 1主畫面 2看板畫面 3文章畫面第一頁 4文章畫面其他頁
    screen: [], // 自動 畫面資料
    serverfull: false,
    reconnectTime: 10,
    deleteOtherConnection: false
  }
}
