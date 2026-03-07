import { useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useFrameCapture } from '../hooks/useFrameCapture'
import { useCardCount } from '../hooks/useCardCount'
import { GuideFrame } from '../components/GuideFrame'
import { DebugOverlay } from '../components/DebugOverlay'
import { DEFAULT_PARAMS, type CardDetectParams } from '../lib/cardCounter'

const SLIDER_CONFIG: {
  key: keyof CardDetectParams
  label: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'satThreshold',        label: '彩度閾値 (satThreshold)',          min: 0,    max: 255,  step: 1   },
  { key: 'whiteSatMax',         label: '白彩度上限 (whiteSatMax)',          min: 0,    max: 255,  step: 1   },
  { key: 'whiteValMin',         label: '白輝度下限 (whiteValMin)',          min: 0,    max: 255,  step: 1   },
  { key: 'whiteNeighborRadius', label: '白隣接半径px (whiteNeighborRadius)', min: 1,    max: 50,   step: 1   },
  { key: 'ratioNone',           label: 'なし判定比率 (ratioNone)',           min: 0,    max: 0.2,  step: 0.001 },
  { key: 'ratioSingle',         label: '1枚判定比率 (ratioSingle)',          min: 0,    max: 0.5,  step: 0.001 },
]

export function DebugPage() {
  const [params, setParams] = useState<CardDetectParams>(DEFAULT_PARAMS)
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* カメラ領域 */}
      <div className="relative flex-1 bg-black overflow-hidden" style={{ minHeight: '55vh' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover absolute inset-0"
        />
        {status === 'active' && <GuideFrame />}
        {status === 'active' && <DebugOverlay ref={debugCanvasRef} />}

        {/* カード状態バッジ */}
        {status === 'active' && (
          <div className="absolute top-3 left-0 right-0 z-10 text-center">
            <span className="bg-black/70 text-white text-sm px-4 py-1 rounded-full font-mono">
              手札: {stateLabel[cardState]}
            </span>
          </div>
        )}

        {/* エラー表示 */}
        {(status === 'denied' || status === 'error') && (
          <div className="relative z-10 m-4 bg-red-600 text-white text-center px-6 py-4 rounded-xl">
            <p className="font-bold">カメラエラー</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        )}
        {status === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-white">カメラを起動中...</p>
          </div>
        )}

        {/* DEBUGラベル */}
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded">DEBUG</span>
        </div>
      </div>

      {/* スライダーパネル */}
      <div className="p-4 space-y-3 overflow-y-auto bg-gray-900">
        <p className="text-xs text-gray-400 font-mono">閾値調整（リアルタイム反映）</p>
        {SLIDER_CONFIG.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-300">{label}</span>
              <span className="text-yellow-400">{params[key]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key]}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, [key]: Number(e.target.value) }))
              }
              className="w-full accent-yellow-400"
            />
          </div>
        ))}

        {/* リセットボタン */}
        <button
          onClick={() => setParams(DEFAULT_PARAMS)}
          className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  )
}
