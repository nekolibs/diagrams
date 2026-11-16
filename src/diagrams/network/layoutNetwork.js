import { runDagre } from '../../_helpers/dagre'
import { normalizeGraph } from '../../_helpers/graph'
import { toText } from '../../_helpers/items'
import { balancedWrap, lineHeightOf, linesWidth, textWidth } from '../../_helpers/text'

const MARGIN = 2
const NEUTRAL_COLORS = ['gray', 'grey', 'neutral']

const port = {
  top: (n) => ({ x: n.x, y: n.y - n.height / 2 }),
  bottom: (n) => ({ x: n.x, y: n.y + n.height / 2 }),
  left: (n) => ({ x: n.x - n.width / 2, y: n.y }),
  right: (n) => ({ x: n.x + n.width / 2, y: n.y }),
}

function prepare(props, width, theme) {
  const { nodes, edges } = normalizeGraph(props)
  if (!nodes.length) return null
  const { fonts, spaces } = theme
  const groups = []
  nodes.forEach((node) => {
    const group = toText(node.group)
    if (group && !groups.includes(group)) groups.push(group)
  })
  const maxText = Math.max(width * 0.3, 70)
  const lh = lineHeightOf(fonts.label)
  const sized = nodes.map((node) => {
    const groupIndex = groups.indexOf(toText(node.group))
    const fallback = groupIndex >= 0 ? theme.paletteColor(groupIndex) : theme.primary
    const color = theme.color(node.color, fallback)
    const neutral = NEUTRAL_COLORS.includes(toText(node.color).toLowerCase())
    const lines = balancedWrap(node.label, maxText, fonts.label, 500, 3)
    return {
      ...node,
      groupIndex,
      lines,
      fill: theme.tint(color, neutral ? 0.24 : 0.18),
      textW: linesWidth(lines, fonts.label, 500),
      height: lines.length * lh + spaces.sm + spaces.xxs,
    }
  })
  const uniform = Math.min(Math.max(...sized.map((node) => node.textW)) + spaces.md * 2, maxText + spaces.md * 2)
  sized.forEach((node) => (node.width = uniform))
  const directed = !!props.directed
  const list = edges.map((edge) => ({
    ...edge,
    dashed: !!(edge.dashed || toText(edge.style).toLowerCase() === 'dashed'),
    arrow: directed || !!edge.directed || !!edge.arrow,
  }))
  return { nodes: sized, edges: list, groups }
}

function bounds(parts) {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  parts.forEach(([x0, y0, x1, y1]) => {
    box.minX = Math.min(box.minX, x0)
    box.minY = Math.min(box.minY, y0)
    box.maxX = Math.max(box.maxX, x1)
    box.maxY = Math.max(box.maxY, y1)
  })
  return { ...box, width: box.maxX - box.minX, height: box.maxY - box.minY }
}

function sameLineRoutes(graph, boxes, inner, rankdir, theme) {
  const { spaces } = theme
  const byId = {}
  boxes.forEach((box) => (byId[box.id] = box))
  const offsets = {}
  const horizontal = rankdir === 'TB'
  return inner.map((edge) => {
    const a = byId[edge.from]
    const b = byId[edge.to]
    const lineNodes = boxes
      .filter((box) => box.groupIndex === a.groupIndex)
      .sort((p, q) => (horizontal ? p.x - q.x : p.y - q.y))
    const ia = lineNodes.indexOf(a)
    const ib = lineNodes.indexOf(b)
    const [first, second] = ia < ib ? [a, b] : [b, a]
    if (Math.abs(ia - ib) === 1) {
      if (horizontal) {
        const p = port.right(first)
        const q = port.left(second)
        return { edge, points: [p, q], label: { x: (p.x + q.x) / 2, y: p.y, mode: 'above' } }
      }
      const p = port.bottom(first)
      const q = port.top(second)
      return { edge, points: [p, q], label: { x: p.x + spaces.xs + 1, y: (p.y + q.y) / 2, mode: 'start' } }
    }
    const side = a.groupIndex === 0 ? -1 : 1
    const key = `${a.groupIndex}:${side}`
    offsets[key] = (offsets[key] || 0) + 1
    const reach = spaces.md + (offsets[key] - 1) * spaces.sm
    if (horizontal) {
      const pick = side < 0 ? port.top : port.bottom
      const p = pick(first)
      const q = pick(second)
      const y = p.y + side * reach
      return { edge, points: [p, { x: p.x, y }, { x: q.x, y }, q], label: { x: (p.x + q.x) / 2, y, mode: side < 0 ? 'above' : 'below' } }
    }
    const pick = side < 0 ? port.left : port.right
    const p = pick(first)
    const q = pick(second)
    const x = p.x + side * reach
    return {
      edge,
      points: [p, { x, y: p.y }, { x, y: q.y }, q],
      label: { x: x + side * 4, y: (p.y + q.y) / 2, mode: side < 0 ? 'end' : 'start' },
    }
  })
}

function attempt(graph, rankdir, grouped, theme) {
  const { spaces, fonts } = theme
  const labelLH = lineHeightOf(fonts.text)
  const cross = []
  const inner = []
  graph.edges.forEach((edge) => {
    const a = graph.nodes.find((node) => node.id === edge.from)
    const b = graph.nodes.find((node) => node.id === edge.to)
    if (edge.from === edge.to) return
    if (grouped && a.groupIndex === b.groupIndex) inner.push(edge)
    else if (grouped && a.groupIndex > b.groupIndex) cross.push({ ...edge, from: edge.to, to: edge.from, flipped: true })
    else cross.push(edge)
  })
  const ranks = grouped ? Object.fromEntries(graph.nodes.map((node) => [node.id, Math.max(node.groupIndex, 0) * 2])) : undefined
  const result = runDagre({
    nodes: graph.nodes,
    edges: cross.map((edge) => ({
      from: edge.from,
      to: edge.to,
      labelWidth: edge.label ? textWidth(edge.label, fonts.text) + spaces.xs * 2 : 0,
      labelHeight: edge.label ? labelLH * 2 : 0,
    })),
    rankdir,
    nodesep: spaces.lg,
    ranksep: spaces.lg + spaces.xs,
    edgesep: spaces.sm,
    ranks,
  })
  const boxes = graph.nodes.map((node) => ({ ...node, ...result.positions[node.id] }))

  const routed = cross.map((edge, index) => {
    const route = result.routes[index]
    let points = route.points
    if (edge.flipped) points = [...points].reverse()
    const first = points[0]
    const last = points[points.length - 1]
    const flat = Math.abs(first.y - last.y) < 1
    const mid = route.x != null ? { x: route.x, y: route.y } : { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 }
    return { edge, points, label: edge.label ? { ...mid, mode: flat ? 'above' : 'halo' } : null }
  })
  const all = [...routed, ...(grouped ? sameLineRoutes(graph, boxes, inner, rankdir, theme) : [])]

  const edges = all.map(({ edge, points, label }) => {
    if (!edge.label || !label) return { ...edge, points, labelPos: null }
    const w = textWidth(edge.label, fonts.text)
    let { x, y } = label
    let anchor = 'middle'
    if (label.mode === 'above') y -= labelLH / 2 + 1
    if (label.mode === 'below') y += labelLH / 2 + 1
    if (label.mode === 'start') anchor = 'start'
    if (label.mode === 'end') anchor = 'end'
    return { ...edge, points, labelPos: { x, y, anchor, halo: label.mode === 'halo', width: w } }
  })

  const parts = boxes.map((b) => [b.x - b.width / 2, b.y - b.height / 2, b.x + b.width / 2, b.y + b.height / 2])
  edges.forEach((edge) => {
    edge.points.forEach((p) => parts.push([p.x, p.y, p.x, p.y]))
    if (!edge.labelPos) return
    const { x, y, anchor, width } = edge.labelPos
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2
    parts.push([x0 - 2, y - labelLH / 2, x0 + width + 2, y + labelLH / 2])
  })
  return { boxes, edges, bbox: bounds(parts) }
}

export function layoutNetwork(props, width, theme) {
  const graph = prepare(props, width, theme)
  if (!graph) return null
  const avail = width - MARGIN * 2
  const grouped = graph.groups.length >= 2 && graph.groups.length <= 3
  const options = grouped ? ['LR', 'TB'] : ['TB', 'LR']
  let best = null
  options.forEach((rankdir) => {
    const result = attempt(graph, rankdir, grouped, theme)
    const scale = Math.min(1, avail / result.bbox.width)
    const score = scale >= 0.999 ? 2 - result.bbox.height / 10000 : scale
    if (!best || score > best.score + 0.001) best = { ...result, scale, score }
  })
  const { bbox, scale } = best
  return {
    ...best,
    offsetX: (width - bbox.width * scale) / 2 - bbox.minX * scale,
    offsetY: MARGIN - bbox.minY * scale,
    height: bbox.height * scale + MARGIN * 2,
  }
}
