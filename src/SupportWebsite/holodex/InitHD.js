
import { InitApp } from '../../app/appindex.js'
import { ChangeLog } from '../../ChangeLog.js'
import { ThemeCheck } from '../../library.js'

export function InitHD (messageposter) {
  // Check Theme
  const WhiteTheme = ThemeCheck('html', '250, 250, 250')

  // run app instance loop
  const watchcheck = /https:\/\/holodex\.net\/multiview/.exec(window.location.href)
  if (watchcheck) {
    setInterval(() => {
      const btnParentSet = $('.px-0.d-flex.flex-grow-1.align-stretch.mb-1')
      if ($('#pttBootBtn').length === 0 && btnParentSet.length > 0 && $('#PTTChat').length === 0) {
        const btnParent = btnParentSet.eq(0)
        btnParent.css('flex-direction', 'column')
        btnParent.children().eq(1).clone().attr('id', 'pttBootBtn').appendTo(btnParent).attr('style', 'background-color: crimson !important').css({ 'margin-top': '15px', 'flex-basis': '100%', padding: '6px 0px', 'max-width': '608px' })
        btnParent.children().eq(2).find('path').attr('d', 'M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z')
        btnParent.prepend($('<div class="d-flex"></div>').prepend(btnParent.children().eq(0), btnParent.children().eq(1)))
        const gridIndex = btnParent.parents().eq(3).index()
        $('#pttBootBtn').on('click', function () {
          btnParent.children().eq(0).children().eq(1).trigger('click')
          installPTT(gridIndex)
        })
      }
    }, 1000)
  }
  function installPTT (gridIndex) {
    const t = setInterval(() => {
      if ($('#PTTChat').length === 0) {
        const gridParent = $('.vue-grid-layout').children().eq(gridIndex)
        if (gridParent.has($('.cell-content'))) {
          gridParent.children().children().css('position', 'relative').prepend($('<div style="height: 100%; width: 100%; position: absolute;"></div>'))
          InitApp(gridParent.children().children().eq(0).children().eq(0), WhiteTheme, true, messageposter, true)
          ChangeLog()
          const chatBtn = gridParent.find($('span:contains("Chat")')).parent()
          $('#PTTChat').addClass('h-100').css('background', 'transparent')
          $('#PTTMain').addClass('h-100').removeClass('position-absolute')
          $('#PTTChat-app').addClass('h-100')
          $('#PTTChat-contents').css('height', '')
          if (chatBtn.css('background-color') !== 'rgb(39, 39, 39)') {
            chatBtn.trigger('click')
          }
          $('#PTTMainBtn').on('click', function () {
            const originChat = gridParent.children().children().eq(0).children().eq(1)
            // const h = $('#PTTChat').height()
            if (originChat.css('z-index') === '-1') {
              // $('#PTTMain').removeClass('h-100').css('max-height', h + 'px')
              // $('#PTTChat-app').removeClass('h-100').css('max-height', h + 'px')
              originChat.css('z-index', '0')
            } else {
              // $('#PTTMain').css('max-height', h + 'px')
              // $('#PTTChat-app').css('max-height', h + 'px')
              // $('#PTTMain').on('shown.bs.collapse', function () {
              //   $('#PTTMain').addClass('h-100')
              //   $('#PTTChat-app').addClass('h-100')
              // })
              originChat.css('z-index', '-1')
            }
          })
          listenEditBtn(gridParent)
          $('#PTTMainBtn').trigger('click')
          clearInterval(t)
        }
      }
    }, 200)
  }
  function listenEditBtn (gridParent) {
    const t = setInterval(() => {
      const editBtn = gridParent.find($('path[d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"]')).parents().eq(3)
      if (editBtn) {
        editBtn.on('click', function () {
          const cellContent = gridParent.children().children().eq(0)
          const px = cellContent.css('padding-left')
          const pt = cellContent.css('padding-top')
          const pb = cellContent.css('padding-bottom')
          cellContent.children().eq(0).css({ height: `calc(100% - ${pt} - ${pb})`, width: `calc(100% - ${px} - ${px})` })
          listenCtrlBtn(gridParent)
        })
        clearInterval(t)
      }
    }, 200)
  }
  function listenCtrlBtn (gridParent) {
    const t = setInterval(() => {
      const btnParent = gridParent.find($('.cell-control')).children()
      if (btnParent) {
        btnParent.children().eq(0).attr({ disabled: 'true', title: '鎖定：PTT運行中' })
        btnParent.children().eq(1).on('click', function () {
          gridParent.children().children().eq(0).children().eq(0).css({ height: '100%', width: '100%' })
          listenEditBtn(gridParent)
        })
        clearInterval(t)
      }
    }, 200)
  }
}
