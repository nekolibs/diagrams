import { useEffect, useRef, useState } from 'react'

export function WidthMeasurer({ width: fixedWidth, children }) {
  const ref = useRef(null)
  const [measured, setMeasured] = useState(0)
  const isFixed = fixedWidth > 0

  useEffect(() => {
    if (isFixed || !ref.current) return
    const element = ref.current
    const update = (next) => setMeasured((prev) => (Math.abs(prev - next) < 1 ? prev : next))
    update(Math.floor(element.getBoundingClientRect().width))
    const observer = new ResizeObserver((entries) => update(Math.floor(entries[0].contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [isFixed])

  const width = isFixed ? fixedWidth : measured

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'stretch',
        width: isFixed ? fixedWidth : '100%',
        minWidth: 0,
      }}
    >
      {width > 0 && children(width)}
    </div>
  )
}
