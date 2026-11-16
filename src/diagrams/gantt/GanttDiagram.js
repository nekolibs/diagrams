import { AbsG, AbsLine, AbsPolygon, AbsRect } from '@neko-os/charts'

import { SvgDiagram } from '../../parts/SvgDiagram'
import { TextLines } from '../../parts/TextLines'
import { diamondPoints } from '../../_helpers/geometry'
import { itemLabel, toList, toStringList, toText } from '../../_helpers/items'
import { lineHeightOf, linesWidth, textWidth, wrapText } from '../../_helpers/text'

function periodIndex(value, labels) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Math.round(value)
  const text = toText(value)
  const found = labels.findIndex((label) => label.toLowerCase() === text.toLowerCase())
  if (found >= 0) return found + 1
  const n = parseFloat(text.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : null
}

function normalizeGantt({ periods, columns, tasks, items }) {
  let labels = typeof periods === 'number' ? [] : toStringList(periods || columns)
  const list = toList(tasks || items)
    .map((task) => {
      const start = periodIndex(task?.start ?? task?.from ?? task?.at, labels)
      const end = periodIndex(task?.end ?? task?.to, labels)
      return {
        label: itemLabel(task),
        start,
        end: end ?? start,
        color: task?.color,
        milestone: !!(task?.milestone || task?.type === 'milestone'),
      }
    })
    .filter((task) => task.label && task.start != null)
  const count = Math.max(
    labels.length,
    typeof periods === 'number' ? periods : 0,
    ...list.map((task) => Math.max(task.start, task.end))
  )
  if (labels.length < count) labels = Array.from({ length: count }, (_, i) => labels[i] || String(i + 1))
  const clamp = (n) => Math.min(Math.max(n, 1), count)
  return {
    labels,
    tasks: list.map((task) => {
      const a = clamp(task.start)
      const b = clamp(task.end)
      return { ...task, start: Math.min(a, b), end: Math.max(a, b) }
    }),
  }
}

function layoutGantt(props, width, theme) {
  const { labels, tasks } = normalizeGantt(props)
  if (!tasks.length || !labels.length) return null
  const { spaces, fonts } = theme
  const textLH = lineHeightOf(fonts.text)
  const maxLabelW = width * 0.34
  const rowsText = tasks.map((task) => wrapText(task.label, maxLabelW, fonts.text, 400, 2))
  const labelW = Math.min(Math.max(...rowsText.map((lines) => linesWidth(lines, fonts.text))), maxLabelW)
  const gridX = Math.ceil(labelW + spaces.sm)
  const colW = (width - gridX - 1) / labels.length
  const headerH = spaces.lg
  const widest = Math.max(...labels.map((label) => textWidth(label, fonts.small)))
  const step = Math.max(1, Math.ceil((widest + 4) / colW))
  const barH = spaces.md + 1

  let y = headerH
  const rows = tasks.map((task, index) => {
    const lines = rowsText[index]
    const height = Math.max(spaces.xl - 2, lines.length * textLH + spaces.sm)
    const row = { ...task, lines, y, height, cy: y + height / 2 }
    y += height
    return row
  })

  return { height: y + spaces.xs, gridX, colW, headerH, labels, step, rows, barH }
}

function renderGantt({ height, gridX, colW, headerH, labels, step, rows, barH }, theme) {
  const { fonts, radius } = theme
  return (
    <AbsG>
      {labels.map((_, index) => (
        <AbsLine
          key={`g${index}`}
          x1={gridX + colW * index}
          y1={headerH}
          x2={gridX + colW * index}
          y2={height}
          stroke={theme.divider}
          strokeWidth={0.8}
        />
      ))}
      <AbsLine x1={gridX + colW * labels.length} y1={headerH} x2={gridX + colW * labels.length} y2={height} stroke={theme.divider} strokeWidth={0.8} />
      {labels.map((label, index) =>
        index % step === 0 ? (
          <TextLines
            key={`h${index}`}
            lines={[label]}
            x={gridX + colW * (index + 0.5)}
            y={headerH / 2 - 1}
            fontSize={fonts.small}
            fill={theme.text3}
          />
        ) : null
      )}
      {rows.map((row, index) => {
        const color = theme.color(row.color, row.milestone ? theme.colors.green : theme.primary)
        const x = gridX + colW * (row.start - 1)
        return (
          <AbsG key={`r${index}`}>
            <TextLines lines={row.lines} x={0} y={row.cy} anchor="start" fontSize={fonts.text} fill={theme.text2} />
            {row.milestone ? (
              <AbsPolygon points={diamondPoints(x + colW / 2, row.cy, barH / 2 + 1, barH / 2 + 1)} fill={color} />
            ) : (
              <AbsRect
                x={x + 2}
                y={row.cy - barH / 2}
                width={Math.max(colW * (row.end - row.start + 1) - 4, 4)}
                height={barH}
                rx={radius.xxxs}
                fill={color}
              />
            )}
          </AbsG>
        )
      })}
    </AbsG>
  )
}

export function GanttDiagram(props) {
  return <SvgDiagram props={props} layout={layoutGantt} render={renderGantt} />
}
