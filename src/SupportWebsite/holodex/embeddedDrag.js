export function bindEmbeddedDrag (cell) {
  // The grid item owns the layout ID; nested v-sheet instances may wrap it.
  let grid = cell && cell.__vue__
  while (grid) {
    const store = grid.$store
    const item = store?.state?.multiview?.layout?.find(item => item.i === grid.i)
    if (item) {
      const previous = ['isDraggable', 'isResizable'].map(key => ({
        key, present: Object.prototype.hasOwnProperty.call(item, key), value: item[key]
      }))
      return {
        setEditing (editing) {
          if (!store.state.multiview.layout.includes(item)) return
          store.commit(editing ? 'multiview/unfreezeLayoutItem' : 'multiview/freezeLayoutItem', item.i)
        },
        restore () {
          if (!store.state.multiview.layout.includes(item)) return
          previous.forEach(({ key, present, value }) => {
            if (present) grid.$set(item, key, value)
            else grid.$delete(item, key)
          })
        }
      }
    }
    grid = grid.$parent
  }
  return null
}
