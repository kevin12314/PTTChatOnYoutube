const fs = require('fs')
const assert = require('assert')
const vm = require('vm')

const source = fs.readFileSync('src/SupportWebsite/eplus/eplusLayout.js', 'utf8')
const script = source
  .replace(/export function /g, 'function ')
  .replace(/export const /g, 'const ') +
  '\nmodule.exports = { isEplusPlayerPage, findEplusChatContainer, createEplusTabbedHost }'

function createElement (tagName) {
  const element = {
    tagName: tagName.toUpperCase(),
    id: '',
    className: '',
    children: [],
    parentElement: null,
    style: {},
    dataset: {},
    textContent: '',
    appendChild (child) {
      if (child.parentElement) child.parentElement.removeChild(child)
      child.parentElement = this
      this.children.push(child)
      return child
    },
    insertBefore (child, before) {
      if (child.parentElement) child.parentElement.removeChild(child)
      child.parentElement = this
      const index = this.children.indexOf(before)
      if (index === -1) this.children.push(child)
      else this.children.splice(index, 0, child)
      return child
    },
    removeChild (child) {
      const index = this.children.indexOf(child)
      if (index !== -1) this.children.splice(index, 1)
      child.parentElement = null
      return child
    },
    setAttribute (name, value) {
      this[name] = value
    },
    addEventListener () {}
  }
  element.classList = {
    add (...names) {
      const current = element.className ? element.className.split(/\s+/) : []
      names.forEach(name => {
        if (!current.includes(name)) current.push(name)
      })
      element.className = current.join(' ')
    },
    remove (...names) {
      element.className = (element.className || '')
        .split(/\s+/)
        .filter(name => name && !names.includes(name))
        .join(' ')
    }
  }
  return element
}

const sandbox = { module: { exports: {} } }
vm.runInNewContext(script, sandbox)
const { isEplusPlayerPage, findEplusChatContainer, createEplusTabbedHost } = sandbox.module.exports

assert.strictEqual(isEplusPlayerPage({ hostname: 'live.eplus.jp', pathname: '/ex/player' }), true)
assert.strictEqual(isEplusPlayerPage({ hostname: 'eplus.jp', pathname: '/ex/player' }), false)

const vimeoChat = createElement('div')
vimeoChat.id = 'vimeoChat'
const iframe = createElement('iframe')
iframe.id = 'iframChat'
iframe.className = 'iframe-s-chat'
vimeoChat.appendChild(iframe)

const documentWithContainer = {
  createElement,
  getElementById (id) {
    return id === 'vimeoChat' ? vimeoChat : null
  },
  querySelector () {
    return iframe
  }
}

assert.strictEqual(findEplusChatContainer(documentWithContainer), vimeoChat)

const host = createEplusTabbedHost(documentWithContainer, vimeoChat)
assert.strictEqual(host.pttMount.id, 'PTTChatEplusMount')
assert.strictEqual(iframe.parentElement, vimeoChat)
assert.strictEqual(vimeoChat.children[0], iframe)
assert.strictEqual(vimeoChat.children[1].id, 'PTTChatEplusTabs')
assert.strictEqual(host.tabBar.style.position, 'absolute')
assert.strictEqual(host.tabBar.children[0].style.background, '#e55398')
assert.strictEqual(host.tabBar.children[0].style.borderColor, '#e55398')

const fallbackContainer = createElement('div')
const fallbackIframe = createElement('iframe')
fallbackIframe.className = 'iframe-s-chat'
fallbackContainer.appendChild(fallbackIframe)

const documentWithoutContainer = {
  createElement,
  getElementById () {
    return null
  },
  querySelector () {
    return fallbackIframe
  }
}

assert.strictEqual(findEplusChatContainer(documentWithoutContainer), fallbackContainer)

console.log('eplusLayout checks passed')
