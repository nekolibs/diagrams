import { AbsG, AbsPolygon } from '@neko-os/charts'

import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { formatValue, normalizeItems } from '../../_helpers/items'
import { polygonPoints } from '../../_helpers/geometry'
import { lineHeightOf, wrapText } from '../../_helpers/text'

const BAND_GAP = 4
const BOTTOM_RATIO = 0.3

function layoutFunnel({ items, stages }, width, theme) {
  const list = normalizeItems(items || stages)
  if (!list.length) return null
  const { spaces, fonts } = theme
  const labelLH = lineHeightOf(fonts.label)
  const textLH = lineHeightOf(fonts.text)
  const margin = spaces.xs
  const fullW = width - margin * 2
  const n = list.length
  const minBandH = spaces.xxl - 2

  const textWidthAt = (index) => fullW * (1 - ((1 - BOTTOM_RATIO) * (index + 1)) / n) - spaces.md
  const bands = list.map((item, index) => {
    const maxW = Math.max(textWidthAt(index), 60)
    const labelLines = wrapText(item.label, maxW, fonts.label, 500)
    const value = formatValue(item.value ?? item.count)
    const valueLines = value ? [value] : []
    const textLines = wrapText(item.description, maxW, fonts.text)
    const contentH = labelLines.length * labelLH + (valueLines.length + textLines.length) * textLH
    return { labelLines, valueLines, textLines, contentH, height: Math.max(minBandH, contentH + spaces.sm) }
  })

  const totalH = bands.reduce((sum, band) => sum + band.height, 0) + BAND_GAP * (n - 1)
  const cx = width / 2
  const halfAt = (y) => (fullW / 2) * (1 - (1 - BOTTOM_RATIO) * (y / totalH))
  let y = 0
  const placed = bands.map((band, index) => {
    const top = y
    const bottom = y + band.height
    const points = [
      { x: cx - halfAt(top), y: top },
      { x: cx + halfAt(top), y: top },
      { x: cx + halfAt(bottom), y: bottom },
      { x: cx - halfAt(bottom), y: bottom },
    ]
    y = bottom + BAND_GAP
    return { ...band, y: top, points, fill: theme.tint(theme.primary, n === 1 ? 0.3 : 0.14 + (0.36 * index) / (n - 1)) }
  })

  return { height: totalH, bands: placed, cx }
}

function renderFunnel({ bands, cx }, theme) {
  const { fonts } = theme
  const labelLH = lineHeightOf(fonts.label)
  const textLH = lineHeightOf(fonts.text)

  return (
    <AbsG>
      {bands.map((band, index) => {
        const top = band.y + (band.height - band.contentH) / 2
        const valueTop = top + band.labelLines.length * labelLH
        return (
          <AbsG key={index}>
            <AbsPolygon points={polygonPoints(band.points)} fill={band.fill} />
            <TextLines lines={band.labelLines} x={cx} y={top} valign="top" fontSize={fonts.label} weight={500} fill={theme.text} />
            <TextLines lines={band.valueLines} x={cx} y={valueTop} valign="top" fontSize={fonts.text} fill={theme.text2} />
            <TextLines
              lines={band.textLines}
              x={cx}
              y={valueTop + band.valueLines.length * textLH}
              valign="top"
              fontSize={fonts.text}
              fill={theme.text3}
            />
          </AbsG>
        )
      })}
    </AbsG>
  )
}

export function FunnelDiagram(props) {
  return <SvgDiagram props={props} layout={layoutFunnel} render={renderFunnel} />
}
