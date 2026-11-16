import { itemDescription, itemLabel, toList, toStringList, toText } from '../../_helpers/items'

export function normalizeMindmap({ center, root, topic, branches, items, children }) {
  const centerLabel = toText(center) || itemLabel(root) || toText(topic)
  const list = toList(branches || items || children)
    .map((branch) => {
      const raw = branch && typeof branch === 'object' ? branch : {}
      return {
        label: itemLabel(branch),
        description: itemDescription(branch),
        color: raw.color,
        children: toStringList(raw.children || raw.items || raw.points),
      }
    })
    .filter((branch) => branch.label)
  return { center: centerLabel, branches: list }
}
