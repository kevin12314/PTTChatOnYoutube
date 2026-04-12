import InsFilter from 'src/filter/InsFilter'
import InitLOLEsports from './InitLOLEsports'

const LOLeSportFilter = InsFilter('Twitch', /www\.twitch\.tv/, 'https://www.twitch.tv/', InitLOLEsports)
export default LOLeSportFilter
