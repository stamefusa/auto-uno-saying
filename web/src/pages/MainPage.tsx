import { useCallback, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useFrameCapture } from '../hooks/useFrameCapture'
import { useCardCount } from '../hooks/useCardCount'
import { useUnoDetect } from '../hooks/useUnoDetect'
import { GuideFrame } from '../components/GuideFrame'

export function MainPage() {
  const { videoRef, status, errorMessage } = useCamera()
  const [unoVisible, setUnoVisible] = useState(false)

  const handleUno = useCallback(() => setUnoVisible(true), [])
  const check = useUnoDetect(handleUno)
  const { onFrame } = useCardCount(check)

  useFrameCapture(videoRef, status === 'active', onFrame)

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
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
        <div className="relative z-10 m-4 mt-20 bg-red-600 text-white text-center px-6 py-4 rounded-xl">
          <p className="font-bold">カメラエラー</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      )}

      {/* 起動中 */}
      {status === 'requesting' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-white">カメラを起動中...</p>
        </div>
      )}

      {/* UNO表示（タップで消去） */}
      {unoVisible && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          onClick={() => setUnoVisible(false)}
        >
          <span className="text-white font-black select-none"
            style={{ fontSize: 'clamp(80px, 25vw, 180px)' }}>
            UNO
          </span>
        </div>
      )}
    </div>
  )
}
