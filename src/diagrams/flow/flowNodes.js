import { toText } from '../../_helpers/items'
import { balancedWrap, lineHeightOf, linesWidth, textWidth, wrapText } from '../../_helpers/text'

const TYPE_ALIASES = {
  start: 'start',
  begin: 'start',
  end: 'end',
  stop: 'end',
  finish: 'end',
  terminal: 'end',
  decision: 'decision',
  question: 'decision',
  choice: 'decision',
  condition: 'decision',
  step: 'step',
  process: 'step',
  action: 'step',
  task: 'step',
}

const NEUTRAL_COLORS = ['gray', 'grey', 'neutral']

export function flowNodeType(node, indegree) {
  const explicit = TYPE_ALIASES[toText(node.type || node.shape).toLowerCase()]
  if (explicit) return explicit
  if (/\?\s*$/.test(node.label)) return 'decision'
  if (!indegree[node.id]) return 'start'
  return 'step'
}

export function flowNodeStyle(node, theme) {
  const colorName = toText(node.color).toLowerCase()
  const color = theme.color(node.color, null)
  if (node.type === 'decision') {
    const accent = color || theme.primary
    return { fill: theme.tint(accent, 0.16), textColor: accent, weight: 500 }
  }
  if (!color) return { fill: theme.tint(theme.text, 0.08), textColor: theme.text2, weight: 400 }
  if (NEUTRAL_COLORS.includes(colorName)) return { fill: theme.tint(color, 0.16), textColor: theme.text2, weight: 400 }
  return { fill: theme.tint(color, 0.16), textColor: color, weight: 500 }
}

function sizeDiamond(label, maxW, fontSize, weight, lh, minHalf, fill) {
  const full = textWidth(label, fontSize, weight)
  const longestWord = Math.max(...String(label).split(/\s+/).map((word) => textWidth(word, fontSize, weight)))
  const candidates = []
  ;[1, 0.75, 0.6, 0.5, 0.42, 0.36].forEach((factor) => {
    const lines = wrapText(label, Math.max(full * factor + 6, longestWord, 36), fontSize, weight, 5)
    if (candidates.some((c) => c.lines.length === lines.length)) return
    const tw = linesWidth(lines, fontSize, weight)
    const halfH = Math.max((tw / 4 + (lines.length * lh) / 2) / fill, minHalf)
    candidates.push({ lines, width: halfH * 4, height: halfH * 2 })
  })
  const fitting = candidates.filter((c) => c.width <= maxW)
  const pool = fitting.length ? fitting : candidates
  const narrowest = Math.min(...pool.map((c) => c.width))
  return pool
    .filter((c) => c.width <= narrowest * 1.08)
    .sort((a, b) => a.lines.length - b.lines.length || a.width - b.width)[0]
}

export function sizeFlowNode(node, maxW, theme, compact) {
  const { fonts, spaces } = theme
  const fontSize = fonts.text
  const lh = lineHeightOf(fontSize)
  const { weight } = node.style

  if (node.type === 'decision') {
    const diamond = sizeDiamond(node.label, maxW, fontSize, weight, lh, spaces.xl, compact ? 0.88 : 0.8)
    return { lines: diamond.lines, width: diamond.width, height: diamond.height, shape: 'diamond' }
  }

  const padH = compact ? spaces.sm : spaces.md
  const padV = spaces.sm
  const minWidth = compact ? spaces.xxxl + spaces.md : spaces.xxxl * 2
  const lines = balancedWrap(node.label, maxW - padH * 2, fontSize, weight, 5)
  const width = Math.min(Math.max(linesWidth(lines, fontSize, weight) + padH * 2, minWidth), Math.max(maxW, 60))
  const height = Math.max(lines.length * lh + padV * 2, spaces.xxl)
  const isTerminal = node.type === 'start' || node.type === 'end'
  return { lines, width, height, shape: isTerminal ? 'pill' : 'rect' }
}
