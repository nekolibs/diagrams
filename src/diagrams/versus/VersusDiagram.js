import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { itemDescription, itemLabel, toList, toText } from '../../_helpers/items'

function normalizeSide(side, fallbackLabel) {
  if (!side) return { label: fallbackLabel, description: '' }
  return { label: itemLabel(side) || fallbackLabel, description: itemDescription(side), color: side.color }
}

function normalizeRows(rows) {
  return toList(rows)
    .map((row) => {
      if (Array.isArray(row)) return { left: toText(row[0]), right: toText(row[1]), label: '' }
      return { left: toText(row.left), right: toText(row.right), label: toText(row.label ?? row.aspect) }
    })
    .filter((row) => row.left || row.right)
}

function SideHeader({ side, color, theme }) {
  return (
    <View flex bg={theme.fade(color, 0.14)} br="md" padding="xs" center>
      <Text fontSize={theme.fonts.item} weight={500} color={color} center>
        {side.label}
      </Text>
      {!!side.description && (
        <Text fontSize={theme.fonts.text} color={theme.text3} center>
          {side.description}
        </Text>
      )}
    </View>
  )
}

function Cell({ children, theme }) {
  return (
    <View flex paddingV="xs" center borderB={0.5} brColor={theme.divider}>
      <Text fontSize={theme.fonts.label} color={theme.text2} center>
        {children}
      </Text>
    </View>
  )
}

export function VersusDiagram({ left, right, rows, bg }) {
  const theme = useDiagramTheme(bg)
  const leftSide = normalizeSide(left, 'A')
  const rightSide = normalizeSide(right, 'B')
  const list = normalizeRows(rows)
  const leftColor = theme.color(leftSide.color, theme.colors.orange)
  const rightColor = theme.color(rightSide.color, theme.colors.blue)

  return (
    <View gap="xxs">
      <View row centerV>
        <SideHeader side={leftSide} color={leftColor} theme={theme} />
        <View width="xs" center>
          <Text fontSize={theme.fonts.text} weight={500} color={theme.text3}>
            vs
          </Text>
        </View>
        <SideHeader side={rightSide} color={rightColor} theme={theme} />
      </View>
      {list.map((row, index) => (
        <View key={index}>
          {!!row.label && (
            <Text fontSize={theme.fonts.small} weight={500} color={theme.text4} center marginT="xs">
              {row.label}
            </Text>
          )}
          <View row>
            <Cell theme={theme}>{row.left}</Cell>
            <View width="xs" />
            <Cell theme={theme}>{row.right}</Cell>
          </View>
        </View>
      ))}
    </View>
  )
}
