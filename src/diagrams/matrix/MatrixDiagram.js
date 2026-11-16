import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { itemDescription, itemLabel, toList, toStringList } from '../../_helpers/items'

const QUADRANT_COLORS = ['green', 'blue', 'orange', 'gray']
const DOT = 8

function toNumber(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : null
}

function normalizePlotItems(items) {
  const list = toList(items)
    .map((item) => ({ label: itemLabel(item), x: toNumber(item?.x), y: toNumber(item?.y), color: item?.color }))
    .filter((item) => item.x != null && item.y != null)
  const isUnit = list.every((item) => Math.abs(item.x) <= 1 && Math.abs(item.y) <= 1)
  const clamp = (n) => Math.min(100, Math.max(0, isUnit ? n * 100 : n))
  return list.map((item) => {
    const x = clamp(item.x)
    const y = clamp(item.y)
    const col = x < 50 ? 0 : 1
    const row = y >= 50 ? 0 : 1
    return {
      ...item,
      quadrant: row * 2 + col,
      lx: col === 0 ? x / 50 : (x - 50) / 50,
      ly: row === 0 ? (100 - y) / 50 : (50 - y) / 50,
    }
  })
}

function PlotItem({ item, hasText, theme }) {
  const color = theme.color(item.color, theme.text2)
  const left = 0.08 + item.lx * 0.84
  const top = hasText ? 0.42 + item.ly * 0.5 : 0.08 + item.ly * 0.84
  const onRight = left > 0.6
  const position = onRight ? { right: `${(1 - left) * 100}%`, marginR: -DOT / 2 } : { left: `${left * 100}%`, marginL: -DOT / 2 }

  return (
    <View
      absolute
      top={`${top * 100}%`}
      marginT={-DOT}
      {...position}
      direction={onRight ? 'row-reverse' : 'row'}
      align="center"
      gap="xxs"
      maxW={`${Math.round((onRight ? left : 1 - left) * 100) - 2}%`}
    >
      <View width={DOT} height={DOT} round bg={color} />
      {!!item.label && (
        <Text fontSize={theme.fonts.small} weight={500} color={theme.text2}>
          {item.label}
        </Text>
      )}
    </View>
  )
}

function Quadrant({ quadrant, index, plotItems, theme }) {
  const color = theme.color(quadrant?.color, theme.colors[QUADRANT_COLORS[index]])
  const label = itemLabel(quadrant)
  const description = itemDescription(quadrant)
  const hasItems = plotItems.length > 0
  const sizing = hasItems ? { ratio: 1.1 } : { minH: theme.spaces.xxxl + theme.spaces.xxl }

  return (
    <View flex bg={theme.fade(color, 0.14)} br="md" relative {...sizing}>
      <View padding="sm">
        {!!label && (
          <Text fontSize={theme.fonts.item} weight={500} color={color}>
            {label}
          </Text>
        )}
        {!!description && (
          <Text fontSize={theme.fonts.text} color={theme.text3}>
            {description}
          </Text>
        )}
      </View>
      {plotItems.map((item, i) => (
        <PlotItem key={i} item={item} hasText={!!label || !!description} theme={theme} />
      ))}
    </View>
  )
}

function AxisText({ children, theme, center }) {
  return (
    <Text fontSize={theme.fonts.text} weight={500} color={theme.text3} center={center}>
      {children}
    </Text>
  )
}

export function MatrixDiagram({ columns, rows, xAxis, yAxis, quadrants, items, bg }) {
  const theme = useDiagramTheme(bg)
  const columnLabels = toStringList(columns || xAxis).slice(0, 2)
  const rowLabels = toStringList(rows || yAxis).slice(0, 2)
  const cells = toList(quadrants).slice(0, 4)
  const plotItems = normalizePlotItems(items)
  if (!cells.length && !plotItems.length) return null

  return (
    <View gap="xs">
      {columnLabels.length > 0 && (
        <View row gap="xs">
          {rowLabels.length > 0 && <View width="xxl" />}
          {[0, 1].map((col) => (
            <View key={col} flex centerH>
              <AxisText theme={theme} center>
                {columnLabels[col] || ''}
              </AxisText>
            </View>
          ))}
        </View>
      )}
      {[0, 1].map((row) => (
        <View key={row} row gap="xs">
          {rowLabels.length > 0 && (
            <View width="xxl" centerV>
              <AxisText theme={theme}>{rowLabels[row] || ''}</AxisText>
            </View>
          )}
          {[0, 1].map((col) => {
            const index = row * 2 + col
            return (
              <Quadrant
                key={col}
                quadrant={cells[index]}
                index={index}
                plotItems={plotItems.filter((item) => item.quadrant === index)}
                theme={theme}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}
