import { useRef, useCallback } from 'react'
import type { CardState } from '../lib/cardCounter'

// multiple → single の遷移後、この連続フレーム数だけ single が続いたら UNO と判定
const REQUIRED_CONSECUTIVE_FRAMES = 3

/**
 * UNO判定ロジック
 *
 * フレームごとに check(cardState) を呼び出すことで連続フレームをカウントする。
 * useEffect の依存変化ではなくフレーム駆動にすることでチャタリング対策が正しく機能する。
 *
 * - `multiple → single` の遷移をトリガーに連続カウント開始
 * - REQUIRED_CONSECUTIVE_FRAMES フレーム連続で single が続いたら onUno を発火
 * - 発火後は single が続いても再発火しない（firedRef は reset() 呼び出しまで維持）
 * - single 以外になったら連続カウントのみリセット
 * - reset() でユーザーが明示的に再アームする
 */
export function useUnoDetect(onUno: () => void) {
  const prevStateRef = useRef<CardState>('none')
  const consecutiveRef = useRef(0)
  const firedRef = useRef(false)
  const onUnoRef = useRef(onUno)
  onUnoRef.current = onUno

  const check = useCallback((cardState: CardState) => {
    const prev = prevStateRef.current

    if (cardState === 'single' && !firedRef.current) {
      if (prev === 'multiple') {
        consecutiveRef.current = 1
      } else if (prev === 'single') {
        consecutiveRef.current += 1
      }

      if (consecutiveRef.current >= REQUIRED_CONSECUTIVE_FRAMES) {
        firedRef.current = true
        onUnoRef.current()
      }
    } else if (cardState !== 'single') {
      // 連続カウントはリセットするが、firedRef はユーザーの明示的なリセットまで維持する
      consecutiveRef.current = 0
    }

    prevStateRef.current = cardState
  }, [])

  // ユーザーがUNO表示を消したときに呼び出して検出を再アームする
  const reset = useCallback(() => {
    prevStateRef.current = 'none'
    consecutiveRef.current = 0
    firedRef.current = false
  }, [])

  return { check, reset }
}
