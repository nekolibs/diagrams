import { textWidth, wrapText } from './text'

const MIN_COLUMN = 120
const MAX_COLUMN = 190
const MAX_LABEL_LINES = 2
const MAX_TEXT_LINES = 3

function fitsColumn(text, width, fontSize, weight, maxLines) {
  if (!text) return true
  const words = String(text).split(/\s+/)
  if (words.some((word) => textWidth(word, fontSize, weight) > width)) return false
  return wrapText(text, width, fontSize, weight).length <= maxLines
}

export function rowLayout(items, width, theme, { padding }) {
  const count = items.length
  if (count < 2 || !(width > 0)) return null
  const column = Math.min(width / count, MAX_COLUMN)
  if (column < MIN_COLUMN) return null
  const inner = column - padding * 2
  const { fonts } = theme
  const fits = items.every(
    (item) =>
      fitsColumn(item.label, inner, fonts.item, 500, MAX_LABEL_LINES) &&
      fitsColumn(item.description, inner, fonts.text, 400, MAX_TEXT_LINES)
  )
  if (!fits) return null
  return { column, width: column * count }
}
