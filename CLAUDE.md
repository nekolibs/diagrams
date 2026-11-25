# neko-diagrams

Cross-platform diagram library (`@neko-os/diagrams`). Works on React (web DOM), React Native and React Native Web. Same packaging and cross-platform strategy as neko-charts. Public props are documented in `README.md`.

## Rules

- **One export per diagram** (`FlowDiagram`, `VennDiagram`…). No dispatcher, no `<Diagram type>`. Apps own the type → component map, titles and spacing.
- **One folder per diagram** in `src/diagrams/<name>/`. Its `index.js` exports only the public component; layout and parts can be split into more files inside the folder.
- **Props are plain JSON** (no functions or elements), because apps pass AI-written JSON straight in. Normalize defensively: bad or partial input renders `null` or skips items, never throws.
- **Theme from neko-ui**: colors and font sizes come from `useDiagramTheme` (`DiagramTheme.js`), built from the neko-ui theme like neko-charts' `buildChartThemeFromUI`. Spacing and radius use theme tokens (`spaces.*`, `radius.*`, or modifiers like `padding="sm"`), never raw numbers.
- **Phone width first** (~280–420px). Each diagram fills its container's width and computes its own height.

## Structure

```
src/
├── index.js                 # Public exports (16 components)
├── DiagramTheme.js          # buildDiagramThemeFromUI + useDiagramTheme (colors, fonts, tint/fade, palette)
├── diagrams/<name>/         # One folder per diagram
├── parts/
│   ├── SvgDiagram.js        # Measure width → layout(props, width, theme) → render(layout) inside AbsSvg
│   ├── WidthMeasurer.js     # Web DOM: ResizeObserver (+ sync first measure)
│   ├── WidthMeasurer.native.js  # RN: onLayout
│   ├── WidthMeasurer.web.js     # RNW: re-exports .native.js
│   ├── TextLines.js         # Multi-line SVG text, vertically centered by baseline math (no dominant-baseline)
│   └── Arrow.js             # Polyline/path + open chevron head (no SVG markers)
└── _helpers/
    ├── text.js              # textWidth estimate (Helvetica table × weight factor), wrapText, balancedWrap
    ├── colors.js            # resolveColor (theme token or CSS color), mixColors, withAlpha (tinycolor2)
    ├── items.js             # Label/description aliases, list normalization, number formatting
    ├── geometry.js          # Rounded polylines, arrow heads, arcs, box/diamond boundaries
    ├── graph.js             # nodes/edges normalization (ids or labels, `next`), back-edge detection
    └── dagre.js             # runDagre wrapper (@dagrejs/dagre 1.x, CommonJS, works in Metro and Vite)
```

## Two kinds of diagrams

- **View-based** (timeline, steps, matrix, versus, stats, mindmap `tree`): neko-ui `View`/`Text`, native text wrapping. Only timeline and steps measure the width (to pick row or list).
- **SVG-based** (flow, sequence, gantt, mindmap `map`, cycle, pyramid, venn, concentric circles, funnel, fishbone, network): `SvgDiagram` measures the width, a pure `layout(props, width, theme)` function returns geometry + wrapped lines, and `render(layout, theme)` draws it with the neko-charts SVG abstractions (`AbsSvg`, `AbsG`, `AbsPath`, `AbsRect`, `AbsCircle`, `AbsLine`, `AbsPolygon`, `AbsSvgText`). Cycle and concentric add a View legend next to/below the SVG.

Text in SVG is wrapped by our own estimate (`_helpers/text.js`), so line breaks are known before drawing. The estimate was calibrated against SF Pro in Chrome (within ~2%, slightly conservative). Words are never broken unless a single word is wider than the box.

## Layout notes

- **Flow** (`diagrams/flow/`): dagre ranks and orders the main graph (TB). Loop edges are left out of dagre and routed along a side gutter, picking the side whose horizontal legs cross no box. A leaf hanging off a branching node is placed beside its parent (gallery look); it goes back into dagre if it collides or overflows. Edges are straight only for one-to-one links whose boxes share a column; a diamond exits from its side vertex when possible; forks turn `fork` (md) below the parent and merges `fork` above the child, so siblings share one bar.
  - Spacing lives in `flowSpacing`: levels `xxl` apart, more when edges carry labels (room for the tallest label + `sm` above and below); same-level boxes `xl`; side arrows label width + `md` each side + arrowhead. Boxes pad `sm`/`md`, min height `xxl`.
  - Edge labels wrap (~30% of the width, max 3 lines), sit beside the child's incoming line centered in its free segment (right side first, left if that collides or leaves the drawing), or above a side arrow / diamond side leg. Labels never overlap boxes or each other.
  - dagre doubles ranks internally: adjacent levels differ by 2 and their edges carry one dummy mid point, so "long edge" means a rank gap above 2.
  - Fit order: 4 node widths with normal gaps, then 2 compact passes (gaps at their floor, smaller min box width and side padding, tighter diamonds); scaling the drawing is the last resort (only below ~280px).
- **Network**: 2–3 `group`s → dagre with fixed ranks (`ranker: 'none'`, rank = group × 2), one column per group; same-group edges are drawn by hand (straight if adjacent, bracket otherwise). Otherwise TB and LR are both tried and the best fit wins.
- **Fishbone**: horizontal (gallery) layout up to 4 causes with short text, else a top-down layout: each cause is a tinted rounded card (palette colors without orange, which marks the problem), two per row hugging the center spine with a short angled tick into it; cards in a column share one width.
- **Timeline / steps**: a horizontal row (gallery desktop look) when every item gets a column of at least 120px (max 190px, row centered), its label fits in 2 lines and its description in 3, and no word is wider than the column (`_helpers/row.js`). Otherwise the vertical list. The connector is drawn as half-segments inside each column, not one absolute line: neko-ui `absolute` forces `zIndex` 10, which painted the line over the step numbers on web.
- **Cycle with descriptions**: when the width leaves at least 200px beside a 320px ring (plus the `xxl` gap), the ring and its legend sit side by side, centered as one group (gallery desktop look). The legend column gets an explicit width estimated from the text, so its `flex` description column never sits in a shrink-to-fit parent (that collapses on native). Otherwise the legend goes under the ring.
- **Pyramid**: text column capped at 360px. From 480px wide, the shape and its text are shifted (`translate` on the root group, like flow) so the pair is centered on its widest text line; narrower widths keep it flush left.
- **Concentric**: from 480px wide, the legend column gets an explicit width estimated from its text and the circles + legend pair is centered; narrower widths keep the legend as a `flex` column beside the circles.

## Cross-platform gotchas

- Do not put `minH`/`ratio`/fixed sizes on a View that also has padding or borders: web DOM uses content-box (size + padding) and RN uses border-box. Size an outer View and pad an inner one (see `MatrixDiagram`, `ConcentricDiagram` legend dot).
- Never set numeric `lineHeight` on Text (unitless multiplier on web, px on RN).
- SVG text is centered with `y + fontSize * 0.35`, not `dominant-baseline`/`alignmentBaseline`, so web and react-native-svg match.
- RN Web `onLayout` only fires after a rendered frame; a hidden browser tab shows nothing until it is visible. Web DOM measures synchronously on mount.

## Build

```sh
yarn build    # babel src → dist (keeps .native.js/.web.js via --copy-files), same as neko-charts
yarn watch
```

## Dependencies

- **peerDependencies**: `@neko-os/ui`, `@neko-os/charts`, `react`, `react-native`
- **dependencies**: `@dagrejs/dagre` (flow and network layout), `tinycolor2` (color mixing)
- Native consumers need `react-native-svg` (through neko-charts' abstractions)
