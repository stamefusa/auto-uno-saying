import { useEffect, useRef } from 'react'
import { GUIDE_FRAME } from '../constants/guide'

export function GuideFrame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const w = canvas.width = canvas.offsetWidth
      const h = canvas.height = canvas.offsetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, w, h)

      const x = w * GUIDE_FRAME.xRatio
      const y = h * GUIDE_FRAME.yRatio
      const fw = w * GUIDE_FRAME.widthRatio
      const fh = h * GUIDE_FRAME.heightRatio

      // 枠外を暗くする
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.fillRect(0, 0, w, h)
      ctx.clearRect(x, y, fw, fh)

      // 枠の描画
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.setLineDash([12, 6])
      ctx.strokeRect(x, y, fw, fh)

      // コーナーアクセント
      const corner = 20
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 3
      ctx.setLineDash([])
      const corners: [number, number, number, number][] = [
        [x, y, x + corner, y],
        [x, y, x, y + corner],
        [x + fw, y, x + fw - corner, y],
        [x + fw, y, x + fw, y + corner],
        [x, y + fh, x + corner, y + fh],
        [x, y + fh, x, y + fh - corner],
        [x + fw, y + fh, x + fw - corner, y + fh],
        [x + fw, y + fh, x + fw, y + fh - corner],
      ]
      for (const [x1, y1, x2, y2] of corners) {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // ラベル
      ctx.fillStyle = '#facc15'
      ctx.font = 'bold 13px sans-serif'
      ctx.fillText('手札をここに映してください', x + 8, y - 8)
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}
