// I have create a new file for speech recogination which is useAudioStream.js

// import { useRef } from 'react'


// export default function useSpeechRecognition({ onResult, setStatus }) {
// const recognitionRef = useRef(null)


// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
// if (SpeechRecognition && !recognitionRef.current) {
// const recognition = new SpeechRecognition()
// recognition.continuous = false
// recognition.interimResults = false
// recognition.lang = 'en-US'


// recognition.onresult = (event) => {
// const transcript = event.results[0][0].transcript
// onResult(transcript)
// }


// recognition.onerror = (event) => {
// if (event.error === 'aborted') return
// console.error('Speech recognition error:', event.error)
// if (event.error === 'no-speech' || event.error === 'audio-capture') {
// setStatus('Listening...')
// } else {
// setStatus('Speech error. Listening again...')
// }
// }


// recognition.onend = () => {
// // auto-restart handled externally when appropriate
// }


// recognitionRef.current = recognition
// }


// const startListening = () => {
// try {
// recognitionRef.current && recognitionRef.current.start()
// } catch (e) {
// console.warn('Recognition start error', e)
// }
// }


// const stopListening = () => {
// recognitionRef.current && recognitionRef.current.stop()
// }


// return { startListening, stopListening }
// }