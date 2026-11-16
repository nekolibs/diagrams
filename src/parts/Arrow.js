import { AbsG, AbsPath } from '@neko-os/charts'

import { arrowHeadPath, polylinePath } from '../_helpers/geometry'

export function Arrow({ points, d, stroke, strokeWidth = 1.3, dashed, head = true, radius = 6, tip, tipFrom }) {
  const pathD = d || polylinePath(points, radius)
  const end = tip || points?.[points.length - 1]
  const before = tipFrom || points?.[points.length - 2]

  return (
    <AbsG>
      <AbsPath
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '4 3' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!!head && !!end && !!before && (
        <AbsPath
          d={arrowHeadPath(end, before)}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth + 0.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </AbsG>
  )
}
