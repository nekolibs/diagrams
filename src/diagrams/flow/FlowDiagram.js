import { AbsG, AbsPolygon, AbsRect } from '@neko-os/charts'

import { Arrow } from '../../parts/Arrow'
import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { diamondPoints } from '../../_helpers/geometry'
import { layoutFlow } from './layoutFlow'

function FlowNode({ node, theme }) {
  const { fill, textColor, weight } = node.style
  const shape =
    node.shape === 'diamond' ? (
      <AbsPolygon points={diamondPoints(node.x, node.y, node.width / 2, node.height / 2)} fill={fill} />
    ) : (
      <AbsRect
        x={node.x - node.width / 2}
        y={node.y - node.height / 2}
        width={node.width}
        height={node.height}
        rx={node.shape === 'pill' ? Math.min(node.height / 2, theme.radius.xxxl) : theme.radius.md}
        fill={fill}
      />
    )
  return (
    <AbsG>
      {shape}
      <TextLines lines={node.lines} x={node.x} y={node.y} fontSize={theme.fonts.text} weight={weight} fill={textColor} />
    </AbsG>
  )
}

function renderFlow({ boxes, edges, scale, offsetX, offsetY }, theme) {
  const { fonts } = theme
  return (
    <AbsG transform={`translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})`}>
      {edges.map((edge, index) => (
        <Arrow key={`e${index}`} points={edge.points} stroke={theme.line} dashed={edge.dashed} />
      ))}
      {boxes.map((node) => (
        <FlowNode key={node.id} node={node} theme={theme} />
      ))}
      {edges.map((edge, index) =>
        edge.labelPos ? (
          <TextLines
            key={`l${index}`}
            lines={[edge.label]}
            x={edge.labelPos.x}
            y={edge.labelPos.y}
            anchor={edge.labelPos.anchor}
            fontSize={fonts.small}
            fill={theme.text3}
          />
        ) : null
      )}
    </AbsG>
  )
}

export function FlowDiagram(props) {
  return <SvgDiagram props={props} layout={layoutFlow} render={renderFlow} />
}
