import { normalizeItems, toText } from '../../_helpers/items'
import { balancedWrap, lineHeightOf, linesWidth, wrapText } from '../../_helpers/text'

const MARGIN = 2
const ARROW_GAP = 6

function pointAt(cx, cy, rx, ry, angle) {
  return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }
}

function insideBox(p, box, pad) {
  return Math.abs(p.x - box.x) <= box.width / 2 + pad && Math.abs(p.y - box.y) <= box.height / 2 + pad
}

function boxesClash(a, b, pad) {
  return Math.abs(a.x - b.x) * 2 < a.width + b.width + pad * 2 && Math.abs(a.y - b.y) * 2 < a.height + b.height + pad * 2
}

export function cycleItems({ items, steps, stages }) {
  return normalizeItems(items || steps || stages).slice(0, 8)
}

export function layoutCycle(props, width, theme) {
  const list = cycleItems(props)
  if (!list.length) return null
  const { fonts, spaces, radius } = theme
  const n = list.length
  const lh = lineHeightOf(fonts.label)
  const padH = spaces.md
  const padV = spaces.xs + spaces.xxxs * 2
  const maxText = Math.min(width * 0.3, 110)

  const pills = list.map((item, index) => {
    const lines = balancedWrap(item.label, maxText, fonts.label, 500, 3)
    const w = Math.max(linesWidth(lines, fonts.label, 500) + padH * 2, spaces.xxxl + spaces.md)
    const h = lines.length * lh + padV * 2
    return { lines, width: w, height: h, rx: lines.length > 1 ? radius.xl : h / 2, angle: -Math.PI / 2 + (2 * Math.PI * index) / n }
  })

  const cx = width / 2
  let rx = Math.min(width * 0.36, 110)
  pills.forEach((pill) => {
    const cos = Math.abs(Math.cos(pill.angle))
    if (cos > 0.01) rx = Math.min(rx, (width / 2 - MARGIN - pill.width / 2) / cos)
  })
  rx = Math.max(rx, 20)

  const place = (ry) => pills.map((pill) => ({ ...pill, ...pointAt(cx, 0, rx, ry, pill.angle) }))
  let ry = rx
  for (let tries = 0; tries < 60; tries++) {
    const placed = place(ry)
    const clash = placed.some((pill, i) => n > 1 && boxesClash(pill, placed[(i + 1) % n], ARROW_GAP * 2 + 6))
    if (!clash || n < 2) break
    ry += 4
  }
  if (n === 1) ry = 0

  const top = Math.max(...pills.map((pill) => -ry * Math.sin(pill.angle) + pill.height / 2))
  const cy = top + MARGIN
  const placed = pills.map((pill) => ({ ...pill, ...pointAt(cx, cy, rx, ry, pill.angle) }))
  const bottom = Math.max(...placed.map((pill) => pill.y + pill.height / 2))

  const arcs = []
  if (n > 1) {
    placed.forEach((pill, i) => {
      const next = placed[(i + 1) % n]
      const from = pill.angle
      const to = i === n - 1 ? next.angle + Math.PI * 2 : next.angle
      let a0 = from
      while (a0 < to && insideBox(pointAt(cx, cy, rx, ry, a0), pill, ARROW_GAP)) a0 += 0.01
      let a1 = to
      while (a1 > a0 && insideBox(pointAt(cx, cy, rx, ry, a1), next, ARROW_GAP)) a1 -= 0.01
      if (a1 - a0 < 0.05) return
      arcs.push({
        start: pointAt(cx, cy, rx, ry, a0),
        end: pointAt(cx, cy, rx, ry, a1),
        before: pointAt(cx, cy, rx, ry, a1 - 0.06),
        large: a1 - a0 > Math.PI ? 1 : 0,
      })
    })
  }

  const centerText = toText(props.center)
  const centerLines = centerText && n > 1 ? wrapText(centerText, Math.max(rx * 1.1, 50), fonts.text, 400, 3) : []

  return { height: bottom + MARGIN, cx, cy, rx, ry, pills: placed, arcs, centerLines }
}
