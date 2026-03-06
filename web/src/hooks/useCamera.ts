import { useEffect, useRef, useState } from 'react'

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let stream: MediaStream | null = null

    async function startCamera() {
      setStatus('requesting')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' } },
          audio: false,
        })
        if (!mounted) {
          // アンマウント後に解決した場合はすぐ破棄
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setStatus('active')
      } catch (err) {
        if (!mounted) return
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setStatus('denied')
          setErrorMessage('カメラの使用が許可されていません。ブラウザの設定から許可してください。')
        } else {
          setStatus('error')
          setErrorMessage('カメラの取得に失敗しました。')
        }
      }
    }

    startCamera()

    return () => {
      mounted = false
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { videoRef, status, errorMessage }
}
