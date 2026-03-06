import { useRef } from 'react'
import { useCamera } from './hooks/useCamera'
import { useFrameCapture } from './hooks/useFrameCapture'
import { useCardCount } from './hooks/useCardCount'
import { GuideFrame } from './components/GuideFrame'
import { DebugOverlay } from './components/DebugOverlay'

function App() {
  const { videoRef, status, errorMessage } = useCamera()
  const debugCanvasRef = useRef<HTMLCanvasElement>(null)
  const { cardState, onFrame } = useCardCount(debugCanvasRef)

  const stateLabel: Record<typeof cardState, string> = {
    none: 'カードなし',
    single: '1枚',
    multiple: '複数枚',
  }

  useFrameCapture(videoRef, status === 'active', onFrame)

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      {/* カメラプレビュー */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover absolute inset-0"
      />

      {/* 手札ガイド枠 */}
      {status === 'active' && <GuideFrame />}

      {/* デバッグオーバーレイ */}
      {status === 'active' && <DebugOverlay ref={debugCanvasRef} />}

      {/* エラー表示 */}
      {(status === 'denied' || status === 'error') && (
        <div className="relative z-10 bg-red-600 text-white text-center px-6 py-4 rounded-xl mx-4">
          <p className="font-bold text-lg">カメラエラー</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      )}

      {/* 起動中表示 */}
      {status === 'requesting' && (
        <div className="relative z-10 text-white text-center">
          <p className="text-lg">カメラを起動中...</p>
        </div>
      )}

      {/* カード状態表示 */}
      {status === 'active' && (
        <div className="absolute top-4 left-0 right-0 z-10 text-center">
          <span className="bg-black/60 text-white text-sm px-4 py-1 rounded-full">
            手札: {stateLabel[cardState]}
          </span>
        </div>
      )}
    </div>
  )
}

export default App
