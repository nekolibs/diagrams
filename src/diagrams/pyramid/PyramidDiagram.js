import { AbsG, AbsPolygon } from '@neko-os/charts'

import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { normalizeItems } from '../../_helpers/items'
import { polygonPoints } from '../../_helpers/geometry'
import { lineHeightOf, linesWidth, wrapText } from '../../_helpers/text'

const SLICE_GAP = 3
const MAX_TEXT = 360
const CENTER_FROM = 480

function layoutPyramid({ items, levels }, width, theme) {
  const list = normalizeItems(items || levels)
  if (!list.length) return null
  const { spaces, fonts } = theme
  const shapeW = Math.round(Math.min(Math.max(width * 0.4, 100), 170))
  const textX = shapeW + spaces.md
  const textW = Math.min(Math.max(width - textX, 60), MAX_TEXT)
  const labelLH = lineHeightOf(fonts.label)
  const smallLH = lineHeightOf(fonts.small)
  const minRowH = spaces.xxl - 2

  const rows = list.map((item) => {
    const labelLines = wrapText(item.label, textW, fonts.label, 500)
    const textLines = wrapText(item.description, textW, fonts.small)
    const contentH = labelLines.length * labelLH + textLines.length * smallLH
    return { labelLines, textLines, contentH, height: Math.max(minRowH, contentH + spaces.xs) }
  })

  const height = rows.reduce((sum, row) => sum + row.height, 0)
  const halfAt = (y) => (shapeW / 2) * (y / height)
  const cx = shapeW / 2
  let y = 0
  const n = rows.length

  const slices = rows.map((row, index) => {
    const top = index === 0 ? 0 : y + SLICE_GAP / 2
    const bottom = index === n - 1 ? height : y + row.height - SLICE_GAP / 2
    const points =
      index === 0
        ? [
            { x: cx, y: top },
            { x: cx + halfAt(bottom), y: bottom },
            { x: cx - halfAt(bottom), y: bottom },
          ]
        : [
            { x: cx - halfAt(top), y: top },
            { x: cx + halfAt(top), y: top },
            { x: cx + halfAt(bottom), y: bottom },
            { x: cx - halfAt(bottom), y: bottom },
          ]
    const slice = { ...row, points, y, opacity: n === 1 ? 1 : 1 - (0.74 * index) / (n - 1) }
    y += row.height
    return slice
  })

  const textEnd = Math.max(
    ...rows.map((row) => Math.max(linesWidth(row.labelLines, fonts.label, 500), linesWidth(row.textLines, fonts.small)))
  )
  const offsetX = width >= CENTER_FROM ? Math.max(0, (width - textX - textEnd) / 2) : 0

  return { height, slices, textX, offsetX }
}

function renderPyramid({ slices, textX, offsetX }, theme) {
  const { fonts } = theme
  const labelLH = lineHeightOf(fonts.label)

  return (
    <AbsG transform={`translate(${offsetX.toFixed(2)}, 0)`}>
      {slices.map((slice, index) => (
        <AbsPolygon key={`p${index}`} points={polygonPoints(slice.points)} fill={theme.primary} fillOpacity={slice.opacity} />
      ))}
      {slices.map((slice, index) => {
        const top = slice.y + (slice.height - slice.contentH) / 2
        return (
          <AbsG key={`t${index}`}>
            <TextLines
              lines={slice.labelLines}
              x={textX}
              y={top}
              valign="top"
              anchor="start"
              fontSize={fonts.label}
              weight={500}
              fill={theme.text}
            />
            <TextLines
              lines={slice.textLines}
              x={textX}
              y={top + slice.labelLines.length * labelLH}
              valign="top"
              anchor="start"
              fontSize={fonts.small}
              fill={theme.text3}
            />
          </AbsG>
        )
      })}
    </AbsG>
  )
}

export function PyramidDiagram(props) {
  return <SvgDiagram props={props} layout={layoutPyramid} render={renderPyramid} />
}
