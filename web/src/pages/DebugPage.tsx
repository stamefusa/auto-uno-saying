import { useRef } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useFrameCapture } from '../hooks/useFrameCapture'
import { useCardCount } from '../hooks/useCardCount'
import { usePersistedParams } from '../hooks/usePersistedParams'
import { GuideFrame } from '../components/GuideFrame'
import { DebugOverlay } from '../components/DebugOverlay'
import { DEFAULT_PARAMS, type CardDetectParams } from '../lib/cardCounter'

const RATIO_SLIDERS: {
  key: 'ratioNone' | 'ratioSingle'
  label: string
  min: number
  max: number
}[] = [
  { key: 'ratioNone',   label: 'なし上限',  min: 0, max: 20 },
  { key: 'ratioSingle', label: '1枚上限',   min: 0, max: 50 },
]

export function DebugPage() {
  const [params, setParams] = usePersistedParams()
  const { videoRef, status, errorMessage } = useCamera()
  const debugCanvasRef = useRef<HTMLCanvasElement>(null)
  const { cardState, onFrame } = useCardCount(undefined, debugCanvasRef, params)

  useFrameCapture(videoRef, status === 'active', onFrame)

  const stateLabel: Record<typeof cardState, string> = {
    none: 'カードなし',
    single: '1枚',
    multiple: '複数枚',
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* カメラプレビュー（本番と同じ全画面） */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover absolute inset-0"
      />

      {status === 'active' && <GuideFrame />}
      {status === 'active' && <DebugOverlay ref={debugCanvasRef} />}

      {/* エラー / 起動中 */}
      {(status === 'denied' || status === 'error') && (
        <div className="relative z-10 m-4 mt-20 bg-red-600 text-white text-center px-6 py-4 rounded-xl">
          <p className="font-bold">カメラエラー</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      )}
      {status === 'requesting' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-white">カメラを起動中...</p>
        </div>
      )}

      {/* 上部オーバーレイ：スライダー + ステータス */}
      {status === 'active' && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/70 px-4 pt-3 pb-3 space-y-2">
          {/* ヘッダ行 */}
          <div className="flex items-center justify-between">
            <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded">DEBUG</span>
            <span className="text-xs font-mono text-white/80">手札: {stateLabel[cardState]}</span>
            <button
              onClick={() => setParams(DEFAULT_PARAMS)}
              className="text-xs text-gray-400 underline"
            >
              リセット
            </button>
          </div>

          {/* ratioNone / ratioSingle スライダー */}
          {RATIO_SLIDERS.map(({ key, label, min, max }) => {
            const pctVal = params[key] * 100
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-300 w-16 shrink-0">{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={0.1}
                  value={pctVal}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setParams((prev: CardDetectParams) => ({ ...prev, [key]: v / 100 }))
                  }}
                  className="flex-1 accent-yellow-400"
                />
                <span className="text-xs font-mono text-yellow-400 w-12 text-right shrink-0">
                  {pctVal.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
