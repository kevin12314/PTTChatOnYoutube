export function isEplusPlayerPage (locationLike) {
  const currentLocation = locationLike || window.location
  return /(^|\.)live\.eplus\.jp$/.test(currentLocation.hostname || '') &&
    /^\/ex\/player\/?$/.test(currentLocation.pathname || '')
}

export function findEplusChatContainer (documentLike) {
  const currentDocument = documentLike || document
  const chatContainer = currentDocument.getElementById('vimeoChat')
  if (chatContainer) return chatContainer

  const chatFrame = currentDocument.querySelector('#iframChat, .iframe-s-chat')
  return chatFrame && chatFrame.parentElement ? chatFrame.parentElement : null
}

const STREAMING_PLUS_PRIMARY_COLOR = '#e55398'

function setButtonActive (button, isActive) {
  button.style.background = isActive ? STREAMING_PLUS_PRIMARY_COLOR : '#ffffff'
  button.style.color = isActive ? '#ffffff' : '#333333'
  button.style.borderColor = isActive ? STREAMING_PLUS_PRIMARY_COLOR : '#cccccc'
}

function createTabButton (documentLike, text) {
  const button = documentLike.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.style.flex = '1 1 0'
  button.style.height = '32px'
  button.style.border = '1px solid #cccccc'
  button.style.borderRadius = '4px'
  button.style.fontSize = '13px'
  button.style.fontWeight = '600'
  button.style.cursor = 'pointer'
  return button
}

function getNativeChildren (chatContainer, root) {
  return Array.from(chatContainer.children).filter(child => child !== root)
}

function setNativeChildrenVisible (chatContainer, root, isVisible) {
  getNativeChildren(chatContainer, root).forEach(child => {
    if (child.dataset.pttchatEplusPrevDisplay === undefined) {
      child.dataset.pttchatEplusPrevDisplay = child.style.display || ''
    }
    child.style.display = isVisible ? child.dataset.pttchatEplusPrevDisplay : 'none'
  })
}

export function createEplusTabbedHost (documentLike, chatContainer) {
  const existingTabs = documentLike.getElementById('PTTChatEplusTabs')
  if (existingTabs) {
    return {
      root: existingTabs,
      eplusPane: documentLike.getElementById('PTTChatEplusNativePane'),
      pttPane: documentLike.getElementById('PTTChatEplusPttPane'),
      pttMount: documentLike.getElementById('PTTChatEplusMount')
    }
  }

  const root = documentLike.createElement('div')
  root.id = 'PTTChatEplusTabs'
  root.className = 'pttchat-eplus-tabs'
  root.style.width = '100%'
  root.style.position = 'absolute'
  root.style.top = '0'
  root.style.left = '0'
  root.style.right = '0'
  root.style.bottom = '0'
  root.style.zIndex = '20'
  root.style.pointerEvents = 'none'

  if (!chatContainer.style.position) chatContainer.style.position = 'relative'

  const tabBar = documentLike.createElement('div')
  tabBar.id = 'PTTChatEplusTabBar'
  tabBar.style.position = 'absolute'
  tabBar.style.top = '0'
  tabBar.style.left = '0'
  tabBar.style.right = '0'
  tabBar.style.display = 'flex'
  tabBar.style.gap = '8px'
  tabBar.style.padding = '8px 12px'
  tabBar.style.borderTop = '1px solid #dddddd'
  tabBar.style.borderBottom = '1px solid #dddddd'
  tabBar.style.background = '#ffffff'
  tabBar.style.pointerEvents = 'auto'

  const eplusButton = createTabButton(documentLike, 'eplus')
  eplusButton.id = 'PTTChatEplusNativeTab'
  const pttButton = createTabButton(documentLike, 'PTT')
  pttButton.id = 'PTTChatEplusPttTab'

  const pttPane = documentLike.createElement('div')
  pttPane.id = 'PTTChatEplusPttPane'
  pttPane.style.position = 'absolute'
  pttPane.style.top = '49px'
  pttPane.style.left = '0'
  pttPane.style.right = '0'
  pttPane.style.bottom = '0'
  pttPane.style.width = '100%'
  pttPane.style.background = '#ffffff'
  pttPane.style.pointerEvents = 'auto'
  pttPane.style.display = 'none'

  const pttMount = documentLike.createElement('div')
  pttMount.id = 'PTTChatEplusMount'
  pttMount.style.width = '100%'
  pttMount.style.height = '100%'
  pttMount.style.minHeight = '360px'

  pttPane.appendChild(pttMount)
  tabBar.appendChild(eplusButton)
  tabBar.appendChild(pttButton)
  root.appendChild(tabBar)
  root.appendChild(pttPane)
  chatContainer.appendChild(root)

  function activate (tabName) {
    const isPtt = tabName === 'ptt'
    setNativeChildrenVisible(chatContainer, root, !isPtt)
    pttPane.style.display = isPtt ? 'block' : 'none'
    setButtonActive(eplusButton, !isPtt)
    setButtonActive(pttButton, isPtt)
  }

  eplusButton.addEventListener('click', () => activate('eplus'))
  pttButton.addEventListener('click', () => activate('ptt'))
  activate('eplus')

  return { root, eplusPane: chatContainer, pttPane, pttMount, tabBar }
}
