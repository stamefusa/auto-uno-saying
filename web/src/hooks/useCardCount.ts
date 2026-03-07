import { useState, useCallback } from 'react'
import { detectCards, drawDebugOverlay, DEFAULT_PARAMS, type CardState, type CardDetectParams } from '../lib/cardCounter'

export function useCardCount(
  onCardState?: (state: CardState) => void,
  debugCanvasRef?: React.RefObject<HTMLCanvasElement | null>,
  params: CardDetectParams = DEFAULT_PARAMS,
) {
  const [cardState, setCardState] = useState<CardState>('none')

  const onFrame = useCallback((canvas: HTMLCanvasElement) => {
    const { state } = detectCards(canvas, params)
    setCardState(state)
    onCardState?.(state)
    if (debugCanvasRef?.current) {
      drawDebugOverlay(canvas, debugCanvasRef.current, params)
    }
  }, [onCardState, debugCanvasRef, params])

  return { cardState, onFrame }
}
