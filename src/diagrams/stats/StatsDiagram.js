import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { formatValue, itemDescription, itemLabel, toList } from '../../_helpers/items'

function normalizeStats(items) {
  return toList(items)
    .map((item) => {
      if (typeof item !== 'object') return { value: formatValue(item), label: '' }
      return {
        value: formatValue(item.value ?? item.number ?? item.stat),
        label: itemLabel(item) || itemDescription(item),
        color: item.color,
      }
    })
    .filter((stat) => stat.value)
}

function toRows(stats) {
  const rows = []
  for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2))
  return rows
}

function StatTile({ stat, theme }) {
  return (
    <View flex bg={theme.tint(theme.text, 0.05)} br="md" padding="sm">
      <Text fontSize={theme.fonts.value} weight={500} color={theme.color(stat.color, theme.primary)}>
        {stat.value}
      </Text>
      {!!stat.label && (
        <Text fontSize={theme.fonts.text} color={theme.text3}>
          {stat.label}
        </Text>
      )}
    </View>
  )
}

export function StatsDiagram({ items, bg }) {
  const theme = useDiagramTheme(bg)
  const stats = normalizeStats(items)
  if (!stats.length) return null

  return (
    <View gap="sm">
      {toRows(stats).map((row, rowIndex) => (
        <View key={rowIndex} row gap="sm">
          {row.map((stat, index) => (
            <StatTile key={index} stat={stat} theme={theme} />
          ))}
        </View>
      ))}
    </View>
  )
}
