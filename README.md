PTTChatOnYoutube - Youtube聊天室顯示PTT推文Next
========================================
![GitHub license](https://img.shields.io/github/license/kevin12314/pttchatonyoutube) [![Code style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) ![GitHub package.json version](https://img.shields.io/github/package-json/v/kevin12314/pttchatonyoutube?style=plastic) [![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/kevin12314/pttchatonyoutube?sort=semver)](https://greasyfork.org/zh-TW/scripts/418469-pttchatonyoutube) ![GitHub Release Date](https://img.shields.io/github/release-date/kevin12314/pttchatonyoutube)

如果你想了解套件如何使用請[點我](https://github.com/kevin12314/PTTChatOnYoutube/tree/master/homepage)

## 專案說明

此腳本基於原始專案 [zoosewu/PTTChatOnYoutube](https://github.com/zoosewu/PTTChatOnYoutube) 而來，並在此基礎上調整與修改了部分功能。

修改內容可參考專案中的 ChangeLog 或 Git commit 紀錄。

## 4.0.0 重要修改

- 修正 YouTube 頁面偶發誤跑在 iframe 的問題，避免初始化失敗或按鈕消失。
- 修正直播與直播存檔判斷邏輯，避免誤判成一般影片。
- 修正直播模式下留言自動更新與聊天室自動捲動問題。
- 修正直播存檔播放時，PTT 留言無法依影片進度對齊的問題。
- 修正 YouTube SPA 導航切換（首頁、直播、影片）時資料不同步問題，包含影片資訊、文章資訊、聊天室內容與登入狀態。
- 修正點擊套件分頁會觸發 YouTube 頁面重新整理的問題。
- 修正 YouTube Trusted Types 啟用後造成套件無法正常運作的問題。
- 修正登入流程可能出現跨網域 SecurityError 導致失敗的問題。
- 修正登入或頁面切換時可能發生的 DOM null removeChild 錯誤。
- 改善頁面切換後 PTT iframe 重建流程，降低重新登入後按鈕無反應情況。
- 調整套件初始高度，未設定時自動套用目前網站聊天室高度。
- 更新前端相容性，改善新版環境下按鈕與主介面不顯示問題。

## 如何開始參與開發

在專案底下輸入 ```pnpm install``` 安裝開發環境

推薦使用violentmonkey，並使用chrome開發，Firefox無法載入本地檔案

在專案底下輸入 ```pnpm run dev```，每次腳本存檔都會自動更新腳本

在專案底下輸入 ```pnpm run watch-scss```，每次css存檔都會自動更新腳本

如果需要追蹤scss，可以使用 ```pnpm run watch-scss-map```就會生成帶map檔的css，但是限定http使用。

腳本更新依照下面步驟操作之後存檔完在violentmonkey設定那邊按一下更新就能測試

在腳本更新網址輸入伺服器腳本位置```http://127.0.0.1:8889/publish/PTTChatOnYt.user.js```

### Coding Style:

程式碼使用StandardJS及eslint-plugin-vue確保程式碼風格，並且會在commit之前做檢查，可以手動執行```pnpm run lint```確認有沒有錯誤及警告。

安裝eslint以在pre-commit前檢查```pnpm add -g eslint```

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

###### VSCode
```設定請開啟 "javascript.format.insertSpaceBeforeFunctionParenthesis": true```

## 建議及回報

因為我本身是寫Unity C#，前後端都不太了解也不常碰js。

如果有任何建議或指教請歡迎討論或發PR。

## 贊助

如果你覺得這個套件好用，歡迎[點我](https://qr.opay.tw/eZHf2)贊助或使用下方QR Code。

[![](https://payment.opay.tw/Upload/Broadcaster/2303549/QRcode/QRCode_C65AA1C8A89CB53AF4D93286E44468BF.png "贊助連結")](https://qr.opay.tw/eZHf2)

## 本專案授權

MIT License
Copyright (c) 2020-2021 zoosewu

## 開源程式碼授權
[term.ptt.cc 自動登入](https://openuserjs.org/scripts/maple3142/term.ptt.cc_%E8%87%AA%E5%8B%95%E7%99%BB%E5%85%A5)
```
author       maple3142
namespace    https://blog.maple3142.net/
license      MIT
```
[enable-vue-devtools](https://github.com/52cik/enable-vue-devtools)
```
author       楼教主
MIT License
Copyright (c) 2019 楼教主
```
