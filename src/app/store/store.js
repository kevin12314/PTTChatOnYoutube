import { state, mutations } from './mutations'
import { getters } from './getters'
import { actions } from './actions'
import { createStore } from 'vuex'

export const store = createStore({
  state,
  mutations,
  getters,
  actions,

  // 嚴格模式，禁止直接修改 state
  strict: true
})
