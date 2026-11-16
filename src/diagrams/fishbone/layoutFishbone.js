import { itemLabel, toList, toStringList, toText } from '../../_helpers/items'
import { balancedWrap, lineHeightOf, linesWidth, textWidth, wrapText } from '../../_helpers/text'

const MARGIN = 4
const SLANT = 0.5
const CARD_COLORS = ['blue', 'green', 'purple', 'cyan', 'pink', 'indigo', 'yellow', 'gray']

function normalizeFishbone({ problem, effect, head, causes, categories }) {
  const list = toList(causes || categories)
    .map((cause) => ({
      label: itemLabel(cause),
      items: toStringList(cause?.items || cause?.causes || cause?.children),
    }))
    .filter((cause) => cause.label || cause.items.length)
    .slice(0, 8)
  return { problem: toText(problem) || toText(effect) || itemLabel(head), causes: list }
}

function headBox(problem, maxTextW, theme) {
  const { spaces, fonts } = theme
  const lines = balancedWrap(problem, maxTextW, fonts.label, 500, 4)
  return {
    lines,
    width: Math.max(linesWidth(lines, fonts.label, 500) + spaces.sm * 2, spaces.xxxl + spaces.lg),
    height: Math.max(lines.length * lineHeightOf(fonts.label) + spaces.sm * 2, spaces.xxl + spaces.xs),
  }
}

function layoutHorizontal({ problem, causes }, width, theme) {
  const { spaces, fonts } = theme
  const labelLH = lineHeightOf(fonts.label)
  const textLH = lineHeightOf(fonts.text)
  const head = headBox(problem, Math.max(width * 0.24, 60), theme)
  const headX = width - head.width - MARGIN
  const topCount = Math.ceil(causes.length / 2)
  const spineStart = MARGIN
  const colW = (headX - spaces.xs - spineStart) / Math.max(topCount, 1)
  const textW = Math.max(colW - spaces.sm - 4, 40)

  const crowded = causes.some(
    (cause) =>
      textWidth(cause.label, fonts.label, 500) > colW - spaces.sm ||
      cause.items.some((item) => wrapText(item, textW, fonts.text).length > 2)
  )
  if (causes.length > 4 || crowded) return null

  const bones = causes.map((cause, index) => {
    const isTop = index < topCount
    const col = isTop ? index : index - topCount
    const items = cause.items.map((item) => wrapText(item, textW, fonts.text, 400, 2))
    const itemsH = items.reduce((sum, lines) => sum + lines.length * textLH, 0) + Math.max(items.length - 1, 0) * spaces.xxs
    return { ...cause, isTop, col, labelLines: cause.label ? [cause.label] : [], items, itemsH }
  })

  const boneLen = (side) => {
    const list = bones.filter((bone) => bone.isTop === side)
    if (!list.length) return 0
    return Math.max(spaces.xxxl + spaces.lg, ...list.map((bone) => bone.itemsH + spaces.xl))
  }
  const topLen = boneLen(true)
  const bottomLen = boneLen(false)
  const spineY = Math.max(labelLH + spaces.xxs + topLen, head.height / 2) + MARGIN

  const placed = bones.map((bone) => {
    const length = bone.isTop ? topLen : bottomLen
    const attachX = spineStart + colW * bone.col + colW * 0.62
    const endX = attachX - length * SLANT
    const endY = bone.isTop ? spineY - length : spineY + length
    let cursor = bone.isTop ? spineY - length / 2 - bone.itemsH / 2 : spineY + length / 2 - bone.itemsH / 2
    const items = bone.items.map((lines) => {
      const blockH = lines.length * textLH
      const cy = cursor + blockH / 2
      cursor += blockH + spaces.xxs
      return { lines, x: attachX - Math.abs(cy - spineY) * SLANT + spaces.xs + 1, cy, anchor: 'start' }
    })
    const labelHalf = linesWidth(bone.labelLines, fonts.label, 500) / 2
    return {
      bone: [{ x: endX, y: endY }, { x: attachX, y: spineY }],
      labelLines: bone.labelLines,
      labelX: Math.min(Math.max(endX, labelHalf + MARGIN), headX - labelHalf - spaces.xs),
      labelY: bone.isTop ? endY - spaces.xxs : endY + spaces.xxs,
      labelValign: bone.isTop ? 'bottom' : 'top',
      labelAnchor: 'middle',
      items,
    }
  })

  return {
    height: spineY + Math.max(bottomLen ? bottomLen + labelLH + spaces.xxs : 0, head.height / 2) + MARGIN,
    spine: [{ x: spineStart, y: spineY }, { x: headX - 3, y: spineY }],
    head: { ...head, x: headX, y: spineY - head.height / 2 },
    bones: placed,
  }
}

function layoutVertical({ problem, causes }, width, theme) {
  const { spaces, fonts } = theme
  const labelLH = lineHeightOf(fonts.label)
  const textLH = lineHeightOf(fonts.text)
  const spineX = width / 2
  const gap = spaces.lg
  const pad = spaces.sm
  const maxTextW = Math.max(spineX - gap - MARGIN - pad * 2, 60)

  const sized = causes.map((cause, index) => {
    const labelLines = wrapText(cause.label, maxTextW, fonts.label, 500, 2)
    const items = cause.items.map((item) => wrapText(item, maxTextW, fonts.text, 400, 3))
    const textW = Math.max(linesWidth(labelLines, fonts.label, 500), ...items.map((lines) => linesWidth(lines, fonts.text)), 0)
    const textH = labelLines.length * labelLH + items.reduce((sum, lines) => sum + lines.length * textLH, 0)
    const color = theme.color(CARD_COLORS[index % CARD_COLORS.length], theme.primary)
    return { side: index % 2 === 0 ? -1 : 1, labelLines, items, textW, height: textH + pad * 2, color }
  })
  const sideWidth = (side) =>
    Math.max(0, ...sized.filter((card) => card.side === side).map((card) => card.textW)) + pad * 2
  const leftW = sideWidth(-1)
  const rightW = sideWidth(1)

  const bones = []
  const cards = []
  let y = MARGIN
  for (let i = 0; i < sized.length; i += 2) {
    const row = sized.slice(i, i + 2)
    row.forEach((card) => {
      const cardW = card.side < 0 ? leftW : rightW
      const x = card.side < 0 ? spineX - gap - cardW : spineX + gap
      const midY = y + card.height / 2
      let cursor = y + pad + card.labelLines.length * labelLH
      const items = card.items.map((lines) => {
        const item = { lines, x: x + pad, cy: cursor + (lines.length * textLH) / 2, anchor: 'start' }
        cursor += lines.length * textLH
        return item
      })
      cards.push({ x, y, width: cardW, height: card.height, fill: theme.tint(card.color, 0.14) })
      bones.push({
        bone: [{ x: card.side < 0 ? x + cardW : x, y: midY }, { x: spineX, y: midY + spaces.sm }],
        labelLines: card.labelLines,
        labelX: x + pad,
        labelY: y + pad,
        labelValign: 'top',
        labelAnchor: 'start',
        labelFill: card.color,
        items,
      })
    })
    y += Math.max(...row.map((card) => card.height)) + spaces.md
  }

  const head = headBox(problem, width * 0.7, theme)
  const headY = y + spaces.xs
  const spineTop = bones.length ? Math.min(...bones.map(({ bone }) => bone[1].y)) : MARGIN
  return {
    height: headY + head.height + MARGIN,
    spine: [{ x: spineX, y: spineTop }, { x: spineX, y: headY - 3 }],
    head: { ...head, x: spineX - head.width / 2, y: headY },
    bones,
    cards,
  }
}

export function layoutFishbone(props, width, theme) {
  const data = normalizeFishbone(props)
  if (!data.problem && !data.causes.length) return null
  return layoutHorizontal(data, width, theme) || layoutVertical(data, width, theme)
}
