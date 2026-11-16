import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { WidthMeasurer } from '../../parts/WidthMeasurer'
import { normalizeItems, toText } from '../../_helpers/items'
import { rowLayout } from '../../_helpers/row'

const DOT = 12
const LINE = 2
const PAD = 'sm'

const dateOf = (item) => toText(item.date ?? item.when ?? item.year ?? item.time)

function Rail({ color, isFirst, isLast, theme }) {
  return (
    <View centerH width={DOT}>
      <View height={theme.spaces.xxs} width={2} bg={isFirst ? undefined : theme.divider} />
      <View width={DOT} height={DOT} round bg={color} />
      {!isLast && <View flex width={2} bg={theme.divider} />}
    </View>
  )
}

function TimelineRow({ list, layout, theme }) {
  return (
    <View centerH>
      <View row width={layout.width}>
        {list.map((item, index) => {
          const color = theme.color(item.color, theme.primary)
          const date = dateOf(item)
          return (
            <View key={index} width={layout.column}>
              <View row centerV>
                <View flex height={LINE} bg={index > 0 ? theme.divider : undefined} />
                <View width={DOT} height={DOT} round bg={color} />
                <View flex height={LINE} bg={index < list.length - 1 ? theme.divider : undefined} />
              </View>
              <View paddingH={PAD} marginT="xs">
                {!!date && (
                  <Text center fontSize={theme.fonts.text} weight={500} color={color}>
                    {date}
                  </Text>
                )}
                {!!item.label && (
                  <Text center fontSize={theme.fonts.item} weight={500} color={theme.text}>
                    {item.label}
                  </Text>
                )}
                {!!item.description && (
                  <Text center fontSize={theme.fonts.text} color={theme.text3}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export function TimelineDiagram({ items, events, width, bg }) {
  const theme = useDiagramTheme(bg)
  const list = normalizeItems(items || events)
  if (!list.length) return null

  return (
    <WidthMeasurer width={width}>
      {(measured) => {
        const layout = rowLayout(list, measured, theme, { padding: theme.spaces[PAD] })
        if (layout) return <TimelineRow list={list} layout={layout} theme={theme} />
        return <TimelineList list={list} theme={theme} />
      }}
    </WidthMeasurer>
  )
}

function TimelineList({ list, theme }) {
  return (
    <View>
      {list.map((item, index) => {
        const isLast = index === list.length - 1
        const color = theme.color(item.color, theme.primary)
        const date = dateOf(item)
        return (
          <View key={index} row gap="sm">
            <Rail color={color} isFirst={index === 0} isLast={isLast} theme={theme} />
            <View flex paddingB={isLast ? undefined : 'sm'}>
              {!!date && (
                <Text fontSize={theme.fonts.text} weight={500} color={color}>
                  {date}
                </Text>
              )}
              {!!item.label && (
                <Text fontSize={theme.fonts.item} weight={500} color={theme.text}>
                  {item.label}
                </Text>
              )}
              {!!item.description && (
                <Text fontSize={theme.fonts.text} color={theme.text3}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
