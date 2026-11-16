import { AbsG, AbsLine, AbsRect } from '@neko-os/charts'

import { Arrow } from '../../parts/Arrow'
import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { itemLabel, toList, toText } from '../../_helpers/items'
import { balancedWrap, lineHeightOf, wrapText } from '../../_helpers/text'

const MARGIN = 2
const SELF_LOOP = 18

function normalizeSequence({ actors, participants, messages, steps }) {
  const names = []
  const ids = []
  toList(actors || participants).forEach((actor) => {
    const label = itemLabel(actor)
    if (!label) return
    names.push(label)
    ids.push(toText(actor?.id) || label)
  })
  const indexOf = (ref) => {
    const text = toText(ref)
    let index = ids.indexOf(text)
    if (index < 0) index = names.findIndex((name) => name.toLowerCase() === text.toLowerCase())
    if (index < 0 && text) {
      names.push(text)
      ids.push(text)
      index = names.length - 1
    }
    return index
  }
  const list = toList(messages || steps)
    .map((message) => ({
      from: indexOf(message?.from),
      to: indexOf(message?.to),
      label: itemLabel(message),
      reply: !!(message?.reply || message?.dashed || message?.type === 'reply' || message?.return),
    }))
    .filter((message) => message.from >= 0 && message.to >= 0)
  return { names, messages: list }
}

function layoutSequence(props, width, theme) {
  const { names, messages } = normalizeSequence(props)
  if (!names.length) return null
  const { spaces, fonts } = theme
  const n = names.length
  const colW = (width - MARGIN * 2) / n
  const centers = names.map((_, index) => MARGIN + colW * (index + 0.5))
  const boxW = colW - spaces.xs * 2 + 2
  const actorLH = lineHeightOf(fonts.text)
  const actorLines = names.map((name) => balancedWrap(name, boxW - spaces.xs * 2, fonts.text, 500, 3))
  const boxH = Math.max(...actorLines.map((lines) => lines.length)) * actorLH + spaces.xs * 2 + 2
  const msgLH = lineHeightOf(fonts.small)

  let y = boxH + spaces.md
  const rows = messages.map((message) => {
    const self = message.from === message.to
    const span = Math.abs(centers[message.to] - centers[message.from])
    const maxW = self ? colW / 2 + spaces.sm : Math.max(span + spaces.sm, 40)
    const lines = wrapText(message.label, maxW, fonts.small, 400, 3)
    const labelH = lines.length * msgLH
    const row = { ...message, lines, labelTop: y, lineY: y + labelH + spaces.xxs }
    y = row.lineY + (self ? SELF_LOOP * 0.8 : 0) + spaces.md
    return row
  })

  const height = y - spaces.md + spaces.xs
  return { height, centers, boxW, boxH, actorLines, rows }
}

function renderSequence({ height, centers, boxW, boxH, actorLines, rows }, theme) {
  const { fonts, radius } = theme
  const tint = theme.tint(theme.primary, 0.16)
  return (
    <AbsG>
      {centers.map((x, index) => (
        <AbsLine
          key={`l${index}`}
          x1={x}
          y1={boxH}
          x2={x}
          y2={height}
          stroke={theme.text4}
          strokeWidth={1}
          strokeDasharray="3 3"
          strokeOpacity={0.6}
        />
      ))}
      {centers.map((x, index) => (
        <AbsG key={`a${index}`}>
          <AbsRect x={x - boxW / 2} y={MARGIN} width={boxW} height={boxH - MARGIN} rx={radius.md} fill={tint} />
          <TextLines
            lines={actorLines[index]}
            x={x}
            y={MARGIN + (boxH - MARGIN) / 2}
            fontSize={fonts.text}
            weight={500}
            fill={theme.primary}
          />
        </AbsG>
      ))}
      {rows.map((row, index) => {
        const x1 = centers[row.from]
        const x2 = centers[row.to]
        if (row.from === row.to) {
          const points = [
            { x: x1, y: row.lineY },
            { x: x1 + SELF_LOOP, y: row.lineY },
            { x: x1 + SELF_LOOP, y: row.lineY + SELF_LOOP * 0.8 },
            { x: x1 + 3, y: row.lineY + SELF_LOOP * 0.8 },
          ]
          return (
            <AbsG key={`m${index}`}>
              <Arrow points={points} radius={4} stroke={theme.text3} dashed={row.reply} />
              <TextLines lines={row.lines} x={x1 + SELF_LOOP + 6} y={row.labelTop} valign="top" anchor="start" fontSize={fonts.small} fill={theme.text2} />
            </AbsG>
          )
        }
        const dir = x2 > x1 ? 1 : -1
        return (
          <AbsG key={`m${index}`}>
            <Arrow
              points={[
                { x: x1, y: row.lineY },
                { x: x2 - dir * 3, y: row.lineY },
              ]}
              stroke={theme.text3}
              dashed={row.reply}
            />
            <TextLines lines={row.lines} x={(x1 + x2) / 2} y={row.labelTop} valign="top" fontSize={fonts.small} fill={theme.text2} />
          </AbsG>
        )
      })}
    </AbsG>
  )
}

export function SequenceDiagram(props) {
  return <SvgDiagram props={props} layout={layoutSequence} render={renderSequence} />
}
