import { Text, View } from '@neko-os/ui'

import { useDiagramTheme } from '../../DiagramTheme'
import { normalizeMindmap } from './normalize'

const LINE = 2

function Rail({ isLast, theme }) {
  const { spaces } = theme
  return (
    <View width={spaces.lg + spaces.xxs} relative>
      <View
        absolute
        left={spaces.md - 1}
        top={0}
        bottom={isLast ? undefined : 0}
        height={isLast ? spaces.md + LINE : undefined}
        width={LINE}
        bg={theme.divider}
      />
      <View absolute left={spaces.md - 1} top={spaces.md} width={spaces.xs + spaces.xxs} height={LINE} bg={theme.divider} />
    </View>
  )
}

function Chip({ label, theme }) {
  return (
    <View bg={theme.surface} br="lg" paddingH="xs" paddingV="xxxs">
      <Text fontSize={theme.fonts.small} color={theme.text2}>
        {label}
      </Text>
    </View>
  )
}

function BranchCard({ branch, color, theme }) {
  return (
    <View bg={theme.fade(color, 0.1)} br="md" paddingH="sm" paddingV="xs" gap="xs">
      <View row wrap centerV justify="space-between" gap="xs">
        <Text fontSize={theme.fonts.item} weight={500} color={color}>
          {branch.label}
        </Text>
        {!!branch.description && (
          <Text fontSize={theme.fonts.text} color={theme.text3}>
            {branch.description}
          </Text>
        )}
      </View>
      {branch.children.length > 0 && (
        <View row wrap gap="xxs">
          {branch.children.map((child, index) => (
            <Chip key={index} label={child} theme={theme} />
          ))}
        </View>
      )}
    </View>
  )
}

export function MindmapTree(props) {
  const theme = useDiagramTheme(props.bg)
  const { center, branches } = normalizeMindmap(props)
  if (!center && !branches.length) return null

  return (
    <View>
      {!!center && (
        <View row>
          <View bg={theme.primary} br="xxl" paddingH="md" paddingV="xs">
            <Text fontSize={theme.fonts.item} weight={500} color={theme.onFill}>
              {center}
            </Text>
          </View>
        </View>
      )}
      {branches.length > 0 && (
        <View row height={theme.spaces.sm}>
          <View width={theme.spaces.lg + theme.spaces.xxs} relative>
            <View absolute left={theme.spaces.md - 1} top={0} bottom={0} width={LINE} bg={theme.divider} />
          </View>
        </View>
      )}
      {branches.map((branch, index) => {
        const isLast = index === branches.length - 1
        return (
          <View key={index} row>
            <Rail isLast={isLast} theme={theme} />
            <View flex paddingB={isLast ? undefined : 'xs'}>
              <BranchCard branch={branch} color={theme.color(branch.color, theme.paletteColor(index))} theme={theme} />
            </View>
          </View>
        )
      })}
    </View>
  )
}
