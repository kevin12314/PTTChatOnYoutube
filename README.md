PTTChatOnYoutubeNext - Youtube聊天室顯示PTT推文Next
========================================

![GitHub license](https://img.shields.io/github/license/kevin12314/pttchatonyoutube) [![Code style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) ![GitHub package.json version](https://img.shields.io/github/package-json/v/kevin12314/pttchatonyoutube?style=plastic) [![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/kevin12314/pttchatonyoutube?sort=semver)](https://greasyfork.org/zh-TW/scripts/418469-pttchatonyoutube) ![GitHub Release Date](https://img.shields.io/github/release-date/kevin12314/pttchatonyoutube)

這個專案會把 PTT 推文顯示到 YouTube 等網站的聊天室區塊中，方便在觀看直播或存檔時同步查看推文內容。

此腳本基於原始專案 [zoosewu/PTTChatOnYoutube](https://github.com/zoosewu/PTTChatOnYoutube) 延伸修改而來，並持續調整網站支援、登入流程與前端介面。

## 使用者文件

如果你是想安裝或使用套件，請直接看 [homepage/README.md](homepage/README.md)。

根目錄 README 主要提供專案背景、開發方式與貢獻相關資訊。

## 專案概況

- 技術棧：Vue 3、Vuex、Webpack 5、Bootstrap 5、Userscript
- 主要目標：在支援網站上將 PTT 推文同步顯示於聊天室或側邊介面

修改內容可參考專案中的 ChangeLog 或 Git commit 紀錄。

## 開發環境需求

- Node.js 與 pnpm
- 建議使用 Chrome 搭配 Tampermonkey
- Firefox 不適合目前這套本地 userscript 開發流程，因為本地檔案載入限制較多

## 快速開始

### 安裝依賴

在專案根目錄執行：

```bash
pnpm install
```

### 啟動開發模式

```bash
pnpm run dev
```

Webpack dev server 啟動後，會提供開發用的 userscript bundle，預設位置是 `http://127.0.0.1:8080/main.user.js`。

### 常用指令

```bash
pnpm run dev
pnpm run build
pnpm run lint
```

## 本地測試

如果你只是想先快速確認介面有沒有正常掛載、聊天室元件有沒有顯示、連結預覽和基本樣式有沒有壞掉，可以直接使用本地測試。

### 方法一：本地測試頁

1. 在專案根目錄執行 `pnpm run dev`
2. 開啟 `http://127.0.0.1:8080/local/index.html?site=blank.org`

本地測試頁會先補齊開發用的 GM API，並直接載入 webpack dev server 的 `/main.user.js`，適合做最基本的介面與互動驗證。

### 方法二：VS Code 內建瀏覽器測試實際網站

1. 在專案根目錄執行 `pnpm run dev`
2. 用 VS Code 內建瀏覽器打開 YouTube 或 Holodex
3. 把 [local/vscode-browser-snippet.js](local/vscode-browser-snippet.js) 的內容貼到 DevTools Snippets 並執行

這個 snippet 會補齊開發用的 GM API，並載入 webpack dev server 的 `/main.user.js`。

如果你的 dev server 不在 8080 port，可以先在 Console 設定：

```js
window.__PTTChatOnYoutubeDevBundleUrl = 'http://127.0.0.1:你的port/main.user.js'
```

再執行 snippet。

### 測試範圍與限制

本地測試頁主要用來驗證前端介面與基本互動，它會使用內建測試資料顯示假推文。

這代表本地測試頁正常，不等於 YouTube 頁面的實際初始化、影片資訊判斷、聊天室容器同步或 PTT 連線流程都已正常。

如果本地測試頁正常、但 YouTube 或 Holodex 頁面異常，問題通常比較可能出在網站初始化條件、頁面結構變動，或注入流程，而不是單純的 Vue 介面壞掉。

### Tampermonkey 載入開發版腳本

如果你要直接在 Tampermonkey 測試開發版腳本，可以把腳本更新網址設成：

```text
http://127.0.0.1:8080/main.user.js
```

之後在 Tampermonkey 重新整理腳本即可。

## 程式碼風格

專案使用 StandardJS 與 eslint-plugin-vue 維持程式碼風格。

提交前可以手動執行：

```bash
pnpm run lint
```

如果你要讓編輯器行為更貼近既有風格，VS Code 可以開啟以下設定：

```json
"javascript.format.insertSpaceBeforeFunctionParenthesis": true
```

## 貢獻與回報

如果你發現問題、想提供建議，或想補強功能，歡迎開 issue 或發 PR。

因為專案歷史較長，某些網站支援與 userscript 注入流程有不少相容性細節；如果能附上重現步驟、網站頁面種類與錯誤訊息，會更容易定位問題。

## 贊助

如果你覺得這個套件好用，歡迎 [點我](https://qr.opay.tw/eZHf2) 贊助原作者zoosewu或使用下方 QR Code。

[![](https://payment.opay.tw/Upload/Broadcaster/2303549/QRcode/QRCode_C65AA1C8A89CB53AF4D93286E44468BF.png "贊助連結")](https://qr.opay.tw/eZHf2)

## 授權

本專案採用 MIT License。

```text
Copyright (c) 2020-2021 zoosewu
```

## 第三方開源程式碼授權

[term.ptt.cc 自動登入](https://openuserjs.org/scripts/maple3142/term.ptt.cc_%E8%87%AA%E5%8B%95%E7%99%BB%E5%85%A5)

```text
author       maple3142
namespace    https://blog.maple3142.net/
license      MIT
```

[enable-vue-devtools](https://github.com/52cik/enable-vue-devtools)

```text
author       楼教主
MIT License
Copyright (c) 2019 楼教主
```

## 近期重要變更

### 4.0.0

- 修正 YouTube 頁面偶發誤跑在 iframe 的問題，避免初始化失敗或按鈕消失。
- 修正直播與直播存檔判斷邏輯，避免誤判成一般影片。
- 修正直播模式下留言自動更新與聊天室自動捲動問題。
- 修正直播存檔播放時，PTT 留言無法依影片進度對齊的問題。
- 修正 YouTube SPA 導航切換時資料不同步問題，包含影片資訊、文章資訊、聊天室內容與登入狀態。
- 修正點擊套件分頁會觸發 YouTube 頁面重新整理的問題。
- 修正 YouTube Trusted Types 啟用後造成套件無法正常運作的問題。
- 修正登入流程可能出現跨網域 SecurityError 導致失敗的問題。
- 修正登入或頁面切換時可能發生的 DOM null removeChild 錯誤。
- 改善頁面切換後 PTT iframe 重建流程，降低重新登入後按鈕無反應情況。
- 調整套件初始高度，未設定時自動套用目前網站聊天室高度。
- 更新前端相容性，改善新版環境下按鈕與主介面不顯示問題。