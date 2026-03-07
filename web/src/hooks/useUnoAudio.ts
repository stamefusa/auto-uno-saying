import { useRef, useCallback } from 'react'
import type { UnoMode } from '../types/mode'

const AUDIO_SRC: Record<UnoMode, string> = {
  normal: '/audio/simple.mp3',
  super: '/audio/super.mp3',
}

export function useUnoAudio(mode: UnoMode) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    // 前の再生を止めてから再生
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    const audio = new Audio(AUDIO_SRC[mode])
    audioRef.current = audio
    audio.play().catch(() => {
      // autoplay policy などで再生できない場合は無視
    })
  }, [mode])

  return play
}
