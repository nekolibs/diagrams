import { AbsG, AbsRect } from '@neko-os/charts'
import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { Arrow } from '../../parts/Arrow'
import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { WidthMeasurer } from '../../parts/WidthMeasurer'
import { pt, r2 } from '../../_helpers/geometry'
import { textWidth } from '../../_helpers/text'
import { cycleItems, layoutCycle } from './layoutCycle'

const RING_WIDTH = 320
const SIDE_GAP = 'xxl'
const MIN_SIDE_LEGEND = 200

function renderCycle({ cx, cy, rx, ry, pills, arcs, centerLines }, theme) {
  const { fonts } = theme
  return (
    <AbsG>
      {arcs.map((arc, index) => (
        <Arrow
          key={`a${index}`}
          d={`M${pt(arc.start)} A${r2(rx)} ${r2(ry)} 0 ${arc.large} 1 ${pt(arc.end)}`}
          tip={arc.end}
          tipFrom={arc.before}
          stroke={theme.line}
          strokeWidth={1.5}
        />
      ))}
      {pills.map((pill, index) => (
        <AbsG key={`p${index}`}>
          <AbsRect
            x={pill.x - pill.width / 2}
            y={pill.y - pill.height / 2}
            width={pill.width}
            height={pill.height}
            rx={pill.rx}
            fill={theme.tint(theme.primary, 0.16)}
          />
          <TextLines lines={pill.lines} x={pill.x} y={pill.y} fontSize={fonts.label} weight={500} fill={theme.primary} />
        </AbsG>
      ))}
      <TextLines lines={centerLines} x={cx} y={cy} fontSize={fonts.text} fill={theme.text3} />
    </AbsG>
  )
}

function legendLabelWidth(items, theme) {
  return Math.min(Math.max(...items.map((item) => textWidth(item.label, theme.fonts.label, 500))) + 4, 140)
}

function legendWidth(items, theme) {
  const text = Math.max(...items.map((item) => textWidth(item.description, theme.fonts.text)))
  return Math.ceil(legendLabelWidth(items, theme) + theme.spaces.sm + text + 8)
}

function Legend({ items, theme, gap = 'xxs' }) {
  const labelWidth = legendLabelWidth(items, theme)
  return (
    <View gap={gap}>
      {items.map((item, index) => (
        <View key={index} row gap="sm">
          <View width={labelWidth}>
            <Text fontSize={theme.fonts.label} weight={500} color={theme.text}>
              {item.label}
            </Text>
          </View>
          <View flex>
            <Text fontSize={theme.fonts.text} color={theme.text3}>
              {item.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export function CycleDiagram(props) {
  const theme = useDiagramTheme(props.bg)
  const items = cycleItems(props)
  if (!items.length) return null
  const hasLegend = items.some((item) => item.description)
  if (!hasLegend) return <SvgDiagram props={props} layout={layoutCycle} render={renderCycle} />

  return (
    <WidthMeasurer width={props.width}>
      {(width) => {
        const gap = theme.spaces[SIDE_GAP]
        const available = width - RING_WIDTH - gap
        if (available < MIN_SIDE_LEGEND) {
          return (
            <View gap="xs">
              <SvgDiagram props={{ ...props, width }} layout={layoutCycle} render={renderCycle} />
              <Legend items={items} theme={theme} />
            </View>
          )
        }
        const side = Math.min(legendWidth(items, theme), available)
        return (
          <View centerH>
            <View row centerV gap={SIDE_GAP} width={RING_WIDTH + gap + side}>
              <SvgDiagram props={{ ...props, width: RING_WIDTH }} layout={layoutCycle} render={renderCycle} />
              <View width={side}>
                <Legend items={items} theme={theme} gap="sm" />
              </View>
            </View>
          </View>
        )
      }}
    </WidthMeasurer>
  )
}
