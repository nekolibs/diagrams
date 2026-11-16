import { AbsCircle, AbsSvg } from '@neko-os/charts'
import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { TextLines } from '../../parts/TextLines'
import { WidthMeasurer } from '../../parts/WidthMeasurer'
import { normalizeItems } from '../../_helpers/items'
import { lineHeightOf, textWidth, wrapText } from '../../_helpers/text'

const DOT = 10
const CENTER_FROM = 480

function ringFill(index, count, theme) {
  if (index === 0) return theme.primary
  const rings = count - 1
  const amount = rings === 1 ? 0.2 : 0.28 - (0.16 * (index - 1)) / (rings - 1)
  return theme.tint(theme.primary, amount)
}

function layoutCircles(layers, width, theme) {
  const { fonts } = theme
  const size = Math.round(Math.min(Math.max(width * 0.5, 120), 200))
  const outer = size / 2 - 1
  const n = layers.length
  const lh = lineHeightOf(fonts.label)
  const center = size / 2

  const rings = layers.map((layer, index) => {
    const radius = (outer * (index + 1)) / n
    const fill = ringFill(index, n, theme)
    if (index === 0) {
      const lines = wrapText(layer.label, radius * 1.6, fonts.label, 500, 2)
      const fits = lines.length * lh <= radius * 1.5
      return { radius, fill, lines: fits ? lines : [], y: center }
    }
    const inner = (outer * index) / n
    const mid = (radius + inner) / 2
    const halfChord = Math.sqrt(Math.max(radius * radius - (mid + lh * 0.3) ** 2, 0))
    const fits = radius - inner >= lh * 0.95 && textWidth(layer.label, fonts.label, 500) <= halfChord * 2 - 4
    return { radius, fill, lines: fits ? [layer.label] : [], y: center - mid }
  })

  return { size, center, rings }
}

function Circles({ layout, theme }) {
  const { size, center, rings } = layout
  const n = rings.length
  return (
    <AbsSvg width={size} height={size}>
      {[...rings].reverse().map((ring, i) => (
        <AbsCircle key={i} cx={center} cy={center} r={ring.radius} fill={ring.fill} />
      ))}
      {rings.map((ring, index) => (
        <TextLines
          key={`t${index}`}
          lines={ring.lines}
          x={center}
          y={ring.y}
          fontSize={theme.fonts.label}
          weight={500}
          fill={index === 0 ? theme.onFill : index === n - 1 ? theme.text2 : theme.text}
        />
      ))}
    </AbsSvg>
  )
}

function LegendDot({ index, count, theme }) {
  return (
    <View width={DOT} height={DOT} round center bg={theme.primary}>
      {index > 0 && <View width={8} height={8} round bg={ringFill(index, count, theme)} />}
    </View>
  )
}

function legendWidth(layers, theme) {
  const { fonts, spaces } = theme
  const text = Math.max(
    ...layers.map((layer) => Math.max(textWidth(layer.label, fonts.label, 500), textWidth(layer.description, fonts.text)))
  )
  return Math.ceil(DOT + spaces.sm + text + 8)
}

function Legend({ layers, theme }) {
  return (
    <View gap="md">
      {layers.map((layer, index) => (
        <View key={index} row centerV gap="sm">
          <LegendDot index={index} count={layers.length} theme={theme} />
          <View flex>
            <Text fontSize={theme.fonts.label} weight={500} color={theme.text}>
              {layer.label}
            </Text>
            {!!layer.description && (
              <Text fontSize={theme.fonts.text} color={theme.text3}>
                {layer.description}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

export function ConcentricDiagram({ items, layers, width, bg }) {
  const theme = useDiagramTheme(bg)
  const list = normalizeItems(items || layers).slice(0, 6)
  if (!list.length) return null

  return (
    <WidthMeasurer width={width}>
      {(measured) => {
        const layout = layoutCircles(list, measured, theme)
        if (measured < CENTER_FROM) {
          return (
            <View row centerV gap="md">
              <Circles layout={layout} theme={theme} />
              <View flex>
                <Legend layers={list} theme={theme} />
              </View>
            </View>
          )
        }
        const gap = theme.spaces.md
        const legend = Math.min(legendWidth(list, theme), measured - layout.size - gap)
        return (
          <View centerH>
            <View row centerV gap="md" width={layout.size + gap + legend}>
              <Circles layout={layout} theme={theme} />
              <View width={legend}>
                <Legend layers={list} theme={theme} />
              </View>
            </View>
          </View>
        )
      }}
    </WidthMeasurer>
  )
}
