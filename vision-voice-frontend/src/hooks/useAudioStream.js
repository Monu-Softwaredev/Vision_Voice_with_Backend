// src/hooks/useAudioStream.js
import { useRef, useCallback } from 'react'

export default function useAudioStream({ onResult, setStatus }) {
  const socketRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const startListening = useCallback(async () => {
    setStatus('Connecting to Node.js server...')
    
    // Connects to the local Node backend we are about to build
    socketRef.current = new WebSocket('ws://localhost:8080')

    socketRef.current.onopen = async () => {
      setStatus('Listening (WebRTC)...')
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        streamRef.current = stream

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(event.data) // Send raw bytes to Node
          }
        }
        mediaRecorder.start(250) // Send chunk every 250ms
      } catch (err) {
        console.error("Mic access denied:", err)
        setStatus("Error: Microphone access denied.")
      }
    }

    socketRef.current.onmessage = (event) => {
      // Receive transcribed text back from Node
      onResult(event.data) 
    }
  }, [onResult, setStatus])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (socketRef.current) socketRef.current.close()
  }, [])

  return { startListening, stopListening }
}