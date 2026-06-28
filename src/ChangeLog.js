/**
 *
 */
import { showModal } from './bootstrap'

export default function ChangeLog () {
  /**
   * @returns {string} newest post in ptt
   */
  function GetPTTChangeLogURL () {
    return 'https://www.ptt.cc/bbs/C_Chat/M.1654439165.A.725.html'
  }

  /**
   * @returns {object} object of change log
   */
  function AddChangeLogInfo () {
    const changeLogInfo = {}

    changeLogInfo.v_4_3 = new Info()
    changeLogInfo.v_4_3.SPWN.push('新增 SPWN 支援，現在可以在 spwn.jp 的播放頁掛載 PTTChat。')
    changeLogInfo.v_4_3.SPWN.push('新增 SPWN 直播與影片模式判斷，會依頁面狀態切換對應的推文同步模式。')
    changeLogInfo.v_4_3.版本.push('改善登入初始化時序，避免 PTT iframe 尚未就緒時按下登入沒有反應。')
    changeLogInfo.v_4_3.版本.push('修正修改字體大小沒有作用的問題。')
    changeLogInfo.v_4_3.版本.push('修正修改套件長度會被還原成聊天室高度的問題。')

    changeLogInfo.v_4_2 = new Info()
    changeLogInfo.v_4_2.版本.push('新增 X/Twitter 貼文連結懸停預覽 MVP，支援 x.com 與 twitter.com 的 status 連結顯示貼文卡片。')
    changeLogInfo.v_4_2.版本.push('新增 verb.tw 圖床圖片預覽支援，現在可辨識 i.verb.tw 直連與 img.verb.tw/view 圖片頁連結。')
    changeLogInfo.v_4_2.版本.push('修正作業系統不是使用台灣時區，觀看紀錄檔時間會對不上的問題。')
    changeLogInfo.v_4_2.HoloDex.push('修正使用腳本時會使Holodex撥放影片時無法正常隱藏控制項的問題。')

    changeLogInfo.v_4_1 = new Info()
    changeLogInfo.v_4_1.Youtube.push('新增聊天室圖片連結懸停預覽，滑鼠停留片刻後會顯示圖片預覽。')
    changeLogInfo.v_4_1.Youtube.push('支援直接圖片連結、Imgur 頁面連結、Meee 圖床連結，以及 YouTube 影片縮圖預覽。')
    changeLogInfo.v_4_1.Youtube.push('新增 X/Twitter 貼文連結懸停預覽 MVP，支援 x.com 與 twitter.com 的 status 連結顯示貼文卡片。')
    changeLogInfo.v_4_1.Youtube.push('改善圖片預覽定位邏輯，預覽視窗會依據目前滑鼠位置與瀏覽器邊界自動調整顯示位置。')
    changeLogInfo.v_4_1.Youtube.push('修正 YouTube 劇院模式下，PTTChat 可能掛到錯誤聊天室容器，導致版面跑掉的問題。')
    changeLogInfo.v_4_1.Youtube.push('修正 YouTube 切換劇院模式時，PTT iframe 可能被重建，進而造成登入狀態異常或登入按鈕無反應的問題。')
    changeLogInfo.v_4_1.Youtube.push('改善 YouTube 頁面捲動、視窗縮放與播放器更新時的定位同步，減少面板位置延遲更新或跳動的情況。')
    changeLogInfo.v_4_1.Youtube.push('修正 PTTChat 可能遮擋 YouTube 原生聊天室操作的問題，像是聊天室輸入框與重點聊天室訊息切換。')
    changeLogInfo.v_4_1.Youtube.push('調整 YouTube 預定直播的分類邏輯，從原先視為影片改為視為直播。')
    changeLogInfo.v_4_1.HoloDex.push('改善 HoloDex 頁面中 PTTChat 的相容性，減少宿主頁樣式介入造成的欄位間距與排版異常。')
    changeLogInfo.v_4_1.版本.push('修正 YouTube 頁面的內容安全政策會阻擋聊天室 inline event handler，導致圖片預覽與部分互動失效的問題。')
    changeLogInfo.v_4_1.版本.push('調整聊天室連結互動為事件委派處理，避免頁面安全政策變更時功能失效。')
    changeLogInfo.v_4_1.版本.push('調整事件處理、掛載邏輯與樣式覆蓋範圍，避免修正 YouTube 問題時影響其他支援網站的既有行為。')
    changeLogInfo.v_4_1.版本.push('修正 Imgur 圖片預覽因 referrer 問題導致的 403 錯誤。')

    changeLogInfo.v_4_0 = new Info()
    changeLogInfo.v_4_0.Youtube.push('修正 YouTube 頁面中腳本可能誤跑在 iframe 內，導致初始化失敗或按鈕消失的問題。')
    changeLogInfo.v_4_0.Youtube.push('修正 YouTube 直播與直播存檔的判斷邏輯，避免把直播誤判成一般影片。')
    changeLogInfo.v_4_0.Youtube.push('修正直播時 PTT 留言不會自動更新、聊天室不會自動捲到底部的問題。')
    changeLogInfo.v_4_0.Youtube.push('修正直播存檔播放時，無法依照影片目前進度對齊對應 PTT 留言的問題。')
    changeLogInfo.v_4_0.Youtube.push('修正從 YouTube 首頁以 SPA 方式導航到直播存檔時，開台時間與關台時間無法顯示的問題。')
    changeLogInfo.v_4_0.Youtube.push('修正點擊套件分頁（聊天室／連線設定／說明／PTT畫面／log）時，會導致 YouTube 頁面重新整理的問題。')
    changeLogInfo.v_4_0.Youtube.push('修正 YouTube 啟用 Trusted Types 安全政策時，套件因 TrustedHTML 限制而無法正常運作的問題。')
    changeLogInfo.v_4_0.Youtube.push('修正 YouTube 站內以 SPA 方式從直播存檔切換到其他直播或影片時，影片資訊、文章資訊、聊天室內容與登入狀態不會同步更新的問題。')
    changeLogInfo.v_4_0.版本.push('修正登入時可能出現跨網域 SecurityError，導致登入流程失敗的問題。')
    changeLogInfo.v_4_0.版本.push('修正登入或頁面切換時，DOM 清理可能發生 null removeChild 錯誤的問題。')
    changeLogInfo.v_4_0.版本.push('改善頁面切換後 PTT iframe 重建流程，避免重新登入時按鈕無反應。')
    changeLogInfo.v_4_0.版本.push('調整套件初始高度，未設定時會自動套用目前網站聊天室高度。')
    changeLogInfo.v_4_0.版本.push('更新前端相容性，改善新版環境下套件按鈕與主介面不顯示的問題。')

    changeLogInfo.v_3_1 = new Info()
    changeLogInfo.v_3_1.Youtube.push('修正Youtube實況尚未開始時如果有預告影片會導致套件判斷錯誤的問題(Koyori及Roboko)。')
    changeLogInfo.v_3_1.Youtube.push('修正按鈕會消失的情況。')
    changeLogInfo.v_3_1.版本.push('修正推文有時候沒有反應的問題，增加推文時的回饋。')
    changeLogInfo.v_3_1.版本.push('修正黑名單沒有輸入任何內容會無法顯示聊天室的錯誤。')
    changeLogInfo.v_3_1.版本.push('修正Firefox新模式的推文會超出介面的問題。')
    changeLogInfo.v_3_1.版本.push('修正關閉灰色漸變功能沒有產生效果的問題。')
    changeLogInfo.v_3_1.Twitch.push('修正套件會被原生介面擋住的問題。')
    changeLogInfo.v_3_1.HoloDex.push('修正新模式沒辦法使用的問題。')

    changeLogInfo.v_3_0 = new Info()
    changeLogInfo.v_3_0.版本.push('使用新的搜尋功能，可以搜尋標題、AID、作者、推文數、稿酬、標記等。\n舊版的AID(#1WHqSb2l (C_Chat))依然可以使用。')
    changeLogInfo.v_3_0.版本.push('修正版主ID+版標太常導致看板名稱消失後就會無法辨識看板的問題。')
    changeLogInfo.v_3_0.版本.push('現在可以套件關閉對特定網站的支援了。')
    changeLogInfo.v_3_0.版本.push('現在可以對每個網站做套件設定了。')
    changeLogInfo.v_3_0.版本.push('修正firefox無法使用的問題。')
    changeLogInfo.v_3_0.版本.push('現在可以針對推文的關鍵字做黑名單了，只要推文內容包含關鍵字就不會顯示。')
    changeLogInfo.v_3_0.版本.push('修正log頁籤的內容，現在可以正確的顯示套件的各項資訊了。')

    changeLogInfo.v_2_9 = new Info()
    changeLogInfo.v_2_9.HoloDex.push('修正holodex改版造成套件失效的問題。')

    changeLogInfo.v_2_8 = new Info()
    changeLogInfo.v_2_8.HoloTools.push('修復在新版HoloTools中無法使用的問題。')
    changeLogInfo.v_2_8.HoloTools.push('支援新版HoloTools聊天室開關、佈局切換。')
    changeLogInfo.v_2_8.HoloTools.push('修正開台數多時會擋住增加指定影片按鈕的問題。')
    changeLogInfo.v_2_8.HoloDex.push('支援嵌入式顯示模式，可以在分割中使用PTT聊天室並自訂大小、位置了。<br>詳細說明：<a href="https://github.com/zoosewu/PTTChatOnYoutube/tree/master/homepage#holodex" target="_blank">github</a>')
    changeLogInfo.v_2_8.HoloDex.push('在右上方控制列中新增新舊版PTT聊天室切換開關。')
    changeLogInfo.v_2_8.版本.push('修復PTT新式游標在搜尋超過五位數文章數時會發生錯誤的問題。')
    changeLogInfo.v_2_8.版本.push('修復在同看板使用同標題搜尋時不會更新標題預覽及跳轉至聊天室的問題。')
    changeLogInfo.v_2_8.版本.push('修復在PTT卡住後無法再使用標題搜尋功能的問題。')
    changeLogInfo.v_2_8.版本.push('支援回文、轉文的搜尋。')
    changeLogInfo.v_2_8.版本.push('修正若干css問題。')
    changeLogInfo.v_2_8.版本.push('修正網站原生對話框(如結帳頁面)會錯誤的問題。')
    changeLogInfo.v_2_8.版本.push('現在會完全隱藏被黑名單ID的推文了。')

    changeLogInfo.v_2_7 = new Info()
    changeLogInfo.v_2_7.HoloTools.push('(舊版)在右上方控制列中新增<strong>PTT聊天室開關</strong>與<strong>切換顯示佈局按鈕</strong>。<br>')
    changeLogInfo.v_2_7.HoloTools.push('<p><b>PTT聊天室開關</b>：<br>&emsp;&emsp;現在可以在不用時完全隱藏PTT聊天室，回復佔用的空間。</p>')
    changeLogInfo.v_2_7.HoloTools.push('<p><b>切換顯示佈局按鈕</b>：<br>&emsp;&emsp;支援直立式螢幕顯示，將聊天室移到底部。</p>')
    changeLogInfo.v_2_7.版本.push('新增更新日誌，套件更新時會顯示更新資訊，並且可以點擊閱讀更多按鈕查看更新說明文章。')

    changeLogInfo.v_2_6 = new Info()
    changeLogInfo.v_2_6.版本.push('新增黑名單功能。')
    changeLogInfo.v_2_6.版本.push('新增標題搜尋功能。')
    changeLogInfo.v_2_6.HoloDex.push('支援HoloDex。')

    return changeLogInfo
  }

  const previousVersion = GM_getValue('previousVersion', '2.9.0').split('.')
  const nowVerion = GM_info.script.version.split('.')
  GM_setValue('previousVersion', GM_info.script.version)
  if (nowVerion[0] <= previousVersion[0] && nowVerion[1] <= previousVersion[1]) return
  class Info { constructor () { this.版本 = []; this.HoloDex = []; this.HoloTools = []; this.Twitch = []; this.Nijimado = []; this.Youtube = []; this.SPWN = [] } }
  const allChangeLogInfo = AddChangeLogInfo()
  const changeLogInfo = GetChangeLogInfo(new Info(), +previousVersion[0], +previousVersion[1] + 1)
  const encodedLogHTML = EncodeChangeLog(changeLogInfo)
  const changeLogHTML = encodedLogHTML.trim().length > 0
    ? encodedLogHTML
    : `<div>目前版本 ${GM_info.script.version} 尚未整理更新日誌內容。</div>`
  const PTTChangeLogURL = GetPTTChangeLogURL()

  // data-backdrop should be empty
  const modal = `
    <div id="PTTChangeLog" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">PTTChatOnYoutube更新日誌</h4>
          </div>
          <div class="modal-body">
              ${changeLogHTML}
          </div>
          <div class="modal-footer">
          <a href="${PTTChangeLogURL}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" type="button">閱讀更多</a>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">關閉</button>
          </div>
        </div>
      </div>
    </div>`
  const pttChat = document.getElementById('PTTChat')
  if (pttChat) document.body.insertAdjacentHTML('beforeend', modal)
  showModal(document.getElementById('PTTChangeLog'), { backdrop: true, keyboard: false })

  /**
   * @param {object} info ..
   * @param {string} major major version number
   * @param {string} minor minor version number
   * @returns {object} Logs to show
   */
  function GetChangeLogInfo (info, major, minor) {
    if (+major > +nowVerion[0]) return info
    if (+major === +nowVerion[0] && +minor > +nowVerion[1]) return info
    const newInfo = allChangeLogInfo['v_' + major + '_' + minor]
    if (newInfo !== undefined) {
      for (const key in newInfo) {
        info[key] = info[key].concat(newInfo[key])
      }
    }
    if (+major < +nowVerion[0]) {
      // 還在舊 major：先嘗試下一個 minor，若無對應 key 才跳下一個 major
      if (allChangeLogInfo['v_' + major + '_' + (+minor + 1)] !== undefined) {
        return GetChangeLogInfo(info, +major, +minor + 1)
      } else {
        return GetChangeLogInfo(info, +major + 1, 0)
      }
    } else {
      // 已在目前 major：以 nowVerion[1] 為上限
      if ((+minor + 1) <= +nowVerion[1]) return GetChangeLogInfo(info, +major, +minor + 1)
    }
    return info
  }
  /**
   * @param {object} log ..
   * @returns {string} HTML data with Logs
   */
  function EncodeChangeLog (log) {
    let logHTML = ''
    for (const key in log) {
      if (log[key].length !== 0) {
        let tmp = ''
        for (let index = 0; index < log[key].length; index++) {
          tmp = String.prototype.concat(tmp, `<li>${log[key][index]}</li>`)
        }
        logHTML = String.prototype.concat(logHTML, `<div style="margin: 5px 0px"><b>${key}：</b>`)
        if (key === '版本') logHTML = String.prototype.concat(logHTML, `${GM_info.script.version}`)
        logHTML = String.prototype.concat(logHTML, '<ul style="margin: 2px 0px;padding-left: 30px;">', tmp, '</ul></div>')
      }
    }
    return logHTML
  }
}
