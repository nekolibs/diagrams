import { AbsG, AbsRect } from '@neko-os/charts'

import { Arrow } from '../../parts/Arrow'
import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { lineHeightOf } from '../../_helpers/text'
import { layoutNetwork } from './layoutNetwork'

function renderNetwork({ boxes, edges, scale, offsetX, offsetY }, theme) {
  const { fonts, radius } = theme
  const labelLH = lineHeightOf(fonts.text)
  return (
    <AbsG transform={`translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})`}>
      {edges.map((edge, index) => (
        <Arrow
          key={`e${index}`}
          points={edge.points}
          radius={8}
          stroke={theme.line}
          strokeWidth={1.2}
          dashed={edge.dashed}
          head={edge.arrow}
        />
      ))}
      {boxes.map((node) => (
        <AbsG key={node.id}>
          <AbsRect
            x={node.x - node.width / 2}
            y={node.y - node.height / 2}
            width={node.width}
            height={node.height}
            rx={node.lines.length > 1 ? radius.xl : node.height / 2}
            fill={node.fill}
          />
          <TextLines lines={node.lines} x={node.x} y={node.y} fontSize={fonts.label} weight={500} fill={theme.text} />
        </AbsG>
      ))}
      {edges.map((edge, index) => {
        const pos = edge.labelPos
        if (!pos) return null
        return (
          <AbsG key={`l${index}`}>
            {!!pos.halo && (
              <AbsRect
                x={pos.x - pos.width / 2 - 3}
                y={pos.y - labelLH / 2}
                width={pos.width + 6}
                height={labelLH}
                rx={radius.xxxs}
                fill={theme.surface}
              />
            )}
            <TextLines lines={[edge.label]} x={pos.x} y={pos.y} anchor={pos.anchor} fontSize={fonts.text} fill={theme.text3} />
          </AbsG>
        )
      })}
    </AbsG>
  )
}

export function NetworkDiagram(props) {
  return <SvgDiagram props={props} layout={layoutNetwork} render={renderNetwork} />
}
