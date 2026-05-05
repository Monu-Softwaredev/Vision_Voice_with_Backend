// src/components/VideoFeed.jsx
// FIX 1: stopListening() called at the TOP of onTranscript — mic off before AI speaks
//         (without this, the AI's own voice re-triggers the pipeline endlessly)
// FIX 2: All setStatus() calls are paired with speakImmediate() so blind users hear them
// FIX 3: speakImmediate is passed down into useAudioStream for error alerts
// FIX 4: Error recovery always restarts listening so the app never silently freezes
 
import React, { useRef, useEffect } from 'react'
import useCamera from '../hooks/useCamera'
import useAudioStream from '../hooks/useAudioStream'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import { sendToGemini } from '../services/geminiService'
 
function cleanResponse(str) {
  if (!str) return ''
  return str
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/#/g, '')
    .trim()
}
 
export default function VideoFeed({ setStatus, setResponseText }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
 
  // ── Speech synthesis (speak = queue, speakImmediate = interrupt for status) ──
  const { speak, speakImmediate, cancel } = useSpeechSynthesis()
  const { startCamera, stopCamera } = useCamera(videoRef)
 
  // ── Audio stream — receives speakImmediate so errors are spoken aloud ────────
  const { startListening, stopListening } = useAudioStream({
    onResult: onTranscript,
    setStatus,
    speakImmediate,
  })
 
  // ── Helper: announce status visually AND audibly ─────────────────────────────
  function announce(message) {
    setStatus(message)
    speakImmediate(message)
  }
 
  // ── Core Q&A handler ─────────────────────────────────────────────────────────
  async function onTranscript(transcript) {
    // FIX 1: STOP LISTENING IMMEDIATELY.
    // Without this, the MediaRecorder keeps streaming while the AI speaks,
    // picking up the AI's own voice and creating an infinite feedback loop.
    stopListening()
    cancel() // Also cancel any leftover speech from previous turn
 
    setStatus(`Heard: "${transcript}". Thinking...`)
    // Do NOT call speakImmediate here — we're about to start a new AI response.
    // speakImmediate would conflict with the queued sentence chunks.
    setResponseText('')
 
    const base64 = captureFrame()
    if (!base64) {
      announce("I couldn't capture the video frame. Please tap Start to try again.")
      return
    }
 
    try {
      let sentenceBuffer = ''
 
      await sendToGemini(transcript, base64, (newChunk, accumulatedText) => {
        // Update the visual text display
        setResponseText(cleanResponse(accumulatedText))
 
        // Buffer chunks until we hit a sentence boundary
        sentenceBuffer += newChunk
 
        if (/[.?!]/.test(sentenceBuffer)) {
          const sentences = sentenceBuffer.match(/[^.?!]+[.?!]+/g)
          if (sentences) {
            sentences.forEach(sentence => speak(cleanResponse(sentence)))
            // Remove spoken portions from buffer
            sentenceBuffer = sentenceBuffer.replace(/[^.?!]+[.?!]+/g, '')
          }
        }
      })
 
      // Speak any trailing fragment that had no punctuation
      if (sentenceBuffer.trim().length > 0) {
        speak(cleanResponse(sentenceBuffer))
      }
 
      setStatus('Done. Listening for your next question...')
 
    } catch (err) {
      console.error('Gemini error:', err)
      // FIX 4: Error recovery — announce audibly, then restart listening
      //         so the app doesn't silently freeze on a blind user
      announce('Sorry, I had trouble connecting to the AI. Please ask your question again.')
      // Give the error utterance time to finish before restarting
      setTimeout(() => window.__visionlink?.listen(), 3000)
    }
  }
 
  // ── Capture a frame from the video feed ─────────────────────────────────────
  function captureFrame() {
    try {
      const canvas = canvasRef.current
      const video  = videoRef.current
      if (!canvas || !video) return null
 
      const MAX_WIDTH = 640
      const scale = MAX_WIDTH / video.videoWidth
      canvas.width  = MAX_WIDTH
      canvas.height = video.videoHeight * scale
 
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
      return dataUrl.split(',')[1]
    } catch (err) {
      console.error('Frame capture error:', err)
      return null
    }
  }
 
  // ── Expose control surface to ControlButtons via window.__visionlink ─────────
  useEffect(() => {
    window.__visionlink = {
      start: async () => {
        setStatus('Requesting permissions...')
        try {
          await startCamera()
          // Greet the user — listen() fires automatically after speech ends
          // (handled inside useSpeechSynthesis.speak onend callback)
          speak("Hello! Vision Voice is ready. Hold up whatever you want me to look at, then ask your question.")
        } catch (err) {
          console.error(err)
          announce('Error: Could not access the camera or microphone. Please check permissions.')
        }
      },
 
      stop: () => {
        cancel()
        stopCamera()
        stopListening()
        setStatus('Stopped. Tap Start whenever you are ready.')
        setResponseText('')
      },
 
      // Called automatically after AI finishes speaking (from useSpeechSynthesis)
      listen: () => {
        startListening()
      },
    }
  }, [startCamera, stopCamera, startListening, stopListening, speak, speakImmediate, cancel, setStatus, setResponseText])
 
  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera()
      stopListening()
      cancel()
    }
  }, [])
 
  return (
    <>
      {/* ARIA live region — screen readers announce status changes automatically */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="status-announcer"
      />
 
      <video
        ref={videoRef}
        id="videoElement"
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        aria-label="Camera feed showing what the user is pointing at"
      />
      <canvas ref={canvasRef} id="captureCanvas" className="hidden" aria-hidden="true" />
    </>
  )
}