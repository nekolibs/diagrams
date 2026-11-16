import { AbsG, AbsPath, AbsRect } from '@neko-os/charts'

import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { r2 } from '../../_helpers/geometry'
import { balancedWrap, lineHeightOf, linesWidth, wrapText } from '../../_helpers/text'
import { normalizeMindmap } from './normalize'

function layoutMap(props, width, theme) {
  const { center, branches } = normalizeMindmap(props)
  if (!center && !branches.length) return null
  const { spaces, fonts } = theme
  const padH = spaces.sm
  const padV = spaces.xs + spaces.xxs
  const labelLH = lineHeightOf(fonts.label)
  const textLH = lineHeightOf(fonts.text)

  const rootLines = balancedWrap(center, Math.max(width * 0.24, 56), fonts.label, 500, 4)
  const rootW = Math.max(linesWidth(rootLines, fonts.label, 500) + padH * 2, spaces.xxxl + spaces.md)
  const rootH = rootLines.length * labelLH + spaces.xs * 2

  if (!branches.length) {
    return { height: rootH, root: { x: 0, y: 0, width: rootW, height: rootH, lines: rootLines }, branches: [] }
  }

  const x0 = rootW + spaces.xl
  const boxW = width - x0
  const textW = boxW - padH * 2
  let y = 0
  const placed = branches.map((branch, index) => {
    const labelLines = wrapText(branch.label, textW, fonts.label, 500)
    const secondary = [branch.description, branch.children.join(' · ')].filter(Boolean)
    const textLines = secondary.flatMap((text) => wrapText(text, textW, fonts.text))
    const height = padV * 2 + labelLines.length * labelLH + textLines.length * textLH
    const box = {
      x: x0,
      y,
      width: boxW,
      height,
      labelLines,
      textLines,
      color: theme.color(branch.color, theme.paletteColor(index)),
    }
    y += height + spaces.xs
    return box
  })

  const height = y - spaces.xs
  const rootY = Math.max(0, (height - rootH) / 2)
  return {
    height: Math.max(height, rootH),
    root: { x: 0, y: rootY, width: rootW, height: rootH, lines: rootLines },
    branches: placed,
  }
}

function renderMap(layout, theme) {
  const { root, branches } = layout
  const { fonts, spaces, radius } = theme
  const rootCy = root.y + root.height / 2
  const padV = spaces.xs + spaces.xxs
  const labelLH = lineHeightOf(fonts.label)

  return (
    <AbsG>
      {branches.map((branch, index) => {
        const cy = branch.y + branch.height / 2
        const midX = (root.width + branch.x) / 2
        return (
          <AbsPath
            key={`c${index}`}
            d={`M${r2(root.width)},${r2(rootCy)} C${r2(midX)},${r2(rootCy)} ${r2(midX)},${r2(cy)} ${r2(branch.x)},${r2(cy)}`}
            fill="none"
            stroke={branch.color}
            strokeWidth={1.6}
          />
        )
      })}
      <AbsRect x={root.x} y={root.y} width={root.width} height={root.height} rx={radius.xl} fill={theme.primary} />
      <TextLines
        lines={root.lines}
        x={root.width / 2}
        y={rootCy}
        fontSize={fonts.label}
        weight={500}
        fill={theme.onFill}
      />
      {branches.map((branch, index) => (
        <AbsG key={`b${index}`}>
          <AbsRect
            x={branch.x}
            y={branch.y}
            width={branch.width}
            height={branch.height}
            rx={radius.md}
            fill={theme.tint(branch.color, 0.12)}
          />
          <TextLines
            lines={branch.labelLines}
            x={branch.x + spaces.sm}
            y={branch.y + padV}
            valign="top"
            anchor="start"
            fontSize={fonts.label}
            weight={500}
            fill={branch.color}
          />
          <TextLines
            lines={branch.textLines}
            x={branch.x + spaces.sm}
            y={branch.y + padV + branch.labelLines.length * labelLH}
            valign="top"
            anchor="start"
            fontSize={fonts.text}
            fill={theme.text3}
          />
        </AbsG>
      ))}
    </AbsG>
  )
}

export function MindmapMap(props) {
  return <SvgDiagram props={props} layout={layoutMap} render={renderMap} />
}
