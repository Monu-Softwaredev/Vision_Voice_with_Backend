import { useCallback, useRef } from 'react'

export default function useCamera(videoRef) {
  // CORRECT: Use React's official useRef hook
  const streamRef = useRef(null)

  const startCamera = useCallback(async () => {
    // MUST BE FALSE so the audio stream can use the mic!
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, 
      audio: false 
    })
    
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
    await videoRef.current.play()
  }, [videoRef])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // CORRECT: Add the '?' to safely check if it exists before stopping tracks
      streamRef.current.getTracks()?.forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [videoRef])

  // We can just return the start and stop functions now
  return { startCamera, stopCamera }
}