import $ from 'jquery'
import 'bootstrap/js/dist/dropdown'
import 'bootstrap/js/dist/collapse'
import 'bootstrap/js/dist/modal'
import 'bootstrap/js/dist/tab'
import { MessagePoster } from './MessagePoster'
import HerfFilter from './filter/HerfFilter'
import ytfilter from './SupportWebsite/youtube/ytfilter'
import htfilter from './SupportWebsite/holotools/htfilter'
import blankfilter from './SupportWebsite/blank/blankfilter'
import twitchfilter from './SupportWebsite/twitch/twitchfilter'
import nijimadofilter from './SupportWebsite/nijimado/nijimadofilter'
// import { lineTVfilter } from './SupportWebsite/lineTV/lineTVfilter'
import hdfilter from './SupportWebsite/holodex/hdfilter'
import './scss/index.scss'

if (typeof window !== 'undefined') {
  window.$ = $
  window.jQuery = $
}

(function () {
  const msg = new MessagePoster()
  const filters = []
  filters.push(ytfilter)
  filters.push(htfilter)
  filters.push(blankfilter)
  filters.push(twitchfilter)
  filters.push(nijimadofilter)
  // filters.push(lineTVfilter);
  filters.push(hdfilter)
  HerfFilter(msg, filters)
})()
