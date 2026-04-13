import Collapse from 'bootstrap/js/dist/collapse'
import Modal from 'bootstrap/js/dist/modal'
import Tab from 'bootstrap/js/dist/tab'

export function collapseAction (element, action) {
  if (!element) return null

  const instance = Collapse.getOrCreateInstance(element)
  if (action === 'show') instance.show()
  else if (action === 'hide') instance.hide()
  else instance.toggle()
  return instance
}

export function showModal (element, options) {
  if (!element) return null

  const instance = Modal.getOrCreateInstance(element, options)
  instance.show()
  return instance
}

export function showTab (element) {
  if (!element) return null

  const instance = Tab.getOrCreateInstance(element)
  instance.show()
  return instance
}
