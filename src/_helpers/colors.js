import tinycolor from 'tinycolor2'

const ALIASES = {
  grey: 'gray',
  violet: 'purple',
  teal: 'cyan',
  accent: 'primary',
  main: 'primary',
}

export function resolveColor(colors, value, fallback) {
  if (!value || typeof value !== 'string') return fallback
  const key = ALIASES[value.toLowerCase()] || value
  if (colors?.[key]) return colors[key]
  if (colors?.[key.toLowerCase()]) return colors[key.toLowerCase()]
  return tinycolor(value).isValid() ? value : fallback
}

export function mixColors(base, color, amount) {
  return tinycolor.mix(base, color, Math.round(amount * 100)).toHexString()
}

export function withAlpha(color, alpha) {
  return tinycolor(color).setAlpha(alpha).toRgbString()
}
