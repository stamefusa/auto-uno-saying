import { useCallback, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useFrameCapture } from '../hooks/useFrameCapture'
import { useCardCount } from '../hooks/useCardCount'
import { useUnoDetect } from '../hooks/useUnoDetect'
import { useUnoAudio } from '../hooks/useUnoAudio'
import { GuideFrame } from '../components/GuideFrame'
import { ModeSelect } from '../components/ModeSelect'
import type { UnoMode } from '../types/mode'

// シード付き疑似乱数（再レンダリングで値が変わらないよう定数として生成）
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const FLOW_ITEMS = Array.from({ length: 50 }, (_, i) => ({
  top:      `${seededRand(i * 3 + 0) * 95}%`,
  size:     Math.floor(seededRand(i * 3 + 1) * 18) + 14,   // 14–32px
  duration: seededRand(i * 3 + 2) * 2.0 + 2.3,             // 2.3–4.3s
  delay:    -(seededRand(i * 3 + 0) * 4.3),                 // -0 〜 -4.3s（最初から流れている）
}))

interface CameraViewProps {
  mode: UnoMode
  onBack: () => void
}

function CameraView({ mode, onBack }: CameraViewProps) {
  const [unoVisible, setUnoVisible] = useState(false)

  const { videoRef, status, errorMessage } = useCamera()
  const playAudio = useUnoAudio(mode)

  const { check, reset } = useUnoDetect(useCallback(() => {
    setUnoVisible(true)
    playAudio()
  }, [playAudio]))
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
      {status === 'active' && !unoVisible && <GuideFrame />}

      {/* モードバッジ */}
      {status === 'active' && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => { onBack(); }}
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              mode === 'super' ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'
            }`}
          >
            {mode === 'super' ? 'SUPER' : 'NORMAL'}
          </button>
        </div>
      )}

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

      {/* UNO表示（タップで消去） — 通常モード */}
      {unoVisible && mode === 'normal' && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/50"
          onClick={() => { setUnoVisible(false); reset() }}
        >
          <span
            className="text-white font-black select-none animate-uno-appear"
            style={{ fontSize: 'clamp(80px, 25vw, 180px)' }}
          >
            UNO
          </span>
        </div>
      )}

      {/* UNO表示（タップで消去） — スーパーモード */}
      {unoVisible && mode === 'super' && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer animate-uno-super-bg overflow-hidden"
          onClick={() => { setUnoVisible(false); reset() }}
        >
          {/* ニコニコ風に右から左へ流れるUNO */}
          {FLOW_ITEMS.map(({ top, size, duration, delay }, i) => (
            <span
              key={i}
              className="absolute left-0 text-yellow-300 font-black select-none whitespace-nowrap animate-uno-flow opacity-70"
              style={{
                top,
                fontSize: `${size}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            >
              UNO
            </span>
          ))}
          {/* メインUNO（スタンプ） */}
          <span
            className="relative text-white font-black select-none animate-uno-super-stamp drop-shadow-[0_0_24px_rgba(255,220,0,0.8)]"
            style={{ fontSize: 'min(38vw, 80vh)' }}
          >
            UNO
          </span>
        </div>
      )}
    </div>
  )
}

export function MainPage() {
  const [mode, setMode] = useState<UnoMode | null>(null)

  if (mode === null) {
    return <ModeSelect onSelect={setMode} />
  }

  return <CameraView mode={mode} onBack={() => setMode(null)} />
}
