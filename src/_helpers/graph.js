import { itemDescription, itemLabel, toList, toText } from './items'

export function normalizeGraph({ nodes, edges, links, connections }, { chainWhenNoEdges = false } = {}) {
  const list = []
  const byId = {}
  const byLabel = {}

  const addNode = (raw) => {
    const data = raw && typeof raw === 'object' ? raw : {}
    const label = itemLabel(raw)
    const id = toText(data.id) || label
    if (!id || byId[id]) return byId[id]
    const node = { ...data, id, label: label || id, description: itemDescription(raw) }
    byId[id] = node
    if (node.label) byLabel[node.label.toLowerCase()] = node
    list.push(node)
    return node
  }

  toList(nodes).forEach(addNode)

  const resolve = (ref) => {
    const text = toText(typeof ref === 'object' ? ref?.id ?? itemLabel(ref) : ref)
    if (!text) return null
    return byId[text] || byLabel[text.toLowerCase()] || addNode(text)
  }

  const rawEdges = [...toList(edges || links || connections)]
  list.slice().forEach((node) => {
    const next = node.next ?? node.to
    toList(Array.isArray(next) ? next : next != null ? [next] : []).forEach((target) => {
      rawEdges.push(typeof target === 'object' ? { ...target, from: node.id } : { from: node.id, to: target })
    })
  })

  const edgeList = rawEdges
    .map((edge) => {
      const from = resolve(edge?.from ?? edge?.source)
      const to = resolve(edge?.to ?? edge?.target)
      if (!from || !to) return null
      return { ...edge, from: from.id, to: to.id, label: itemLabel(edge) }
    })
    .filter(Boolean)

  if (!edgeList.length && chainWhenNoEdges) {
    for (let i = 1; i < list.length; i++) edgeList.push({ from: list[i - 1].id, to: list[i].id, label: '' })
  }

  return { nodes: list, edges: edgeList }
}

export function findBackEdges(nodes, edges) {
  const out = {}
  nodes.forEach((node) => (out[node.id] = []))
  edges.forEach((edge, index) => out[edge.from].push({ to: edge.to, index }))
  const indeg = {}
  edges.forEach((edge) => (indeg[edge.to] = (indeg[edge.to] || 0) + 1))
  const state = {}
  const back = new Set()

  const visit = (id) => {
    state[id] = 1
    out[id].forEach(({ to, index }) => {
      if (state[to] === 1) back.add(index)
      else if (!state[to]) visit(to)
    })
    state[id] = 2
  }

  nodes.filter((node) => !indeg[node.id]).forEach((node) => !state[node.id] && visit(node.id))
  nodes.forEach((node) => !state[node.id] && visit(node.id))
  return back
}
