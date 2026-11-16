export function toText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function pickText(item, keys) {
  for (const key of keys) {
    const text = toText(item?.[key])
    if (text) return text
  }
  return ''
}

export function itemLabel(item) {
  if (typeof item === 'string' || typeof item === 'number') return toText(item)
  return pickText(item, ['label', 'title', 'name', 'text'])
}

export function itemDescription(item) {
  if (!item || typeof item !== 'object') return ''
  return pickText(item, ['description', 'detail', 'details', 'note', 'subtitle'])
}

export function toList(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== '')
  return []
}

export function normalizeItems(list) {
  return toList(list)
    .map((item) => {
      const raw = item && typeof item === 'object' ? item : {}
      return { ...raw, label: itemLabel(item), description: itemDescription(item) }
    })
    .filter((item) => item.label || item.description)
}

export function toStringList(list) {
  return toList(list).map(itemLabel).filter(Boolean)
}

export function formatValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    try {
      return value.toLocaleString()
    } catch (e) {
      return String(value)
    }
  }
  return toText(value)
}
