import { useMemo } from 'react'

import { useTheme as useUITheme } from '@neko-os/ui'

import { mixColors, resolveColor, withAlpha } from './_helpers/colors'

const PALETTE_KEYS = ['blue', 'green', 'orange', 'purple', 'cyan', 'pink', 'indigo', 'red', 'yellow', 'brown']

function fontSizeOf(texts, key, fallback) {
  return texts?.[key]?.fontSize || fallback
}

export function buildDiagramThemeFromUI(uiTheme, { bg } = {}) {
  const colors = uiTheme?.colors || {}
  const texts = uiTheme?.texts || {}
  const p = fontSizeOf(texts, 'p', 14)
  const sm = fontSizeOf(texts, 'sm', 12)
  const xs = fontSizeOf(texts, 'xs', 10)
  const surface = resolveColor(colors, bg, colors.overlayBG || '#FFFFFF')
  const palette = PALETTE_KEYS.map((key) => colors[key]).filter(Boolean)

  return {
    colors,
    spaces: uiTheme?.spaces || {},
    radius: uiTheme?.radius || {},
    surface,
    primary: colors.primary,
    text: colors.text,
    text2: colors.text2,
    text3: colors.text3,
    text4: colors.text4,
    divider: colors.divider,
    line: colors.text4,
    onFill: colors.white || '#FFFFFF',
    palette,
    fonts: {
      item: p,
      label: Math.round((p + sm) / 2),
      text: sm,
      small: Math.round((sm + xs) / 2),
      value: fontSizeOf(texts, 'h4', 22),
    },
    color: (value, fallback) => resolveColor(colors, value, fallback),
    paletteColor: (index) => palette[index % palette.length],
    tint: (color, amount) => mixColors(surface, color, amount),
    fade: (color, alpha) => withAlpha(color, alpha),
  }
}

export function useDiagramTheme(bg) {
  const uiTheme = useUITheme()
  return useMemo(() => buildDiagramThemeFromUI(uiTheme, { bg }), [uiTheme, bg])
}
