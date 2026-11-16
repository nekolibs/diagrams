import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { WidthMeasurer } from '../../parts/WidthMeasurer'
import { normalizeItems } from '../../_helpers/items'
import { rowLayout } from '../../_helpers/row'

const MARKER = 'xs'
const LINE = 2
const PAD = 'sm'

function StepMarker({ number, isLast, color, theme }) {
  return (
    <View centerH width="xs">
      <View width="xs" height="xs" round center bg={theme.fade(color, 0.16)}>
        <Text fontSize={theme.fonts.label} weight={500} color={color}>
          {number}
        </Text>
      </View>
      {!isLast && <View flex width={2} bg={theme.divider} marginV="xxs" />}
    </View>
  )
}

function StepsRow({ steps, layout, theme }) {
  return (
    <View centerH>
      <View row width={layout.width}>
        {steps.map((step, index) => {
          const color = theme.color(step.color, theme.primary)
          return (
            <View key={index} width={layout.column}>
              <View row centerV>
                <View flex height={LINE} bg={index > 0 ? theme.divider : undefined} />
                <View width={MARKER} height={MARKER} round center bg={theme.fade(color, 0.16)}>
                  <Text fontSize={theme.fonts.label} weight={500} color={color}>
                    {index + 1}
                  </Text>
                </View>
                <View flex height={LINE} bg={index < steps.length - 1 ? theme.divider : undefined} />
              </View>
              <View paddingH={PAD} marginT="xs">
                <Text center fontSize={theme.fonts.item} weight={500} color={theme.text}>
                  {step.label}
                </Text>
                {!!step.description && (
                  <Text center fontSize={theme.fonts.text} color={theme.text3}>
                    {step.description}
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

export function StepsDiagram({ items, width, bg }) {
  const theme = useDiagramTheme(bg)
  const steps = normalizeItems(items)
  if (!steps.length) return null

  return (
    <WidthMeasurer width={width}>
      {(measured) => {
        const layout = rowLayout(steps, measured, theme, { padding: theme.spaces[PAD] })
        if (layout) return <StepsRow steps={steps} layout={layout} theme={theme} />
        return <StepsList steps={steps} theme={theme} />
      }}
    </WidthMeasurer>
  )
}

function StepsList({ steps, theme }) {
  return (
    <View>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const color = theme.color(step.color, theme.primary)
        return (
          <View key={index} row gap="sm">
            <StepMarker number={index + 1} isLast={isLast} color={color} theme={theme} />
            <View flex paddingB={isLast ? undefined : 'sm'}>
              <View minH="xs" centerV>
                <Text fontSize={theme.fonts.item} weight={500} color={theme.text}>
                  {step.label}
                </Text>
              </View>
              {!!step.description && (
                <Text fontSize={theme.fonts.text} color={theme.text3}>
                  {step.description}
                </Text>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
