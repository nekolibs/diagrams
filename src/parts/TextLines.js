import { AbsSvgText } from '@neko-os/charts'

import { r2 } from '../_helpers/geometry'
import { lineHeightOf } from '../_helpers/text'

export function TextLines({ lines, x, y, fontSize, weight, fill, anchor = 'middle', valign = 'middle', lineHeight }) {
  if (!lines?.length) return null
  const lh = lineHeight || lineHeightOf(fontSize)
  let top = y - (lines.length * lh) / 2
  if (valign === 'top') top = y
  if (valign === 'bottom') top = y - lines.length * lh

  return lines.map((line, index) => (
    <AbsSvgText
      key={index}
      x={r2(x)}
      y={r2(top + lh * index + lh / 2 + fontSize * 0.35)}
      fontSize={fontSize}
      fontWeight={weight ? String(weight) : undefined}
      fill={fill}
      textAnchor={anchor}
    >
      {line}
    </AbsSvgText>
  ))
}
