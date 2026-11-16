// Advance widths of ASCII 32..126 in 1/1000 em (Helvetica/Arial metrics).
const ASCII_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
]

const SPECIAL_WIDTHS = {
  '–': 556,
  '—': 1000,
  '‘': 222,
  '’': 222,
  '“': 333,
  '”': 333,
  '…': 1000,
  '×': 584,
  '÷': 584,
  '•': 350,
  '·': 278,
  '→': 1000,
  '←': 1000,
  '≈': 584,
  '≥': 584,
  '≤': 584,
  '€': 556,
  '£': 556,
}

const WEIGHT_FACTORS = { 400: 1.1, 500: 1.13, 600: 1.16, 700: 1.2 }

function charWidth(char) {
  const code = char.codePointAt(0)
  if (code >= 32 && code <= 126) return ASCII_WIDTHS[code - 32]
  if (SPECIAL_WIDTHS[char]) return SPECIAL_WIDTHS[char]
  if (code >= 0xc0 && code <= 0x24f) return 580
  if (code >= 0x2e80) return 1000
  return 620
}

function weightFactor(weight) {
  const w = Number(weight) || 400
  if (w >= 700) return WEIGHT_FACTORS[700]
  if (w >= 600) return WEIGHT_FACTORS[600]
  if (w >= 500) return WEIGHT_FACTORS[500]
  return WEIGHT_FACTORS[400]
}

export function textWidth(text, fontSize, weight = 400) {
  if (!text) return 0
  let total = 0
  for (const char of String(text)) total += charWidth(char)
  return (total / 1000) * fontSize * weightFactor(weight)
}

function breakWord(word, maxWidth, fontSize, weight) {
  const parts = []
  let current = ''
  for (const char of word) {
    if (current && textWidth(current + char, fontSize, weight) > maxWidth) {
      parts.push(current)
      current = char
    } else {
      current += char
    }
  }
  if (current) parts.push(current)
  return parts
}

function clampLines(lines, maxLines, maxWidth, fontSize, weight) {
  if (!maxLines || lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last.length > 1 && textWidth(last + '…', fontSize, weight) > maxWidth) last = last.slice(0, -1).trimEnd()
  kept[maxLines - 1] = last + '…'
  return kept
}

export function wrapText(text, maxWidth, fontSize, weight = 400, maxLines) {
  if (text == null || text === '') return []
  const lines = []
  String(text)
    .split('\n')
    .forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean)
      let current = ''
      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word
        if (textWidth(candidate, fontSize, weight) <= maxWidth) {
          current = candidate
          return
        }
        if (current) lines.push(current)
        if (textWidth(word, fontSize, weight) <= maxWidth) {
          current = word
          return
        }
        const pieces = breakWord(word, maxWidth, fontSize, weight)
        lines.push(...pieces.slice(0, -1))
        current = pieces[pieces.length - 1] || ''
      })
      if (current) lines.push(current)
    })
  return clampLines(lines, maxLines, maxWidth, fontSize, weight)
}

export function linesWidth(lines, fontSize, weight = 400) {
  return lines.reduce((max, line) => Math.max(max, textWidth(line, fontSize, weight)), 0)
}

export function balancedWrap(text, maxWidth, fontSize, weight = 400, maxLines) {
  const lines = wrapText(text, maxWidth, fontSize, weight, maxLines)
  if (lines.length < 2 || (maxLines && lines.length >= maxLines)) return lines
  let best = lines
  let width = linesWidth(lines, fontSize, weight)
  const longestWord = Math.max(...String(text).split(/\s+/).map((word) => textWidth(word, fontSize, weight)))
  const min = Math.max(textWidth(String(text), fontSize, weight) / lines.length, longestWord + 4)
  while (width > min) {
    const tighter = wrapText(text, width - 4, fontSize, weight)
    if (tighter.length !== lines.length) break
    best = tighter
    width = linesWidth(tighter, fontSize, weight)
  }
  return best
}

export function lineHeightOf(fontSize) {
  return Math.round(fontSize * 1.3)
}
