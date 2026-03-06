import { forwardRef } from 'react'
import { GUIDE_FRAME } from '../constants/guide'

export const DebugOverlay = forwardRef<HTMLCanvasElement>((_props, ref) => {
  return (
    <canvas
      ref={ref}
      className="absolute pointer-events-none"
      style={{
        left: `${GUIDE_FRAME.xRatio * 100}%`,
        top: `${GUIDE_FRAME.yRatio * 100}%`,
        width: `${GUIDE_FRAME.widthRatio * 100}%`,
        height: `${GUIDE_FRAME.heightRatio * 100}%`,
      }}
    />
  )
})
