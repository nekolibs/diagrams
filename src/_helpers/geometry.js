export function r2(n) {
  return Math.round(n * 100) / 100
}

export function pt(p) {
  return `${r2(p.x)},${r2(p.y)}`
}

export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function polylinePath(points, radius = 0) {
  if (!points || points.length < 2) return ''
  let d = `M${pt(points[0])}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    const next = points[i + 1]
    const lenIn = distance(prev, cur)
    const lenOut = distance(cur, next)
    const rr = Math.min(radius, lenIn / 2, lenOut / 2)
    const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x)
    if (rr < 0.5 || lenIn === 0 || lenOut === 0 || Math.abs(cross) < 0.01) {
      d += ` L${pt(cur)}`
      continue
    }
    const a = { x: cur.x - ((cur.x - prev.x) / lenIn) * rr, y: cur.y - ((cur.y - prev.y) / lenIn) * rr }
    const b = { x: cur.x + ((next.x - cur.x) / lenOut) * rr, y: cur.y + ((next.y - cur.y) / lenOut) * rr }
    d += ` L${pt(a)} Q${pt(cur)} ${pt(b)}`
  }
  d += ` L${pt(points[points.length - 1])}`
  return d
}

export function arrowHeadPath(tip, from, size = 5.5, spread = 0.6) {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const p1 = { x: tip.x - size * Math.cos(angle - spread), y: tip.y - size * Math.sin(angle - spread) }
  const p2 = { x: tip.x - size * Math.cos(angle + spread), y: tip.y - size * Math.sin(angle + spread) }
  return `M${pt(p1)} L${pt(tip)} L${pt(p2)}`
}

export function polygonPoints(points) {
  return points.map(pt).join(' ')
}

export function diamondPoints(cx, cy, halfW, halfH) {
  return polygonPoints([
    { x: cx, y: cy - halfH },
    { x: cx + halfW, y: cy },
    { x: cx, y: cy + halfH },
    { x: cx - halfW, y: cy },
  ])
}

export function boxesOverlap(a, b, margin = 0) {
  return (
    Math.abs(a.x - b.x) * 2 < a.width + b.width + margin * 2 &&
    Math.abs(a.y - b.y) * 2 < a.height + b.height + margin * 2
  )
}
