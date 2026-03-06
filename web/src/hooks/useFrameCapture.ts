import { useEffect, useRef } from 'react'
import { GUIDE_FRAME } from '../constants/guide'

const CAPTURE_INTERVAL_MS = 200 // 5fps

export function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onFrame: (canvas: HTMLCanvasElement) => void,
) {
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))

  useEffect(() => {
    if (!enabled) return

    const id = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

      const vw = video.videoWidth
      const vh = video.videoHeight
      if (vw === 0 || vh === 0) return

      // ガイド枠に対応するビデオ上の座標を算出
      const sx = Math.round(vw * GUIDE_FRAME.xRatio)
      const sy = Math.round(vh * GUIDE_FRAME.yRatio)
      const sw = Math.round(vw * GUIDE_FRAME.widthRatio)
      const sh = Math.round(vh * GUIDE_FRAME.heightRatio)

      const canvas = canvasRef.current
      canvas.width = sw
      canvas.height = sh

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
      onFrame(canvas)
    }, CAPTURE_INTERVAL_MS)

    return () => clearInterval(id)
  }, [enabled, videoRef, onFrame])

  return canvasRef
}
