import { useRef } from 'react'

export default function useSpeechSynthesis() {
  const synthRef = useRef(window.speechSynthesis)

  function speak(text, onEnd) {
    if (!synthRef.current) return

    // We removed the cancel() call here so sentences can queue up sequentially
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.onstart = () => { }

    utterance.onend = () => {
      // ONLY resume listening if the AI is completely done talking 
      // (no more sentences in the pending queue)
      if (!synthRef.current.pending && !synthRef.current.speaking) {
        if (window.__visionlink && window.__visionlink.listen) {
          window.__visionlink.listen()
        }
        if (onEnd) onEnd()
      }
    }

    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e)
      if (onEnd) onEnd()
    }

    synthRef.current.speak(utterance)
  }

  function cancel() {
    synthRef.current && synthRef.current.cancel()
  }

  return { speak, cancel }
}