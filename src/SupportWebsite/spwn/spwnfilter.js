import InsFilter from 'src/filter/InsFilter'
import InitSpwn from './InitSpwn'

const spwnfilter = InsFilter('SPWN', /spwn\.jp/, 'https://spwn.jp', InitSpwn)
export default spwnfilter
