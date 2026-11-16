# Neko Diagrams

Cross-platform diagram components (react-native, react-native-web and react). Built on `@neko-os/ui` (theme, View, Text) and the SVG primitives of `@neko-os/charts`.

Every diagram is its own component and takes plain JSON props, so an AI-written JSON object can be passed straight in. Each one fills its container's width and sizes its own height. Phone width first (~280–420px).

```jsx
import { FlowDiagram } from '@neko-os/diagrams'

<FlowDiagram {...json} />
```

## Common props

| Prop | Type | Description |
|------|------|-------------|
| `bg` | theme token or color | Surface the diagram sits on, used to mix the tinted fills. Default `overlayBG` |
| `width` | number | Fixed width in px. Default: measure the container |

Colors (`color` on items) accept theme tokens (`primary`, `blue`, `green`, `orange`, `purple`, `cyan`, `red`, `pink`, `indigo`, `yellow`, `gray`) or any CSS color. Items given as plain strings are read as `{ label }`. `title`/`name`/`text` are read as `label`, and `detail`/`note` as `description`.

## Diagrams

| Component | Use for | Props |
|-----------|---------|-------|
| `TimelineDiagram` | events in date order | `items: [{ date, label, description?, color? }]` |
| `StepsDiagram` | a method done in order | `items: [{ label, description? }]` |
| `FlowDiagram` | a process with decisions and branches | `nodes: [{ id, label, type?, color? }]`, `edges: [{ from, to, label?, dashed? }]` |
| `SequenceDiagram` | who sends what to whom | `actors: [string]`, `messages: [{ from, to, label, reply? }]` |
| `GanttDiagram` | tasks and phases over time | `periods: [string] \| number`, `tasks: [{ label, start, end?, color?, milestone? }]` |
| `MindmapDiagram` | one idea and its branches | `center`, `branches: [{ label, description?, children?: [string], color? }]`, `layout?: 'map' \| 'tree'` |
| `CycleDiagram` | a loop that repeats | `items: [{ label, description? }]` (2–8), `center?` |
| `MatrixDiagram` | two axes, four quadrants | `columns: [left, right]`, `rows: [top, bottom]`, `quadrants: [4 × { label, description?, color? }]`, `items?: [{ label, x, y, color? }]` |
| `PyramidDiagram` | levels that build on each other | `items: [{ label, description? }]` (top first) |
| `VersusDiagram` | two sides compared point by point | `left: { label, description?, color? }`, `right: {…}`, `rows: [{ left, right, label? }]` |
| `VennDiagram` | where groups overlap | `sets: [{ label, description?, color? }]` (1–3), `center?`, `overlaps?: [{ sets: [a, b], label }]` |
| `ConcentricDiagram` | layers around a core idea | `items: [{ label, description? }]` (core first, 2–6) |
| `FunnelDiagram` | stages that narrow, with counts | `items: [{ label, value?, description? }]` |
| `FishboneDiagram` | the causes behind one problem | `problem`, `causes: [{ label, items: [string] }]` |
| `NetworkDiagram` | how people or ideas relate | `nodes: [{ id, label, group?, color? }]`, `edges: [{ from, to, label?, dashed? }]`, `directed?` |
| `StatsDiagram` | the key numbers from an article | `items: [{ value, label, color? }]` |

### Details

- **Flow**: `type` is `start`, `end`, `step` or `decision`. When it is missing, a label ending in `?` is a decision and a node with no incoming edge is a start. Edges may point to node `id`s or labels. A leaf that hangs off a branching node sits beside it, so the main path stays one straight column. Edges that go back up (loops) run along the side.
- **Gantt**: `start`/`end` are 1-based period numbers or period labels (`"W2"`). `end` defaults to `start`. `milestone: true` draws a diamond.
- **Matrix**: quadrants in reading order (top-left, top-right, bottom-left, bottom-right). Plotted `x` runs 0 (left) → 100 (right), `y` 0 (bottom) → 100 (top). Values from 0 to 1 also work.
- **Venn**: `overlaps[].sets` takes set labels or 0-based indexes. An overlap of all sets is used as `center`.
- **Network**: nodes with a `group` (2–3 groups) are laid out one column per group. Without groups the layout is picked to fit the width.
- **Fishbone**: up to 4 short causes use the classic sideways fish. More causes, or long ones, switch to a top-down layout that fits phones.
