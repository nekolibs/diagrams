import { AbsCircle, AbsG, AbsRect } from '@neko-os/charts'

import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { itemLabel, normalizeItems, toList, toText } from '../../_helpers/items'
import { lineHeightOf, linesWidth, wrapText } from '../../_helpers/text'

function unit(dx, dy) {
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

function circlesFor(count, width) {
  const cx = width / 2
  if (count === 1) {
    const r = Math.min(width / 3, 90)
    return { r, centers: [{ x: cx, y: r + 2 }], height: r * 2 + 4 }
  }
  if (count === 2) {
    const r = Math.min(width / 3.3, 100)
    const d = r * 1.15
    const y = r + 2
    return { r, d, centers: [{ x: cx - d / 2, y }, { x: cx + d / 2, y }], height: r * 2 + 4 }
  }
  const r = Math.min(width / 3.8, 95)
  const d = r * 1.03
  const y = r + 2
  return {
    r,
    d,
    centers: [{ x: cx - d / 2, y }, { x: cx + d / 2, y }, { x: cx, y: y + d * 0.866 }],
    height: y + d * 0.866 + r + 2,
  }
}

function resolveSetRefs(refs, sets) {
  const numbers = refs.filter((ref) => typeof ref === 'number')
  const oneBased = numbers.length > 0 && !numbers.includes(0) && Math.max(...numbers) >= sets.length
  return refs.map((ref) => {
    if (typeof ref === 'number') return oneBased ? ref - 1 : ref
    const text = toText(ref).toLowerCase()
    return sets.findIndex((set) => set.label.toLowerCase() === text)
  })
}

function textBlock(label, description, maxW, theme, maxLines = 3) {
  const { fonts } = theme
  const labelLines = wrapText(label, maxW, fonts.label, 500, maxLines)
  const textLines = wrapText(description, maxW, fonts.text, 400, 2)
  const height = labelLines.length * lineHeightOf(fonts.label) + textLines.length * lineHeightOf(fonts.text)
  return { labelLines, textLines, height }
}

function layoutVenn({ sets, circles, center, overlaps }, width, theme) {
  const list = normalizeItems(sets || circles).slice(0, 3)
  if (!list.length) return null
  const { fonts, spaces } = theme
  const geometry = circlesFor(list.length, width)
  const { r, centers } = geometry
  const centroid = {
    x: centers.reduce((sum, c) => sum + c.x, 0) / centers.length,
    y: centers.reduce((sum, c) => sum + c.y, 0) / centers.length,
  }

  const placedSets = list.map((set, index) => {
    const c = centers[index]
    const color = theme.color(set.color, theme.paletteColor(index))
    let pos = c
    let maxW = r * 1.4
    if (list.length === 2) {
      pos = { x: c.x + (index === 0 ? -0.42 : 0.42) * r, y: c.y }
      maxW = geometry.d * 0.8
    } else if (list.length === 3) {
      const dir = unit(c.x - centroid.x, c.y - centroid.y)
      pos = { x: c.x + dir.x * 0.5 * r, y: c.y + dir.y * 0.5 * r }
      maxW = r * 0.95
    }
    return { ...c, color, pos, ...textBlock(set.label, set.description, maxW, theme) }
  })

  let centerText = toText(center)
  const overlapLabels = []
  toList(overlaps).forEach((overlap) => {
    const refs = toList(overlap?.sets)
    const label = itemLabel(overlap)
    if (!label || refs.length < 2) return
    const [a, b] = resolveSetRefs(refs, list)
    if (!(a >= 0 && a < list.length && b >= 0 && b < list.length) || a === b) return
    if (refs.length >= list.length && list.length > 1) {
      if (!centerText) centerText = label
      return
    }
    if (list.length !== 3) return
    const k = [0, 1, 2].find((i) => i !== a && i !== b)
    const mid = { x: (centers[a].x + centers[b].x) / 2, y: (centers[a].y + centers[b].y) / 2 }
    const dir = unit(mid.x - centers[k].x, mid.y - centers[k].y)
    overlapLabels.push({
      x: mid.x + dir.x * 0.3 * r,
      y: mid.y + dir.y * 0.3 * r,
      lines: wrapText(label, r * 0.6, fonts.small, 500, 2),
    })
  })

  let pill = null
  if (centerText) {
    const maxW = list.length === 2 ? Math.max((2 * r - geometry.d) * 1.3, 70) : r * 0.95
    const lines = wrapText(centerText, maxW, fonts.text, 500, 2)
    const lh = lineHeightOf(fonts.text)
    const w = linesWidth(lines, fonts.text, 500) + spaces.sm * 2
    const h = lines.length * lh + spaces.xs + spaces.xxs
    pill = { x: centroid.x, y: centroid.y, width: w, height: h, lines }
  }

  return { height: geometry.height, r, sets: placedSets, overlaps: overlapLabels, pill }
}

function renderVenn({ r, sets, overlaps, pill }, theme) {
  const { fonts, radius } = theme
  const labelLH = lineHeightOf(fonts.label)
  return (
    <AbsG>
      {sets.map((set, index) => (
        <AbsCircle
          key={`c${index}`}
          cx={set.x}
          cy={set.y}
          r={r}
          fill={set.color}
          fillOpacity={0.16}
          stroke={set.color}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      ))}
      {sets.map((set, index) => {
        const top = set.pos.y - set.height / 2
        return (
          <AbsG key={`l${index}`}>
            <TextLines lines={set.labelLines} x={set.pos.x} y={top} valign="top" fontSize={fonts.label} weight={500} fill={set.color} />
            <TextLines
              lines={set.textLines}
              x={set.pos.x}
              y={top + set.labelLines.length * labelLH}
              valign="top"
              fontSize={fonts.text}
              fill={theme.text3}
            />
          </AbsG>
        )
      })}
      {overlaps.map((overlap, index) => (
        <TextLines
          key={`o${index}`}
          lines={overlap.lines}
          x={overlap.x}
          y={overlap.y}
          fontSize={fonts.small}
          weight={500}
          fill={theme.text2}
        />
      ))}
      {!!pill && (
        <AbsG>
          <AbsRect
            x={pill.x - pill.width / 2}
            y={pill.y - pill.height / 2}
            width={pill.width}
            height={pill.height}
            rx={Math.min(pill.height / 2, radius.xl)}
            fill={theme.primary}
          />
          <TextLines lines={pill.lines} x={pill.x} y={pill.y} fontSize={fonts.text} weight={500} fill={theme.onFill} />
        </AbsG>
      )}
    </AbsG>
  )
}

export function VennDiagram(props) {
  return <SvgDiagram props={props} layout={layoutVenn} render={renderVenn} />
}
