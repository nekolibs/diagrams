import { useState } from 'react'
import { View } from 'react-native'

export function WidthMeasurer({ width: fixedWidth, children }) {
  const [measured, setMeasured] = useState(0)
  const isFixed = fixedWidth > 0
  const width = isFixed ? fixedWidth : measured

  return (
    <View
      style={{ alignSelf: 'stretch', width: isFixed ? fixedWidth : '100%', minWidth: 0 }}
      onLayout={(event) => {
        if (isFixed) return
        const next = Math.floor(event.nativeEvent.layout.width)
        setMeasured((prev) => (Math.abs(prev - next) < 1 ? prev : next))
      }}
    >
      {width > 0 && children(width)}
    </View>
  )
}
