import dagre from '@dagrejs/dagre'

export function runDagre({ nodes, edges, rankdir = 'TB', nodesep = 20, ranksep = 24, edgesep = 10, ranks }) {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  const fixedRanks = !!ranks
  g.setGraph({ rankdir, nodesep, ranksep, edgesep, marginx: 0, marginy: 0, ranker: fixedRanks ? 'none' : 'network-simplex' })
  g.setDefaultEdgeLabel(() => ({}))
  nodes.forEach((node) => {
    const label = { width: node.width, height: node.height }
    if (fixedRanks) label.rank = ranks[node.id] ?? 0
    g.setNode(node.id, label)
  })
  edges.forEach((edge, index) => {
    g.setEdge(
      edge.from,
      edge.to,
      {
        minlen: edge.minlen ?? 1,
        weight: edge.weight ?? 1,
        width: edge.labelWidth || 0,
        height: edge.labelHeight || 0,
        labelpos: 'c',
      },
      `e${index}`
    )
  })

  dagre.layout(g)

  const positions = {}
  nodes.forEach((node) => {
    const { x, y } = g.node(node.id)
    positions[node.id] = { x, y }
  })
  const routes = edges.map((edge, index) => {
    const data = g.edge(edge.from, edge.to, `e${index}`) || {}
    return { points: data.points || [], x: data.x, y: data.y }
  })
  const graph = g.graph()
  return { positions, routes, width: graph.width || 0, height: graph.height || 0 }
}
