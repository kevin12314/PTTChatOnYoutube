import InitApp from 'src/app/appindex'
import { collapseAction } from 'src/bootstrap'
import { ThemeCheck } from 'src/library'
import gaUseExtensionEvent from 'src/ga/useExtensionEvent'

export default function InitHD (messageposter, siteName) {
  // Check Theme
  const WhiteTheme = ThemeCheck('html', '250, 250, 250')

  let recentWatch = false
  let repositionTimer
  let observer
  let layoutObserver
  let classicSidebarResizeHandler
  let classicHeaderFill
  let classicThemeObserver
  let activeHolodexCleanup

  setInterval(() => {
    const url = /https:\/\/holodex\.net\/multiview/.exec(window.location.href)
    if (!url) {
      if (recentWatch && typeof activeHolodexCleanup === 'function') activeHolodexCleanup()
      recentWatch = false
    } else if (!recentWatch) initHolodex()
  }, 1000)

  function initHolodex () {
    if (typeof activeHolodexCleanup === 'function') activeHolodexCleanup()

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

    function applyHolodexPanelTheme () {
      const panelBackground = getHolodexPanelBackground()
      const foreground = getToolbarForeground()
      const setImportantStyle = (selector, property, value) => {
        const element = document.querySelector(selector)
        if (!element) return
        element.style.setProperty(property, value, 'important')
      }

      setImportantStyle('#PTTChat', 'background-color', panelBackground)
      setImportantStyle('#PTTChat', 'color', foreground)
      setImportantStyle('#PTTChat', '--bs-body-bg', panelBackground)
      setImportantStyle('#PTTChat', '--bs-modal-bg', panelBackground)
      setImportantStyle('#PTTChat', '--bs-dark-bg-subtle', panelBackground)
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
      applyClassicHeaderFill(nowWidth)
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
        overflow: 'visible',
        'pointer-events': width > 0 ? 'auto' : 'none'
      })
      applyClassicSidebarGap(width)
      applyClassicHeaderFill(width)
      syncClassicPanelHeights()
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
          if ($('.vue-grid-layout #PTTChat').length === 0) $('#PTTChat').appendTo($('.vue-grid-layout')).css('display', 'none')
          break
        case '1':
          ensureClassicLayout()
          if ($('#pttchatparent #PTTChat').length === 0) $('#PTTChat').appendTo(PTTChatHandler)
          $('#PTTChat-contents').css('height', `${GM_getValue('PluginHeight', 400)}`)
          $('#PTTChat-app').height('')
          $('#PTTChat').addClass('w-100').attr('style', '')
          applyHolodexPanelTheme()
          break
      }
      collapseAction(document.getElementById('PTTMain'), 'hide')
    }

    if ($('#PTTChat').length === 0) {
      InitApp($('#pttchatparent'), WhiteTheme, true, messageposter, siteName, true)
      if (reportMode) console.log('create PTTChat instance in holodex')
    }
    const pttFrame = $('#ptt-frame-parent').length !== 0
      ? $('#ptt-frame-parent').eq(0)
      : $('<div id="ptt-frame-parent" style="position: absolute; z-index: 5000; pointer-events: auto;"><iframe id="PTTframe" src="//term.ptt.cc/?url=https://holodex.net" style="display:none;">你的瀏覽器不支援iframe</iframe></div>')
    pttFrame.css({ 'z-index': '5000', 'pointer-events': 'auto' })
    $('.vue-grid-layout').append(pttFrame.css('display', ''))
    syncPttTargetWindow()
    setTimeout(syncPttTargetWindow, 100)
    setTimeout(syncPttTargetWindow, 500)
    listenPttFrameBtn()
    initPttChatStyle()
    $('#PTTChat-navbar button[data-bs-toggle="tab"]').off('click.pttchat-holodex-height').on('click.pttchat-holodex-height', () => {
      setTimeout(() => {
        syncClassicPanelHeights()
        syncPttTargetWindow()
      }, 50)
    })

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
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (layoutObserver) {
        layoutObserver.disconnect()
        layoutObserver = null
      }
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
      collapseAction(document.getElementById('PTTMain'), 'hide')
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
      if ($('#ptt-frame-parent').length !== 0) $('#ptt-frame-parent').appendTo(parkingLot).css('display', 'none')
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
        const gridIndex = btn.parents().eq(3).index()
        btnParent.children().eq(1).children().eq(1).trigger('click')
        appendPtt2Cell(gridIndex)
        if (reportMode) console.log(`grid-#${gridIndex}-boot-button clicked`)
      })
    })
  }

  function appendPtt2Cell (gridIndex) {
    if ($('.vue-grid-layout #PTTChat').length === 0) $('#PTTChat').appendTo($('.vue-grid-layout')).css('display', 'none')
    const cell = $('.vue-grid-item').eq(gridIndex)
    const config = { attributes: true }
    if (observer) observer.disconnect()
    observer = new MutationObserver(() => {
      if (repositionTimer) clearTimeout(repositionTimer)
      repositionTimer = setTimeout(repositionPttChat, 10, cell)
    })
    observer.observe(cell[0], config)
    checkFilledWithVideo(cell)
  }

  /** @param {JQuery} parentCell */
  function repositionPttChat (parentCell) {
    const sheet = parentCell.find($('.mv-cell.v-sheet')).eq(0)
    const editMode = sheet.hasClass('edit-mode')
    const height = sheet.height()
    const width = sheet.width()

    let el = sheet[0]
    let x = 0
    let y = 0
    while (el.className !== 'vue-grid-layout') {
      x += el.offsetLeft - el.scrollLeft + el.clientLeft
      y += el.offsetTop - el.scrollLeft + el.clientTop
      el = el.offsetParent
    }

    $('#PTTChat-contents').height('')
    if (editMode) {
      $('#PTTChat').attr('style', `z-index: 5; margin: ${y + 20}px 0px 0px ${x + 20}px; width: ${width}px !important;`)
      $('#PTTChat-app').height(height - 68)
    } else {
      $('#PTTChat').attr('style', `z-index: 5; margin: ${y}px 0px 0px ${x}px; width: ${width}px !important;`)
      $('#PTTChat-app').height(height - 24)
    }
    $('#PTTChat').removeClass('w-100').css('display', 'block')
    collapseAction(document.getElementById('PTTMain'), 'show')
    checkCellRemoved(parentCell[0])
  }

  function checkCellRemoved (observeredNode) {
    if ($('.vue-grid-layout').length === 0) setTimeout(checkCellRemoved, 10, observeredNode)
    else {
      if (layoutObserver) layoutObserver.disconnect()
      layoutObserver = new MutationObserver(mutations => {
        mutations.forEach(el => {
          el.removedNodes.forEach(e => {
            if (e === observeredNode) hidePttChatInGrid()
          })
        })
      })
      const config = { childList: true }
      layoutObserver.observe($('.vue-grid-layout')[0], config)
    }
  }

  function hidePttChatInGrid () {
    if ($('.vue-grid-layout #PTTChat').length !== 0) {
      $('#PTTChat').css('display', 'none')
      collapseAction(document.getElementById('PTTMain'), 'hide')
    }
    if (observer) observer.disconnect()
    if (reportMode) console.log('hide PTTChat')
  }

  function checkFilledWithVideo (cell) {
    if (cell.find($('.mv-frame.ma-auto')).length === 0) setTimeout(checkFilledWithVideo, 1000, cell)
    else {
      if (reportMode) console.log('cell fill with video, remove PTTChat')
      hidePttChatInGrid()
    }
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
