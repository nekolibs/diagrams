import { useMemo } from 'react'

import { AbsSvg } from '@neko-os/charts'

import { useDiagramTheme } from '../DiagramTheme'
import { WidthMeasurer } from './WidthMeasurer'

function SvgContent({ width, theme, layout, props, render }) {
  const signature = JSON.stringify(props)
  const result = useMemo(() => layout(props, width, theme), [signature, width, theme])
  if (!result || !(result.height > 0)) return null
  return (
    <AbsSvg width={width} height={Math.ceil(result.height)}>
      {render(result, theme, width)}
    </AbsSvg>
  )
}

export function SvgDiagram({ props, layout, render }) {
  const theme = useDiagramTheme(props.bg)
  return (
    <WidthMeasurer width={props.width}>
      {(width) => <SvgContent width={width} theme={theme} layout={layout} props={props} render={render} />}
    </WidthMeasurer>
  )
}
