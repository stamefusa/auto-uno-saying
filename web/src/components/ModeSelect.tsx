import { useNavigate } from 'react-router-dom'
import type { UnoMode } from '../types/mode'

interface Props {
  onSelect: (mode: UnoMode) => void
}

export function ModeSelect({ onSelect }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-white text-3xl font-black tracking-widest">UNO</h1>
      <p className="text-gray-400 text-sm">モードを選択してください</p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* 通常モード */}
        <button
          onClick={() => onSelect('normal')}
          className="w-full py-5 rounded-2xl border-2 border-white text-white flex flex-col items-center gap-1 active:bg-white/10"
        >
          <span className="text-xl font-bold">通常モード</span>
          <span className="text-xs text-gray-400">UNO表示 + 音声再生</span>
        </button>

        {/* スーパーUNOアピールモード */}
        <button
          onClick={() => onSelect('super')}
          className="w-full py-5 rounded-2xl bg-yellow-400 text-black flex flex-col items-center gap-1 active:bg-yellow-300"
        >
          <span className="text-xl font-bold">スーパーUNOアピール</span>
          <span className="text-xs text-black/60">激しい演出 + ESP32連携</span>
        </button>
      </div>

      {/* デバッグモードへの遷移 */}
      <button
        onClick={() => navigate('/debug')}
        className="text-xs text-gray-600 underline mt-4"
      >
        デバッグモード
      </button>
    </div>
  )
}
