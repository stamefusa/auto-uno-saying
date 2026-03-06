import { useCallback } from 'react'
import { useCamera } from './hooks/useCamera'
import { useFrameCapture } from './hooks/useFrameCapture'
import { GuideFrame } from './components/GuideFrame'

function App() {
  const { videoRef, status, errorMessage } = useCamera()

  const handleFrame = useCallback((_canvas: HTMLCanvasElement) => {
    // T07 で OpenCV.js による枚数推定に差し替える
  }, [])

  useFrameCapture(videoRef, status === 'active', handleFrame)

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
    </div>
  )
}

export default App
