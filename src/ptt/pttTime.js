const PTT_TIMEZONE_OFFSET_HOURS = 8

const MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
}

function createDateFromTaiwanTimeParts (year, monthIndex, day, hours, minutes, seconds = 0) {
  const utcTime = Date.UTC(year, monthIndex, day, hours - PTT_TIMEZONE_OFFSET_HOURS, minutes, seconds)
  return new Date(utcTime)
}

export function parsePttPostTime (value) {
  const match = /^(\S{3}) (\S{3})\s+(\d{1,2}) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/.exec(value)
  if (match == null) return null

  const monthIndex = MONTH_INDEX[match[2]]
  if (monthIndex == null) return null

  return createDateFromTaiwanTimeParts(+match[7], monthIndex, +match[3], +match[4], +match[5], +match[6])
}

export function createPttCommentTime (year, month, day, hours, minutes) {
  return createDateFromTaiwanTimeParts(year, month - 1, day, hours, minutes)
}
