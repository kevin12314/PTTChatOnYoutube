import InsFilter from 'src/filter/InsFilter'
import InitEplus from './InitEplus'

const eplusfilter = InsFilter('Eplus', /live\.eplus\.jp\/ex\/player/, 'https://live.eplus.jp', InitEplus)
export default eplusfilter
