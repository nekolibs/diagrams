import { runDagre } from '../../_helpers/dagre'
import { boxesOverlap } from '../../_helpers/geometry'
import { findBackEdges, normalizeGraph } from '../../_helpers/graph'
import { lineHeightOf, textWidth } from '../../_helpers/text'
import { flowNodeStyle, flowNodeType, sizeFlowNode } from './flowNodes'

const MARGIN = 2
const YES = /^(yes|y|true|ok|sim|s[ií]|oui|ja)\b/i

const port = {
  top: (n) => ({ x: n.x, y: n.y - n.height / 2 }),
  bottom: (n) => ({ x: n.x, y: n.y + n.height / 2 }),
  left: (n) => ({ x: n.x - n.width / 2, y: n.y }),
  right: (n) => ({ x: n.x + n.width / 2, y: n.y }),
}

function stepify(points) {
  const result = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const a = result[result.length - 1]
    const b = points[i]
    if (Math.abs(a.x - b.x) > 1) {
      const mid = (a.y + b.y) / 2
      result.push({ x: a.x, y: mid }, { x: b.x, y: mid })
    }
    result.push(b)
  }
  return result
}

function prepare(props, theme) {
  const { nodes, edges } = normalizeGraph(props, { chainWhenNoEdges: true })
  if (!nodes.length) return null
  const indeg = {}
  const outdeg = {}
  edges.forEach((edge) => {
    indeg[edge.to] = (indeg[edge.to] || 0) + 1
    outdeg[edge.from] = (outdeg[edge.from] || 0) + 1
  })
  const typed = nodes.map((node) => {
    const withType = { ...node, type: flowNodeType(node, indeg) }
    return { ...withType, style: flowNodeStyle(withType, theme) }
  })
  return { nodes: typed, edges, back: findBackEdges(typed, edges), indeg, outdeg }
}

function findSideLeaves({ nodes, edges, back, indeg, outdeg }) {
  const sides = {}
  const isLeaf = (id) => !outdeg[id] && indeg[id] === 1
  nodes.forEach((node) => {
    const children = edges
      .map((edge, index) => ({ ...edge, index }))
      .filter((edge) => edge.from === node.id && edge.to !== node.id && !back.has(edge.index))
    if (children.length < 2) return
    const continuing = children.filter((edge) => !isLeaf(edge.to))
    const main = continuing[0] || children.find((edge) => YES.test(edge.label)) || children[0]
    const side = children.find((edge) => edge !== main && isLeaf(edge.to) && !sides[edge.to])
    if (side) sides[side.to] = { parent: node.id, edgeIndex: side.index }
  })
  return sides
}

function bounds(items) {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  items.forEach(([x0, y0, x1, y1]) => {
    box.minX = Math.min(box.minX, x0)
    box.minY = Math.min(box.minY, y0)
    box.maxX = Math.max(box.maxX, x1)
    box.maxY = Math.max(box.maxY, y1)
  })
  return { ...box, width: box.maxX - box.minX, height: box.maxY - box.minY }
}

function placeNodes(graph, sized, width, theme) {
  const { spaces, fonts } = theme
  const avail = width - MARGIN * 2
  let sides = findSideLeaves(graph)

  for (let pass = 0; pass < 5; pass++) {
    const coreIds = graph.nodes.filter((node) => !sides[node.id]).map((node) => node.id)
    const core = new Set(coreIds)
    const dagreEdges = []
    const edgeIndexes = []
    graph.edges.forEach((edge, index) => {
      if (!core.has(edge.from) || !core.has(edge.to) || edge.from === edge.to || graph.back.has(index)) return
      dagreEdges.push({ from: edge.from, to: edge.to })
      edgeIndexes.push(index)
    })
    const hasLabels = graph.edges.some((edge) => edge.label && !sides[edge.to])
    const result = runDagre({
      nodes: coreIds.map((id) => sized[id]),
      edges: dagreEdges,
      nodesep: spaces.lg,
      ranksep: hasLabels ? spaces.lg + spaces.xs : spaces.lg,
      edgesep: spaces.sm,
    })
    const routes = {}
    edgeIndexes.forEach((edgeIndex, k) => (routes[edgeIndex] = result.routes[k]))

    const boxes = coreIds.map((id) => ({ ...sized[id], ...result.positions[id] }))
    const dropped = []
    Object.entries(sides).forEach(([id, info]) => {
      const parent = boxes.find((box) => box.id === info.parent)
      if (!parent) return dropped.push(id)
      const node = sized[id]
      const gap = Math.max(spaces.lg + spaces.xs, textWidth(graph.edges[info.edgeIndex].label, fonts.small) + spaces.sm)
      const tryPlace = (dir) => {
        const box = { ...node, x: parent.x + dir * (parent.width / 2 + gap + node.width / 2), y: parent.y, sideDir: dir }
        const all = bounds([...boxes, box].map((b) => [b.x - b.width / 2, 0, b.x + b.width / 2, 0]))
        if (all.width > avail) return null
        if (boxes.some((b) => b.id !== parent.id && boxesOverlap(b, box, spaces.xs))) return null
        return box
      }
      const box = tryPlace(1) || tryPlace(-1)
      if (box) boxes.push(box)
      else dropped.push(id)
    })

    if (!dropped.length || pass === 4) return { boxes, routes, sides }
    dropped.forEach((id) => delete sides[id])
    if (pass === 3) sides = {}
  }
  return null
}

function routeEdges(graph, boxes, routes, sides, theme) {
  const { spaces, fonts } = theme
  const labelLH = lineHeightOf(fonts.small)
  const byId = {}
  boxes.forEach((box) => (byId[box.id] = box))
  const gutters = { 1: 0, '-1': 0 }
  const crosses = (p, targetX, exclude) =>
    boxes.some(
      (box) =>
        !exclude.includes(box.id) &&
        Math.abs(box.y - p.y) < box.height / 2 + 4 &&
        Math.min(p.x, targetX) < box.x + box.width / 2 &&
        Math.max(p.x, targetX) > box.x - box.width / 2
    )
  const rowBlocked = (u, targetX) => crosses(u, targetX, [u.id])
  const centerX =
    (Math.min(...boxes.map((box) => box.x - box.width / 2)) + Math.max(...boxes.map((box) => box.x + box.width / 2))) / 2
  const span = (n) => (n.shape === 'diamond' ? [n.x - n.width * 0.15, n.x + n.width * 0.15] : [n.x - n.width / 2 + spaces.sm, n.x + n.width / 2 - spaces.sm])
  const edgeY = (n, x, sign) => {
    const reach = n.shape === 'diamond' ? (n.height / 2) * (1 - Math.abs(x - n.x) / (n.width / 2)) : n.height / 2
    return n.y + sign * reach
  }
  const gutterLabel = (gx, dir, y0, y1, labelW) => {
    const top = Math.min(y0, y1) + labelLH
    const bottom = Math.max(y0, y1) - labelLH
    const mid = (y0 + y1) / 2
    const x0 = dir > 0 ? gx - 4 - labelW : gx + 4
    const free = (y) =>
      !boxes.some((box) => boxesOverlap(box, { x: x0 + labelW / 2, y, width: labelW + 4, height: labelLH }, 2))
    for (let step = 0; mid - step >= top || mid + step <= bottom; step += 6) {
      for (const y of [mid - step, mid + step]) {
        if (y >= top && y <= bottom && free(y)) return { x: dir > 0 ? gx - 4 : gx + 4, y, anchor: dir > 0 ? 'end' : 'start' }
      }
    }
    return { x: gx + dir * 4, y: mid, anchor: dir > 0 ? 'start' : 'end' }
  }
  const sharedColumn = (u, v) => {
    const [a0, a1] = span(u)
    const [b0, b1] = span(v)
    const lo = Math.max(a0, b0)
    const hi = Math.min(a1, b1)
    if (lo > hi) return null
    return Math.min(Math.max((u.x + v.x) / 2, lo), hi)
  }

  return graph.edges
    .map((edge, index) => {
      const u = byId[edge.from]
      const v = byId[edge.to]
      if (!u || !v) return null
      const label = edge.label
      const labelW = textWidth(label, fonts.small)
      let points
      let labelPos = null

      if (sides[edge.to]?.edgeIndex === index) {
        const dir = v.sideDir
        const a = dir > 0 ? port.right(u) : port.left(u)
        const b = dir > 0 ? port.left(v) : port.right(v)
        points = [a, b]
        if (label) labelPos = { x: (a.x + b.x) / 2, y: a.y - labelLH / 2 - 1, anchor: 'middle' }
      } else if (edge.from === edge.to) {
        const r = port.right(u)
        const loop = spaces.md
        points = [
          { x: r.x - spaces.xs, y: u.y - u.height / 2 },
          { x: r.x - spaces.xs, y: u.y - u.height / 2 - loop / 2 },
          { x: r.x + loop, y: u.y - u.height / 2 - loop / 2 },
          { x: r.x + loop, y: u.y },
          r,
        ]
        if (label) labelPos = { x: r.x + loop + 4, y: u.y - u.height / 2, anchor: 'start' }
      } else if (graph.back.has(index)) {
        const top = Math.min(u.y, v.y)
        const bottom = Math.max(u.y, v.y)
        const between = boxes.filter((box) => box.y + box.height / 2 >= top - 1 && box.y - box.height / 2 <= bottom + 1)
        const plan = (dir) => {
          const outer =
            dir > 0 ? Math.max(...between.map((box) => box.x + box.width / 2)) : Math.min(...between.map((box) => box.x - box.width / 2))
          const gx = outer + dir * (spaces.md + gutters[dir] * spaces.sm)
          const a = dir > 0 ? port.right(u) : port.left(u)
          const b = dir > 0 ? port.right(v) : port.left(v)
          return { dir, gx, a, b, blocked: crosses(a, gx, [u.id, v.id]) || crosses(b, gx, [u.id, v.id]) }
        }
        const preferred = u.x >= centerX ? 1 : -1
        const options = [plan(preferred), plan(-preferred)]
        const { dir, gx, a, b } = options.find((option) => !option.blocked) || options[0]
        gutters[dir] += 1
        points = [a, { x: gx, y: a.y }, { x: gx, y: b.y }, b]
        if (label) labelPos = gutterLabel(gx, dir, a.y, b.y, labelW)
      } else {
        const interior = (routes[index]?.points || []).slice(1, -1)
        const dx = v.x - u.x
        const column = interior.length ? null : sharedColumn(u, v)
        const useElbow =
          column == null && u.shape === 'diamond' && !interior.length && Math.abs(dx) > u.width / 2 + spaces.xs && !rowBlocked(u, v.x)
        if (column != null) {
          points = [
            { x: column, y: edgeY(u, column, 1) },
            { x: column, y: edgeY(v, column, -1) },
          ]
        } else if (useElbow) {
          const a = dx > 0 ? port.right(u) : port.left(u)
          points = [a, { x: v.x, y: u.y }, port.top(v)]
          if (label) labelPos = { x: a.x + Math.sign(dx) * (labelW / 2 + spaces.xs), y: u.y - labelLH / 2 - 1, anchor: 'middle' }
        } else {
          points = stepify([port.bottom(u), ...interior, port.top(v)])
        }
        if (label && !labelPos) {
          const end = points[points.length - 1]
          const before = points[points.length - 2]
          labelPos = { x: end.x + spaces.xs, y: (before.y + end.y) / 2, anchor: 'start' }
        }
      }

      return { points, label, labelW, labelPos, dashed: !!edge.dashed }
    })
    .filter(Boolean)
}

function attempt(graph, maxW, width, theme) {
  const sized = {}
  graph.nodes.forEach((node) => (sized[node.id] = { ...node, ...sizeFlowNode(node, maxW, theme) }))
  const placed = placeNodes(graph, sized, width, theme)
  const edges = routeEdges(graph, placed.boxes, placed.routes, placed.sides, theme)
  const labelLH = lineHeightOf(theme.fonts.small)
  const parts = placed.boxes.map((b) => [b.x - b.width / 2, b.y - b.height / 2, b.x + b.width / 2, b.y + b.height / 2])
  edges.forEach((edge) => {
    edge.points.forEach((p) => parts.push([p.x, p.y, p.x, p.y]))
    if (!edge.labelPos) return
    const { x, y, anchor } = edge.labelPos
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - edge.labelW : x - edge.labelW / 2
    parts.push([x0, y - labelLH / 2, x0 + edge.labelW, y + labelLH / 2])
  })
  return { boxes: placed.boxes, edges, bbox: bounds(parts) }
}

export function layoutFlow(props, width, theme) {
  const graph = prepare(props, theme)
  if (!graph) return null
  const avail = width - MARGIN * 2
  let result = null
  for (const factor of [0.62, 0.5, 0.42, 0.36]) {
    const next = attempt(graph, Math.min(width * factor, 230), width, theme)
    if (!result || next.bbox.width < result.bbox.width) result = next
    if (next.bbox.width <= avail) {
      result = next
      break
    }
  }
  const scale = Math.min(1, avail / result.bbox.width)
  return {
    ...result,
    scale,
    offsetX: (width - result.bbox.width * scale) / 2 - result.bbox.minX * scale,
    offsetY: MARGIN - result.bbox.minY * scale,
    height: result.bbox.height * scale + MARGIN * 2,
  }
}
