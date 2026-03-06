import { useState, useCallback } from 'react'
import { detectCards, type CardState } from '../lib/cardCounter'
import { drawDebugOverlay } from '../lib/cardCounter'

export function useCardCount(debugCanvasRef?: React.RefObject<HTMLCanvasElement | null>) {
  const [cardState, setCardState] = useState<CardState>('none')

  const onFrame = useCallback((canvas: HTMLCanvasElement) => {
    const { state } = detectCards(canvas)
    setCardState(state)

    if (debugCanvasRef?.current) {
      drawDebugOverlay(canvas, debugCanvasRef.current)
    }
  }, [debugCanvasRef])

  return { cardState, onFrame }
}
