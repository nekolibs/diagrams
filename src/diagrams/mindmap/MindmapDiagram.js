import { MindmapMap } from './MindmapMap'
import { MindmapTree } from './MindmapTree'

export function MindmapDiagram(props) {
  if (props.layout === 'tree') return <MindmapTree {...props} />
  return <MindmapMap {...props} />
}
