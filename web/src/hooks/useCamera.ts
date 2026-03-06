import { useEffect, useRef, useState } from 'react'

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function startCamera() {
      setStatus('requesting')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setStatus('active')
      } catch (err) {
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
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { videoRef, status, errorMessage }
}
