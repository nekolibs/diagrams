import { AbsG, AbsLine, AbsRect } from '@neko-os/charts'

import { Arrow } from '../../parts/Arrow'
import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { layoutFishbone } from './layoutFishbone'

function renderFishbone({ spine, head, bones, cards = [] }, theme) {
  const { fonts, radius } = theme
  const orange = theme.colors.orange || theme.primary
  return (
    <AbsG>
      <Arrow points={spine} stroke={theme.line} />
      {bones.map(({ bone }, index) => (
        <AbsLine
          key={`b${index}`}
          x1={bone[0].x}
          y1={bone[0].y}
          x2={bone[1].x}
          y2={bone[1].y}
          stroke={theme.line}
          strokeWidth={1.3}
        />
      ))}
      {cards.map((card, index) => (
        <AbsRect key={`c${index}`} x={card.x} y={card.y} width={card.width} height={card.height} rx={radius.md} fill={card.fill} />
      ))}
      <AbsRect x={head.x} y={head.y} width={head.width} height={head.height} rx={radius.md} fill={theme.tint(orange, 0.16)} />
      <TextLines
        lines={head.lines}
        x={head.x + head.width / 2}
        y={head.y + head.height / 2}
        fontSize={fonts.label}
        weight={500}
        fill={orange}
      />
      {bones.map((bone, index) => (
        <AbsG key={`t${index}`}>
          <TextLines
            lines={bone.labelLines}
            x={bone.labelX}
            y={bone.labelY}
            valign={bone.labelValign}
            anchor={bone.labelAnchor}
            fontSize={fonts.label}
            weight={500}
            fill={bone.labelFill || theme.text2}
          />
          {bone.items.map((item, i) => (
            <TextLines key={i} lines={item.lines} x={item.x} y={item.cy} anchor={item.anchor} fontSize={fonts.text} fill={theme.text3} />
          ))}
        </AbsG>
      ))}
    </AbsG>
  )
}

export function FishboneDiagram(props) {
  return <SvgDiagram props={props} layout={layoutFishbone} render={renderFishbone} />
}
