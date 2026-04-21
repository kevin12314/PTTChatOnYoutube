import InitApp from 'src/app/appindex'
import { collapseAction } from 'src/bootstrap'
import ChangeLog from 'src/ChangeLog'
import { ThemeCheck } from 'src/library'
import gaUseExtensionEvent from 'src/ga/useExtensionEvent'

export default function InitHD (messageposter, siteName) {
  // Check Theme
  const WhiteTheme = ThemeCheck('html', '250, 250, 250')

  let recentWatch = false
  let observer
  let layoutObserver
  let classicSidebarResizeHandler
  let classicHeaderFill
  let classicThemeObserver
  let activeHolodexCleanup
  let mountEmbeddedAppToCell = () => {}

  setInterval(() => {
    const url = /https:\/\/holodex\.net\/multiview/.exec(window.location.href)
    if (!url) {
      if (recentWatch && typeof activeHolodexCleanup === 'function') activeHolodexCleanup()
      recentWatch = false
    } else if (!recentWatch) initHolodex()
  }, 1000)

  function initHolodex () {
    if (typeof activeHolodexCleanup === 'function') activeHolodexCleanup()

    const embeddedInstanceId = 'holodex-embedded'
    const useEmbeddedMode = GM_getValue('PluginTypeHolodex', '1') === '0'
    const pluginWidth = parseInt(GM_getValue('PluginWidth', 350), 10)
    const liveControls = $('.justify-end.d-flex.mv-toolbar-btn.align-center.no-btn-text')
    const fakeparent = $('#fakeparent').length !== 0
      ? $('#fakeparent').eq(0)
      : $('<div id="fakeparent" class="d-flex flex-row"></div>')
    const defaultVideoHandler = $('#holotoolsvideohandler').length !== 0
      ? $('#holotoolsvideohandler').eq(0)
      : $('<div id="holotoolsvideohandler" style="flex:1 1 auto;"></div>')
    const PTTChatHandler = $('#pttchatparent').length !== 0
      ? $('#pttchatparent').eq(0)
      : $('<div id="pttchatparent" class="p-0 d-flex"></div>')
    const defaultVideo = $('.vue-grid-layout')
    const parent = defaultVideo.parent()
    $('#HDClassicMode').remove()
    $('#ptt-switch-btn').remove()
    const iconSwitch = $('<button type="button" id="ptt-switch-btn" title="切換PTT顯示模式" style="width: 36px; margin: 4px; padding-top: 6px"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg></button>')
    const iconPTT = $('<button type="button" id="HDClassicMode" class="openpttchat" title="展開/隱藏PTT聊天室" style="height: 36px; width: 36px; margin: 3px; font-size: 21px;">P</button>')
    let classicAppHandle = null
    let embeddedAppHandle = null
    let embeddedActiveCell = null
    let embeddedFrameSyncTimer = null
    let embeddedYtStateFixHandler = null
    let nowWidth = 0
    liveControls.prepend(iconPTT, iconSwitch)

    function getOrCreateParkingLot () {
      let parkingLot = document.getElementById('pttchat-holodex-parking')
      if (!parkingLot) {
        parkingLot = document.createElement('div')
        parkingLot.id = 'pttchat-holodex-parking'
        parkingLot.style.display = 'none'
        document.body.appendChild(parkingLot)
      }
      return parkingLot
    }

    function getToolbarElement () {
      return document.querySelector('.mv-toolbar') || document.querySelector('.v-app-bar') || document.querySelector('.v-toolbar')
    }

    function getToolbarHeight () {
      const toolbar = document.querySelector('.v-main__wrap .v-toolbar__content') || document.querySelector('.v-toolbar__content')
      return toolbar ? toolbar.offsetHeight : 64
    }

    function getToolbarBackground () {
      const toolbar = getToolbarElement()
      return toolbar ? getComputedStyle(toolbar).backgroundColor : '#1f1f1f'
    }

    function getToolbarBorderColor () {
      const toolbar = getToolbarElement()
      return toolbar ? getComputedStyle(toolbar).borderBottomColor : 'transparent'
    }

    function getToolbarForeground () {
      const toolbar = getToolbarElement()
      return toolbar ? getComputedStyle(toolbar).color : '#F2F2F2'
    }

    function getHolodexThemeClass () {
      const app = document.querySelector('.v-application')
      if (app && app.classList.contains('theme--light')) return 'theme--light'
      return 'theme--dark'
    }

    function getHolodexPanelBackground () {
      const toolbarBackground = getToolbarBackground()
      if (toolbarBackground && toolbarBackground !== 'rgba(0, 0, 0, 0)') return toolbarBackground

      const mainWrap = getMainWrap()
      if (mainWrap) {
        const mainWrapBackground = getComputedStyle(mainWrap).backgroundColor
        if (mainWrapBackground && mainWrapBackground !== 'rgba(0, 0, 0, 0)') return mainWrapBackground
      }

      return getComputedStyle(document.body).backgroundColor || '#272727'
    }

    function applyHolodexPanelTheme (rootId = 'PTTChat') {
      const panelBackground = getHolodexPanelBackground()
      const foreground = getToolbarForeground()
      const setImportantStyle = (element, property, value) => {
        if (!element) return
        element.style.setProperty(property, value, 'important')
      }

      const panelRoot = document.getElementById(rootId)
      setImportantStyle(panelRoot, 'background-color', panelBackground)
      setImportantStyle(panelRoot, 'color', foreground)
      setImportantStyle(panelRoot, '--bs-body-bg', panelBackground)
      setImportantStyle(panelRoot, '--bs-modal-bg', panelBackground)
      setImportantStyle(panelRoot, '--bs-dark-bg-subtle', panelBackground)
    }

    function getOrCreateClassicHeaderFill () {
      if (!classicHeaderFill || !classicHeaderFill.parentNode) {
        classicHeaderFill = document.createElement('div')
        classicHeaderFill.id = 'pttchat-classic-header-fill'
        document.body.appendChild(classicHeaderFill)
      }
      return classicHeaderFill
    }

    function applyClassicHeaderFill (width) {
      const headerFill = getOrCreateClassicHeaderFill()
      const toolbarHeight = getToolbarHeight()
      if (width > 0) {
        Object.assign(headerFill.style, {
          position: 'fixed',
          top: '0px',
          right: '0px',
          width: `${width}px`,
          height: `${toolbarHeight}px`,
          background: getToolbarBackground(),
          borderBottom: `1px solid ${getToolbarBorderColor()}`,
          boxSizing: 'border-box',
          zIndex: '2',
          pointerEvents: 'none',
          display: 'block'
        })
      } else {
        headerFill.style.display = 'none'
      }
    }

    function syncClassicToolbarTheme () {
      const iconColor = getToolbarForeground()
      iconSwitch.css('color', iconColor)
      iconSwitch.find('svg').attr('fill', iconColor)
      applyHolodexPanelTheme()
      if (embeddedAppHandle) applyHolodexPanelTheme(embeddedAppHandle.ids.rootId)
      applyClassicHeaderFill(nowWidth)
      // sync embedded cell button theme
      const themeClass = getHolodexThemeClass()
      const otherThemeClass = themeClass === 'theme--dark' ? 'theme--light' : 'theme--dark'
      if (embeddedActiveCell && embeddedActiveCell.length) {
        embeddedActiveCell.find('.pttchat-edit-layout-btn, .pttchat-back-btn, .pttchat-confirm-btn')
          .each((i, el) => { el.classList.remove(otherThemeClass); el.classList.add(themeClass) })
        embeddedActiveCell.find('.pttchat-edit-layout-btn .v-icon, .pttchat-back-btn .v-icon, .pttchat-confirm-btn .v-icon')
          .each((i, el) => { el.classList.remove(otherThemeClass); el.classList.add(themeClass) })
        embeddedActiveCell.find('.pttchat-edit-layout-btn')
          .css('color', iconColor)
      }
    }

    function getMainWrap () {
      return document.querySelector('.v-main__wrap')
    }

    function applyClassicSidebarGap (width) {
      const mainWrap = getMainWrap()
      if (!mainWrap) return

      if (width > 0) {
        mainWrap.style.width = `calc(100% - ${width}px)`
        mainWrap.style.maxWidth = `calc(100% - ${width}px)`
        mainWrap.style.marginRight = `${width}px`
      } else {
        mainWrap.style.width = ''
        mainWrap.style.maxWidth = ''
        mainWrap.style.marginRight = ''
      }
    }

    function syncClassicPanelHeights () {
      if (GM_getValue('PluginTypeHolodex', '1') !== '1') return

      const toolbarHeight = getToolbarHeight()
      const availableHeight = Math.max(window.innerHeight - toolbarHeight, 0)
      const navHeight = $('#PTTChat-navbar').length !== 0 ? $('#PTTChat-navbar').outerHeight(true) || 0 : 0
      const contentsHeight = Math.max(availableHeight - navHeight, 0)

      const setImportantStyle = (selector, property, value) => {
        const element = document.querySelector(selector)
        if (!element) return
        element.style.setProperty(property, value, 'important')
      }

      PTTChatHandler[0]?.style.setProperty('height', `${availableHeight}px`, 'important')
      setImportantStyle('#PTTChat', 'height', `${availableHeight}px`)
      setImportantStyle('#PTTChat', 'max-height', `${availableHeight}px`)
      setImportantStyle('#PTTMain', 'height', `${availableHeight}px`)
      setImportantStyle('#PTTMain', 'max-height', `${availableHeight}px`)
      setImportantStyle('#PTTMain', 'overflow', 'hidden')
      setImportantStyle('#PTTChat-app', 'height', `${availableHeight}px`)
      setImportantStyle('#PTTChat-app', 'max-height', `${availableHeight}px`)
      setImportantStyle('#PTTChat-app', 'overflow', 'hidden')
      setImportantStyle('#PTTChat-contents', 'height', `${contentsHeight}px`)
      setImportantStyle('#PTTChat-contents', 'max-height', `${contentsHeight}px`)
      setImportantStyle('#PTTChat-contents', 'min-height', `${contentsHeight}px`)
    }

    function syncPttTargetWindow () {
      const pttFrameElement = document.getElementById('PTTframe')
      if (!pttFrameElement || !pttFrameElement.contentWindow) return false
      messageposter.targetWindow = pttFrameElement.contentWindow
      return true
    }

    function ensureClassicApp () {
      if (classicAppHandle && document.getElementById(classicAppHandle.ids.rootId)) return classicAppHandle

      classicAppHandle = InitApp($('#pttchatparent'), WhiteTheme, true, messageposter, siteName)
      ChangeLog()
      return classicAppHandle
    }

    function destroyClassicApp () {
      if (!classicAppHandle) return
      classicAppHandle.unmount()
      classicAppHandle = null
    }

    function getEmbeddedIds () {
      return embeddedAppHandle ? embeddedAppHandle.ids : null
    }

    function parkSharedPttFrame () {
      const parkingLot = getOrCreateParkingLot()
      const fp = document.getElementById('ptt-frame-parent')
      if (!fp) return
      if (fp.parentElement !== parkingLot[0]) {
        $(fp).appendTo(parkingLot)
      }
      // Always ensure hidden and reset any CSS overlay from embedded mode
      Object.assign(fp.style, { display: 'none', position: '', left: '', top: '', width: '', height: '', margin: '', zIndex: '5000', pointerEvents: 'auto' })
      $('#PTTframe').css({ border: 'none', display: 'none' })
    }

    function hideEmbeddedPttFrame () {
      const fp = document.getElementById('ptt-frame-parent')
      if (!fp) return
      // Keep at body level so position:fixed works even when hidden.
      // display:none on an ancestor breaks fixed children.
      if (fp.parentElement !== document.body) document.body.appendChild(fp)
      Object.assign(fp.style, {
        display: 'block',
        position: 'fixed',
        left: '-9999px',
        top: '0px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: '-1',
        margin: '0'
      })
      const iframe = document.getElementById('PTTframe')
      if (iframe) { iframe.style.border = 'none'; iframe.style.display = 'block' }
    }

    function configureSharedPttFrameForClassic () {
      const frameParent = $('#ptt-frame-parent')
      if (frameParent.length === 0) return

      $('.vue-grid-layout').append(frameParent.css({
        display: '',
        position: 'absolute',
        margin: '',
        top: '',
        left: '',
        width: '',
        height: '',
        'z-index': '5000',
        'pointer-events': 'auto'
      }))
      $('#PTTframe').css({ border: 'none', display: 'none', width: '', height: '' })
      syncPttTargetWindow()
    }

    function configureSharedPttFrameForEmbedded (ids) {
      const paneMain = document.getElementById(ids.pttPaneMainId)
      const pane = document.getElementById(ids.pttPaneId)
      const frameParent = document.getElementById('ptt-frame-parent')
      const iframe = document.getElementById('PTTframe')
      const targetHost = paneMain || pane
      if (!targetHost || !frameParent || !iframe) return

      // Ensure at body level so position:fixed works correctly.
      if (frameParent.parentElement !== document.body) document.body.appendChild(frameParent)
      // Use CSS fixed overlay to show the iframe without moving it in the DOM.
      // Moving the iframe causes it to reload, resetting the PTT connection.
      const rect = targetHost.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      Object.assign(frameParent.style, {
        display: 'block',
        position: 'fixed',
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.top)}px`,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`,
        margin: '0',
        zIndex: '5001',
        pointerEvents: 'auto'
      })
      Object.assign(iframe.style, {
        display: 'block',
        width: '100%',
        height: '100%',
        border: 'none'
      })
      syncPttTargetWindow()
    }

    function restoreEmbeddedCellHost () {
      if (!embeddedActiveCell || embeddedActiveCell.length === 0) {
        embeddedActiveCell = null
        return
      }

      const sheet = embeddedActiveCell.find('.mv-cell.v-sheet').eq(0)
      const cellContent = sheet.children('.cell-content').eq(0)
      const contentElement = cellContent[0]
      const centeredBtn = embeddedActiveCell.data('pttchatCenteredBtn')
      const cellControl = cellContent.children('.cell-control').eq(0)
      const dimensions = sheet.children('.dimensions').eq(0)
      const handles = embeddedActiveCell.children('.vue-resizable-handle')

      if (contentElement && contentElement.dataset.pttchatPrevStyle !== undefined) {
        if (contentElement.dataset.pttchatPrevStyle) contentElement.setAttribute('style', contentElement.dataset.pttchatPrevStyle)
        else contentElement.removeAttribute('style')
        delete contentElement.dataset.pttchatPrevStyle
      }
      if (sheet[0] && sheet[0].dataset.pttchatPrevClassName !== undefined) {
        sheet[0].className = sheet[0].dataset.pttchatPrevClassName
        delete sheet[0].dataset.pttchatPrevClassName
      }
      if (contentElement && contentElement.dataset.pttchatPrevClassName !== undefined) {
        contentElement.className = contentElement.dataset.pttchatPrevClassName
        delete contentElement.dataset.pttchatPrevClassName
      }
      if (cellControl[0] && cellControl[0].dataset.pttchatPrevClassName !== undefined) {
        cellControl[0].className = cellControl[0].dataset.pttchatPrevClassName
        delete cellControl[0].dataset.pttchatPrevClassName
      }
      if (cellControl[0] && cellControl[0].dataset.pttchatPrevDisplay !== undefined) {
        cellControl[0].style.display = cellControl[0].dataset.pttchatPrevDisplay
        delete cellControl[0].dataset.pttchatPrevDisplay
      }
      if (dimensions[0] && dimensions[0].dataset.pttchatPrevDisplay !== undefined) {
        dimensions[0].style.display = dimensions[0].dataset.pttchatPrevDisplay
        delete dimensions[0].dataset.pttchatPrevDisplay
      }
      handles.each((index, handle) => {
        if (handle.dataset.pttchatPrevDisplay !== undefined) {
          handle.style.display = handle.dataset.pttchatPrevDisplay
          delete handle.dataset.pttchatPrevDisplay
        }
      })
      if (centeredBtn && centeredBtn[0]) {
        if (centeredBtn[0].dataset.pttchatPrevDisplay !== undefined) {
          centeredBtn[0].style.display = centeredBtn[0].dataset.pttchatPrevDisplay
          delete centeredBtn[0].dataset.pttchatPrevDisplay
        }
        if (cellContent.children('.centered-btn').length === 0) cellContent.prepend(centeredBtn)
        embeddedActiveCell.removeData('pttchatCenteredBtn')
      }

      cellContent.children('.pttchat-holodex-embedded-host').remove()
      cellContent.children('.cell-control').find('.pttchat-edit-layout-btn, .pttchat-back-btn, .pttchat-confirm-btn').remove()
      // restore native delete button visibility
      const nativeDeleteBtn = cellContent.children('.cell-control').find('.deep-orange').filter('.v-btn')
      if (nativeDeleteBtn[0] && nativeDeleteBtn[0].dataset.pttchatPrevDisplay !== undefined) {
        nativeDeleteBtn[0].style.display = nativeDeleteBtn[0].dataset.pttchatPrevDisplay
        delete nativeDeleteBtn[0].dataset.pttchatPrevDisplay
      }
      embeddedActiveCell = null
    }

    function destroyEmbeddedApp () {
      const ids = getEmbeddedIds()
      if (ids) {
        $(`#${ids.navbarId} button[data-bs-toggle="tab"]`).off('click.pttchat-holodex-embedded')
      }
      if (embeddedFrameSyncTimer) {
        clearInterval(embeddedFrameSyncTimer)
        embeddedFrameSyncTimer = null
      }
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (layoutObserver) {
        layoutObserver.disconnect()
        layoutObserver = null
      }
      if (embeddedAppHandle) {
        embeddedAppHandle.unmount()
        embeddedAppHandle = null
      }
      hideEmbeddedPttFrame()
      restoreEmbeddedCellHost()
    }

    function prepareEmbeddedCellHost (cell) {
      const sheet = cell.find('.mv-cell.v-sheet').eq(0)
      const cellContent = sheet.children('.cell-content').eq(0)
      if (sheet.length === 0 || cellContent.length === 0) return null

      const contentElement = cellContent[0]
      const centeredBtn = cellContent.children('.centered-btn').eq(0)
      const cellControl = cellContent.children('.cell-control').eq(0)
      const dimensions = sheet.children('.dimensions').eq(0)
      const handles = cell.children('.vue-resizable-handle')

      if (contentElement.dataset.pttchatPrevStyle === undefined) contentElement.dataset.pttchatPrevStyle = contentElement.getAttribute('style') || ''
      if (sheet[0] && sheet[0].dataset.pttchatPrevClassName === undefined) sheet[0].dataset.pttchatPrevClassName = sheet[0].className
      if (contentElement.dataset.pttchatPrevClassName === undefined) contentElement.dataset.pttchatPrevClassName = contentElement.className
      if (cellControl[0] && cellControl[0].dataset.pttchatPrevClassName === undefined) cellControl[0].dataset.pttchatPrevClassName = cellControl[0].className
      if (cellControl[0] && cellControl[0].dataset.pttchatPrevDisplay === undefined) cellControl[0].dataset.pttchatPrevDisplay = cellControl[0].style.display || ''
      if (dimensions[0] && dimensions[0].dataset.pttchatPrevDisplay === undefined) dimensions[0].dataset.pttchatPrevDisplay = dimensions[0].style.display || ''
      handles.each((index, handle) => {
        if (handle.dataset.pttchatPrevDisplay === undefined) handle.dataset.pttchatPrevDisplay = handle.style.display || ''
      })
      if (centeredBtn[0] && centeredBtn[0].dataset.pttchatPrevDisplay === undefined) centeredBtn[0].dataset.pttchatPrevDisplay = centeredBtn[0].style.display || ''

      contentElement.className = 'cell-content'
      contentElement.style.setProperty('padding-top', '0px', 'important')
      contentElement.style.setProperty('display', 'flex', 'important')
      contentElement.style.setProperty('flex-direction', 'column', 'important')
      contentElement.style.setProperty('height', '100%', 'important')
      contentElement.style.setProperty('min-height', '0px', 'important')
      if (cellControl[0]) cellControl[0].className = 'd-flex cell-control flex-wrap'
      if (cellControl[0]) cellControl[0].style.display = 'flex'
      if (cellControl[0] && cellControl.find('.pttchat-edit-layout-btn').length === 0) {
        const SVG_BACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true" class="v-icon__svg"><path d="M2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12M18,11H10L13.5,7.5L12.08,6.08L6.16,12L12.08,17.92L13.5,16.5L10,13H18V11Z"></path></svg>'
        const SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true" class="v-icon__svg"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"></path></svg>'
        const SVG_PENCIL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true" class="v-icon__svg" style="font-size:16px;height:16px;width:16px;"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"></path></svg>'
        const mkBtn = (extraClass, iconSvg) => `<button type="button" class="${extraClass} v-btn v-btn--has-bg theme--dark elevation-0 v-size--small"><span class="v-btn__content"><span aria-hidden="true" class="v-icon notranslate theme--dark">${iconSvg}</span></span></button>`
        const editEntry = $(`<button class="pttchat-edit-layout-btn mx-auto v-btn v-btn--is-elevated v-btn--has-bg ${getHolodexThemeClass()} v-size--x-small" type="button" title="編輯版面" style="color:${getToolbarForeground()}"><span class="v-btn__content"><span aria-hidden="true" class="v-icon notranslate mr-1 ${getHolodexThemeClass()}" style="font-size:16px;height:16px;width:16px;">${SVG_PENCIL}</span> 編輯版面 </span></button>`)
        const backBtn = $(mkBtn('pttchat-back-btn return-btn mr-auto amber darken-2', SVG_BACK)).css('display', 'none')
        const confirmBtn = $(mkBtn('pttchat-confirm-btn ml-2 px-md-8 primary', SVG_CHECK)).css('display', 'none')
        cellControl.prepend(editEntry, backBtn, confirmBtn)
        editEntry.on('click', () => setEmbeddedCellEditMode(true))
        confirmBtn.on('click', () => setEmbeddedCellEditMode(false))
        backBtn.on('click', () => setTimeout(() => destroyEmbeddedApp(), 0))
      }
      // hide native delete button by default
      const nativeDeleteBtn = cellControl.find('.deep-orange').filter('.v-btn')
      if (nativeDeleteBtn[0]) {
        if (nativeDeleteBtn[0].dataset.pttchatPrevDisplay === undefined) nativeDeleteBtn[0].dataset.pttchatPrevDisplay = nativeDeleteBtn[0].style.display || ''
        nativeDeleteBtn[0].style.display = 'none'
      }
      if (centeredBtn[0]) {
        centeredBtn.css('display', 'none')
        cell.data('pttchatCenteredBtn', centeredBtn.detach())
      }

      let host = cellContent.children('.pttchat-holodex-embedded-host').eq(0)
      if (host.length === 0) {
        host = $('<div class="pttchat-holodex-embedded-host mv-frame ma-auto mb-1 elevation-4"></div>')
        if (cellControl.length !== 0) cellControl.before(host)
        else cellContent.append(host)
      }
      host[0].style.setProperty('position', 'relative', 'important')
      host[0].style.setProperty('display', 'block', 'important')
      host[0].style.setProperty('flex-direction', 'column', 'important')
      host[0].style.setProperty('flex', '1 1 auto', 'important')
      host[0].style.setProperty('align-self', 'stretch', 'important')
      host[0].style.setProperty('min-height', '0px', 'important')
      host[0].style.setProperty('min-width', '0px', 'important')
      host[0].style.setProperty('width', '100%', 'important')
      host[0].style.setProperty('height', '100%', 'important')
      host[0].style.setProperty('overflow', 'hidden', 'important')
      return host
    }

    function setEmbeddedCellEditMode (isEditing) {
      if (!embeddedActiveCell || embeddedActiveCell.length === 0) return

      const sheet = embeddedActiveCell.find('.mv-cell.v-sheet').eq(0)
      const cellContent = sheet.children('.cell-content').eq(0)
      const cellControl = cellContent.children('.cell-control').eq(0)
      const dimensions = sheet.children('.dimensions').eq(0)
      const handles = embeddedActiveCell.children('.vue-resizable-handle')

      if (isEditing) sheet.addClass('edit-mode')
      else sheet.removeClass('edit-mode')

      if (dimensions[0]) dimensions[0].style.display = isEditing ? 'block' : 'none'
      handles.each((index, handle) => {
        handle.style.display = isEditing ? 'block' : 'none'
      })

      const editEntry = cellControl.find('.pttchat-edit-layout-btn')
      const backBtn = cellControl.find('.pttchat-back-btn')
      const confirmBtn = cellControl.find('.pttchat-confirm-btn')
      const nativeDeleteBtn = cellControl.find('.deep-orange').filter('.v-btn')
      editEntry.css('display', isEditing ? 'none' : '')
      backBtn.css('display', isEditing ? '' : 'none')
      confirmBtn.css('display', isEditing ? '' : 'none')
      nativeDeleteBtn.css('display', isEditing ? '' : 'none')
    }

    function syncEmbeddedPttFrame () {
      const ids = getEmbeddedIds()
      if (!ids) return

      const pttNav = document.getElementById(ids.pttNavId)
      if (!pttNav || !pttNav.classList.contains('active')) {
        hideEmbeddedPttFrame()
        return
      }
      configureSharedPttFrameForEmbedded(ids)
    }

    function bindEmbeddedPanelEvents () {
      const ids = getEmbeddedIds()
      if (!ids) return

      const scheduleEmbeddedPttFrameSync = () => {
        syncEmbeddedPttFrame()
        setTimeout(syncEmbeddedPttFrame, 50)
        setTimeout(syncEmbeddedPttFrame, 150)
        setTimeout(syncEmbeddedPttFrame, 300)
      }

      $(`#${ids.navbarId} button[data-bs-toggle="tab"]`).off('.pttchat-holodex-embedded').on('click.pttchat-holodex-embedded shown.bs.tab.pttchat-holodex-embedded', () => {
        scheduleEmbeddedPttFrameSync()
      })
      if (!embeddedFrameSyncTimer) {
        embeddedFrameSyncTimer = window.setInterval(() => {
          if (!embeddedAppHandle) return
          syncEmbeddedPttFrame()
        }, 250)
      }
      setTimeout(scheduleEmbeddedPttFrameSync, 0)
    }

    function watchEmbeddedCell (cell) {
      if (observer) observer.disconnect()
      if (layoutObserver) layoutObserver.disconnect()

      observer = new MutationObserver((mutations) => {
        if (!embeddedActiveCell || embeddedActiveCell.length === 0 || !embeddedActiveCell[0].isConnected) {
          destroyEmbeddedApp()
          return
        }
        const foreignFrame = embeddedActiveCell.find('.mv-frame.ma-auto').not('.pttchat-holodex-embedded-host')
        if (foreignFrame.length !== 0) {
          destroyEmbeddedApp()
        }
      })
      observer.observe(cell[0], { attributes: true, attributeOldValue: true, childList: true, subtree: true })

      const gridLayout = $('.vue-grid-layout').eq(0)
      if (gridLayout.length !== 0) {
        layoutObserver = new MutationObserver((mutations) => {
          // 偵測 Holodex 是否正常移除/新增 cell-control（editMode 觸發）
          mutations.forEach(m => {
            if (m.type !== 'childList') return
            m.removedNodes.forEach(node => {
              if (node.classList && node.classList.contains('cell-control')) {
                console.log('[PTTChat] layoutObserver: cell-control REMOVED from', m.target, '→ editMode=false triggered normally')
              }
            })
            m.addedNodes.forEach(node => {
              if (node.classList && node.classList.contains('cell-control')) {
                console.log('[PTTChat] layoutObserver: cell-control ADDED to', m.target, '→ editMode=true triggered')
              }
            })
          })
          if (!embeddedActiveCell || embeddedActiveCell.length === 0 || !embeddedActiveCell[0].isConnected) {
            destroyEmbeddedApp()
          }
        })
        layoutObserver.observe(gridLayout[0], { childList: true, subtree: true })
      }
    }

    mountEmbeddedAppToCell = function (cell) {
      if (cell.length === 0) return
      if (embeddedActiveCell && embeddedAppHandle && embeddedActiveCell[0] === cell[0]) {
        bindEmbeddedPanelEvents()
        return
      }

      destroyEmbeddedApp()
      const host = prepareEmbeddedCellHost(cell)
      if (!host) return

      embeddedActiveCell = cell

      embeddedAppHandle = InitApp([host[0]], WhiteTheme, true, messageposter, siteName, {
        instanceId: embeddedInstanceId,
        shellMode: 'embedded'
      })
      ChangeLog()
      applyHolodexPanelTheme(embeddedAppHandle.ids.rootId)
      const finalizeEmbeddedMount = () => {
        if (!embeddedAppHandle) return
        bindEmbeddedPanelEvents()
        setEmbeddedCellEditMode(false)
        syncEmbeddedPttFrame()
      }
      setTimeout(finalizeEmbeddedMount, 0)
      setTimeout(finalizeEmbeddedMount, 100)
      watchEmbeddedCell(cell)
    }

    function applyClassicSidebarLayout (width) {
      const toolbarHeight = getToolbarHeight()
      PTTChatHandler.css({
        position: 'fixed',
        top: `${toolbarHeight}px`,
        right: '0px',
        width: `${Math.max(width, 0)}px`,
        height: `${Math.max(window.innerHeight - toolbarHeight, 0)}px`,
        'max-height': `calc(100vh - ${toolbarHeight}px)`,
        'z-index': '10',
        overflow: width > 0 ? 'visible' : 'hidden',
        'pointer-events': width > 0 ? 'auto' : 'none'
      })
      applyClassicSidebarGap(width)
      applyClassicHeaderFill(width)
      syncClassicPanelHeights()
    }

    function setupYtStateFixHandler () {
      if (embeddedYtStateFixHandler) return
      embeddedYtStateFixHandler = (e) => {
        if (e.origin !== 'https://www.youtube.com') return
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
          if (!data || data.event !== 'infoDelivery' || !data.info || !('playerState' in data.info)) return
          const playerState = data.info.playerState
          if (playerState === 3) return // BUFFERING：保持目前狀態
          const s = document.querySelector('#app')?.__vue__?.$store
          if (!s) return
          // 找出送出此 postMessage 的 iframe
          const sourceIframe = [...document.querySelectorAll('.vue-grid-layout iframe')].find(f => f.contentWindow === e.source)
          if (!sourceIframe) return
          // 從 iframe src 解析 video ID
          const srcMatch = sourceIframe.src.match(/\/embed\/([^?&/]+)/)
          if (!srcMatch) return
          const videoId = srcMatch[1]
          // 從 Vuex 找出對應的 cell ID
          const lc = s.state.multiview.layoutContent
          const cellId = Object.keys(lc).find(k => lc[k]?.id === videoId || lc[k]?.video?.id === videoId)
          if (!cellId) return
          const isPlaying = playerState === 1
          const curEditMode = lc[cellId]?.editMode ?? true
          if (isPlaying && curEditMode !== false) {
            s.commit('multiview/setLayoutContentWithKey', { id: cellId, key: 'editMode', value: false })
            s.commit('multiview/freezeLayoutItem', cellId)
          } else if (!isPlaying && curEditMode !== true) {
            s.commit('multiview/setLayoutContentWithKey', { id: cellId, key: 'editMode', value: true })
            s.commit('multiview/unfreezeLayoutItem', cellId)
          }
        } catch {}
      }
      window.addEventListener('message', embeddedYtStateFixHandler)
    }

    function teardownYtStateFixHandler () {
      if (!embeddedYtStateFixHandler) return
      window.removeEventListener('message', embeddedYtStateFixHandler)
      embeddedYtStateFixHandler = null
    }

    function ensureClassicLayout () {
      if (fakeparent.parent().length !== 0) {
        parent.append(defaultVideo)
        fakeparent.remove()
      }
      PTTChatHandler.css('display', 'flex')
      if (PTTChatHandler.parent()[0] !== document.body) $('body').append(PTTChatHandler)
      applyClassicSidebarLayout(nowWidth)
    }

    function ensureEmbeddedLayout () {
      destroyClassicApp()
      if (fakeparent.parent().length === 0) {
        parent.append(fakeparent)
        fakeparent.append(defaultVideoHandler)
        defaultVideoHandler.append(defaultVideo)
      }
      PTTChatHandler.css({
        display: 'flex',
        position: 'relative',
        top: '',
        right: '',
        width: '',
        height: '',
        'max-height': '',
        'z-index': '5',
        overflow: '',
        'pointer-events': 'auto',
        flex: '0 0 0px'
      })
      applyClassicSidebarGap(0)
      applyClassicHeaderFill(0)
      if (PTTChatHandler.parent()[0] !== fakeparent[0]) fakeparent.append(PTTChatHandler)
      setupYtStateFixHandler()
    }

    if (useEmbeddedMode) {
      ensureEmbeddedLayout()
      iconPTT.css('display', 'none')
    } else {
      ensureClassicLayout()
    }
    syncClassicToolbarTheme()

    let collapseStart = false
    let collapseEnd = true
    iconPTT.on('click', () => {
      gaUseExtensionEvent()
      if (GM_getValue('PluginTypeHolodex', '1') === '1') {
        if (collapseEnd || !collapseStart) {
          if (nowWidth === 0) {
            collapseAction(document.getElementById('PTTMain'), 'show')
            nowWidth = pluginWidth
          } else {
            collapseAction(document.getElementById('PTTMain'), 'hide')
            nowWidth = 0
          }
          applyClassicSidebarLayout(nowWidth)
        }
      }
      if (reportMode) console.log('hide PTT')
    })

    iconSwitch.on('click', () => {
      if (confirm(`切換為${GM_getValue('PluginTypeHolodex', '1') === '0' ? '舊' : '新'}版PTT顯示模式？`)) {
        if (GM_getValue('PluginTypeHolodex', '1') === '0') {
          clearInterval(mainTimer)
          if (observer) observer.disconnect()
          $('[name="ptt-boot-btn"]').remove()
          iconPTT.css('display', 'block')
          GM_setValue('PluginTypeHolodex', '1')
          nowWidth = 0
          ensureClassicLayout()
        } else {
          iconPTT.css('display', 'none')
          nowWidth = 0
          applyClassicSidebarLayout(nowWidth)
          GM_setValue('PluginTypeHolodex', '0')
          ensureEmbeddedLayout()
          mainTimer = window.setInterval(() => {
            console.log(new Date())
            appendPttEmbedBtn()
          }, 1000)
        }
        initPttChatStyle()
        if (reportMode) console.log('display mode changed')
      }
    })

    function initPttChatStyle () {
      switch (GM_getValue('PluginTypeHolodex', '1')) {
        case '0':
          ensureEmbeddedLayout()
          hideEmbeddedPttFrame()
          break
        case '1':
          ensureClassicLayout()
          destroyEmbeddedApp()
          $('[name="ptt-boot-btn"]').remove()
          ensureClassicApp()
          $('#PTTChat-contents').css('height', `${GM_getValue('PluginHeight', 400)}`)
          $('#PTTChat-app').height('')
          $('#PTTChat').addClass('w-100').attr('style', '')
          applyHolodexPanelTheme()
          configureSharedPttFrameForClassic()
          listenPttFrameBtn()
          break
      }
      const mainPanel = document.getElementById('PTTMain')
      if (mainPanel) collapseAction(mainPanel, 'hide')
    }

    if (!useEmbeddedMode && $('#PTTChat').length === 0) {
      ensureClassicApp()
      if (reportMode) console.log('create PTTChat instance in holodex')
    }
    const pttFrame = $('#ptt-frame-parent').length !== 0
      ? $('#ptt-frame-parent').eq(0)
      : $('<div id="ptt-frame-parent" style="position: absolute; z-index: 5000; pointer-events: auto;"><iframe id="PTTframe" src="//term.ptt.cc/?url=https://holodex.net" style="display:none;">你的瀏覽器不支援iframe</iframe></div>')
    pttFrame.css({ 'z-index': '5000', 'pointer-events': 'auto' })
    if (pttFrame.parent().length === 0) {
      if (useEmbeddedMode) $('body').append(pttFrame)
      else $(getOrCreateParkingLot()).append(pttFrame)
    }
    if (useEmbeddedMode) hideEmbeddedPttFrame()
    if (!useEmbeddedMode) configureSharedPttFrameForClassic()
    syncPttTargetWindow()
    setTimeout(syncPttTargetWindow, 100)
    setTimeout(syncPttTargetWindow, 500)
    initPttChatStyle()
    $('#PTTChat-navbar button[data-bs-toggle="tab"]').off('click.pttchat-holodex-height').on('click.pttchat-holodex-height', () => {
      setTimeout(() => {
        syncClassicPanelHeights()
        syncPttTargetWindow()
      }, 50)
    })
    if (!useEmbeddedMode) listenPttFrameBtn()

    let mainTimer = GM_getValue('PluginTypeHolodex', '1') === '0'
      ? setInterval(appendPttEmbedBtn, 1000)
      : undefined
    const mainPanel = document.getElementById('PTTMain')
    if (mainPanel) {
      mainPanel.addEventListener('show.bs.collapse', () => { collapseStart = true; collapseEnd = false })
      mainPanel.addEventListener('hide.bs.collapse', () => { collapseStart = true; collapseEnd = false })
      mainPanel.addEventListener('shown.bs.collapse', () => { collapseStart = false; collapseEnd = true })
      mainPanel.addEventListener('hidden.bs.collapse', () => { collapseStart = false; collapseEnd = true })
    }
    if (!classicSidebarResizeHandler) {
      classicSidebarResizeHandler = () => {
        if (GM_getValue('PluginTypeHolodex', '1') === '1') applyClassicSidebarLayout(nowWidth)
      }
      window.addEventListener('resize', classicSidebarResizeHandler, true)
    }
    if (!classicThemeObserver) {
      classicThemeObserver = new MutationObserver(() => {
        syncClassicToolbarTheme()
      })
      const toolbar = getToolbarElement()
      if (toolbar) classicThemeObserver.observe(toolbar, { attributes: true, attributeFilter: ['class', 'style'] })
      classicThemeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] })
      classicThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    }
    activeHolodexCleanup = () => {
      clearInterval(mainTimer)
      mainTimer = undefined
      teardownYtStateFixHandler()
      destroyEmbeddedApp()
      destroyClassicApp()
      if (classicThemeObserver) {
        classicThemeObserver.disconnect()
        classicThemeObserver = null
      }
      if (classicSidebarResizeHandler) {
        window.removeEventListener('resize', classicSidebarResizeHandler, true)
        classicSidebarResizeHandler = null
      }
      applyClassicSidebarGap(0)
      applyClassicHeaderFill(0)
      const mainPanel = document.getElementById('PTTMain')
      if (mainPanel) collapseAction(mainPanel, 'hide')
      const clearStyle = (selector, properties) => {
        const element = document.querySelector(selector)
        if (!element) return
        properties.forEach(property => element.style.removeProperty(property))
      }
      clearStyle('#PTTChat', ['height', 'max-height'])
      clearStyle('#PTTMain', ['height', 'max-height', 'overflow'])
      clearStyle('#PTTChat-app', ['height', 'max-height', 'overflow'])
      clearStyle('#PTTChat-contents', ['height', 'max-height', 'min-height'])
      if (PTTChatHandler[0]) PTTChatHandler[0].style.removeProperty('height')
      messageposter.targetWindow = null
      const parkingLot = getOrCreateParkingLot()
      if ($('#PTTChat').length !== 0) $('#PTTChat').appendTo(parkingLot).css('display', 'none')
      parkSharedPttFrame()
      $('#PTTChat-navbar button[data-bs-toggle="tab"]').off('click.pttchat-holodex-height')
      PTTChatHandler.remove()
      if (fakeparent.parent().length !== 0) {
        if (defaultVideo.parent()[0] === defaultVideoHandler[0]) parent.append(defaultVideo)
        fakeparent.remove()
      }
      iconPTT.remove()
      iconSwitch.remove()
      activeHolodexCleanup = null
    }
    recentWatch = true
    if (reportMode) console.log('main initialize done')
  }

  function appendPttEmbedBtn () {
    const btnParentSet = $('.centered-btn')
    btnParentSet.each(index => {
      const btnParent = btnParentSet.eq(index)
      if (btnParent.find($('[name="ptt-boot-btn"]')).length !== 0) return
      const btn = btnParent.children().eq(0).clone()
      console.log(btn, [btn])
      btn.attr({ name: 'ptt-boot-btn', style: 'background-color:rgb(130, 30, 150)!important;margin-top:8px;width:190px;' }).appendTo(btnParent)
      btn[0].classList.add('openpttchat')
      btn.id = 'HDNewMode'
      btn.find($('.v-btn__content')).eq(0).text('P').css('font-size', '20px')
      btn.on('click', () => {
        gaUseExtensionEvent()
        const cell = btn.closest('.vue-grid-item')
        mountEmbeddedAppToCell(cell)
        if (reportMode) console.log('embedded PTT mounted to cell')
      })
    })
  }

  function listenPttFrameBtn () {
    $('#nav-item-PTT').off('click').on('click', () => {
      setTimeout(repositionFrame, 100)

      // get position recursively
      function repositionFrame () {
        let el = $('#PTTMainBtn')[0]
        let x = 0
        let y = 0
        while (el && el.className !== 'v-main__wrap') {
          x += el.offsetLeft - el.scrollLeft + el.clientLeft
          y += el.offsetTop - el.scrollLeft + el.clientTop
          // console.log(el)
          el = el.offsetParent
        }
        y = y + $('#PTTChat-navbar').height() - document.querySelector('.v-main__wrap .v-toolbar__content').offsetHeight
        const height = $('#PTTChat-app').height() - $('#PTTChat-navbar').height()
        const width = $('#PTTChat').width()
        $('#ptt-frame-parent').css('margin', `${y}px 0px 0px ${x}px`)
        $('#PTTframe').css({ height: `${height}px`, width: `${width}px` })

        // 轉場動畫 50ms
        if ($('#PTTChat-contents-PTT').width() === 0) $('#PTTframe').css({ border: 'none', display: 'none' })
        else $('#PTTframe').css({ border: 'revert', display: 'block' })

        if ($('#nav-item-PTT').hasClass('active')) setTimeout(repositionFrame, 10)
        else $('#PTTframe').css({ border: 'none', display: 'none' })
      }
    })
  }
}
