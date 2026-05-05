// import React, { useState, useEffect, useRef, useCallback } from 'react';

// const VideoAssistant = () => {
//     // --- 1. DOM & State Hooks ---
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);
//     const streamRef = useRef(null); // To store the MediaStream
//     const recognitionRef = useRef(null); // To store the SpeechRecognition object
//     const synthRef = useRef(window.speechSynthesis);

//     const [isAssistantActive, setIsAssistantActive] = useState(false);
//     const [statusText, setStatusText] = useState("Click 'Start' to begin...");
//     const [responseText, setResponseText] = useState("");
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);

//     // --- 2. API Configuration (The secure backend endpoint) ---
//     const apiUrl = 'http://localhost:3001/api/gemini'; // Matches Express server URL

//     // --- 3. Speech Synthesis (Text-to-Speech) Logic ---
//     const speak = useCallback((text) => {
//         if (synthRef.current.speaking) {
//             synthRef.current.cancel(); // Cancel previous speech
//         }
        
//         const utterance = new SpeechSynthesisUtterance(text);
        
//         utterance.onstart = () => {
//             setIsSpeaking(true);
//             // Stop listening when speech starts
//             if (recognitionRef.current && isRecognitionRunning) {
//                 recognitionRef.current.stop();
//                 setIsRecognitionRunning(false);
//             }
//         };

//         utterance.onend = () => {
//             setIsSpeaking(false);
//             // Restart listening after speech finishes
//             if (isAssistantActive) {
//                 // Short delay to avoid race condition/overload
//                 setTimeout(() => {
//                     startListening();
//                 }, 100);
//             }
//         };

//         utterance.onerror = (event) => {
//             console.error("Speech synthesis error:", event.error);
//             setIsSpeaking(false);
//             // Fallback to restart listening
//             if (isAssistantActive) {
//                 startListening();
//             }
//         };
        
//         synthRef.current.speak(utterance);
//     }, [isAssistantActive, isRecognitionRunning]);

//     // --- 4. Capture Frame Logic ---
//     const captureFrame = useCallback(() => {
//         try {
//             const video = videoRef.current;
//             const canvas = canvasRef.current;
            
//             if (!video || !canvas || video.videoWidth === 0) return null;

//             const context = canvas.getContext('2d');
//             canvas.width = video.videoWidth;
//             canvas.height = video.videoHeight;

//             context.drawImage(video, 0, 0, canvas.width, canvas.height);

//             // Convert canvas image to Data URL (base64)
//             return canvas.toDataURL('image/jpeg', 0.7); 
//         } catch (err) {
//             console.error("Error capturing frame:", err);
//             return null;
//         }
//     }, []);

//     // --- 5. Gemini API Call Logic ---
//     const getGeminiResponse = useCallback(async (text, base64ImageData) => {
//         if (!isAssistantActive) return;

//         setStatusText("Thinking...");
        
//         try {
//             const response = await fetch(apiUrl, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ text, base64ImageData })
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//             }

//             const result = await response.json();
//             const responseText = result.responseText;
            
//             setResponseText(responseText);
//             speak(responseText);

//         } catch (error) {
//             console.error('Error calling Gemini API:', error);
//             setStatusText("Error connecting to AI. Listening again...");
//             // onend event of speak() or an error will handle the restart, 
//             // but if the fetch fails before speak is called, we restart manually:
//             if (!isSpeaking) {
//                  startListening(); 
//             }
//         }
//     }, [isAssistantActive, speak, isSpeaking]);


//     // --- 6. Speech Recognition (Speech-to-Text) Logic ---
//     const startListening = useCallback(() => {
//         if (isAssistantActive && recognitionRef.current && !isSpeaking && !isRecognitionRunning) {
//             setStatusText("Listening...");
//             try {
//                 recognitionRef.current.start();
//                 setIsRecognitionRunning(true);
//             } catch (e) {
//                 console.warn("Recognition start error (often safe to ignore):", e);
//             }
//         }
//     }, [isAssistantActive, isSpeaking, isRecognitionRunning]);

//     // Initialise Speech Recognition (once)
//     useEffect(() => {
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//         if (SpeechRecognition) {
//             recognitionRef.current = new SpeechRecognition();
//             const recognition = recognitionRef.current;

//             recognition.continuous = false;
//             recognition.interimResults = false;
//             recognition.lang = 'en-US';

//             recognition.onresult = (event) => {
//                 const transcript = event.results[0][0].transcript;
//                 setStatusText(`Heard: "${transcript}". Processing...`);
//                 setResponseText(""); 
                
//                 const base64ImageData = captureFrame();
//                 if (base64ImageData) {
//                     getGeminiResponse(transcript, base64ImageData);
//                 } else {
//                     speak("I couldn't capture the video frame. Please try again.");
//                 }
//             };

//             recognition.onerror = (event) => {
//                 setIsRecognitionRunning(false);
//                 if (event.error !== 'aborted') {
//                     console.error("Speech recognition error:", event.error);
//                     setStatusText("Speech error. Listening again..."); 
//                 }
//             };
            
//             recognition.onend = () => {
//                 setIsRecognitionRunning(false);
//                 // The main loop logic, checks state before restarting
//                 if (isAssistantActive && !isSpeaking) {
//                     startListening();
//                 }
//             };
//         } else {
//             setStatusText("Sorry, your browser doesn't support speech recognition.");
//         }
        
//         // Cleanup function
//         return () => {
//             if (recognitionRef.current) {
//                 recognitionRef.current.stop();
//             }
//         };
//     }, [captureFrame, getGeminiResponse, speak, isAssistantActive]);


//     // --- 7. Main Control Functions ---
//     const startApp = async () => {
//         if (isAssistantActive) return;

//         setStatusText("Requesting permissions...");
//         try {
//             // Get camera (rear preferred) and audio access
//             const newStream = await navigator.mediaDevices.getUserMedia({ 
//                 video: { facingMode: 'environment' }, 
//                 audio: true 
//             });
            
//             streamRef.current = newStream;
//             videoRef.current.srcObject = newStream;
//             await videoRef.current.play(); 
            
//             // Update state
//             setIsAssistantActive(true);
//             setStatusText("Assistant is Active. Ready for command.");
//             speak("Hi! I'm ready. What are you looking for?");

//         } catch (err) {
//             console.error("Error accessing media devices.", err);
//             setStatusText("Error: Could not access camera or microphone.");
//             setIsAssistantActive(false); // Ensure button is re-enabled
//         }
//     };

//     const stopApp = () => {
//         if (!isAssistantActive) return;
        
//         setIsAssistantActive(false); // Stops the loop
        
//         // Stop recognition and synthesis
//         if (recognitionRef.current) {
//             recognitionRef.current.stop();
//             setIsRecognitionRunning(false);
//         }
//         if (synthRef.current) {
//             synthRef.current.cancel();
//         }

//         // Stop media stream tracks
//         if (streamRef.current) {
//             streamRef.current.getTracks().forEach(track => track.stop());
//             streamRef.current = null;
//             videoRef.current.srcObject = null;
//         }

//         // Reset UI
//         setStatusText("Click 'Start' to begin...");
//         setResponseText("");
//     };

//     // --- 8. Render UI (Tailwind CSS from main.html) ---
//     return (
//         <div className="bg-gradient-to-br from-indigo-950 via-gray-900 to-black text-white min-h-screen flex flex-col items-center justify-center p-4">
//             <div className="w-full max-w-3xl bg-gray-800/60 backdrop-blur-lg border border-white/10 rounded-3xl shadow-2xl p-6 md:p-10 space-y-8">
//                 <h1 className="text-4xl font-bold text-center text-cyan-300 tracking-tight">
//                     Gemini Visual Assistant
//                 </h1>

//                 <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video ring-1 ring-white/10">
//                     <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline></video>
//                     <canvas ref={canvasRef} className="hidden"></canvas>
//                 </div>

//                 <div className="flex justify-center space-x-4">
//                     <button 
//                         onClick={startApp}
//                         disabled={isAssistantActive || !recognitionRef.current}
//                         className={`bg-gradient-to-r ${isAssistantActive ? 'from-green-500 to-emerald-500' : 'from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'} text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out shadow-lg ${isAssistantActive ? 'shadow-green-500/30' : 'hover:shadow-cyan-500/30 transform hover:scale-105 active:scale-95'} focus:outline-none focus:ring-4 focus:ring-cyan-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed`}
//                     >
//                         {isAssistantActive ? "Assistant is Active" : "Start Assistant"}
//                     </button>
                    
//                     <button 
//                         onClick={stopApp}
//                         disabled={!isAssistantActive}
//                         className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-red-500/30 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
//                     >
//                         Stop Assistant
//                     </button>
//                 </div>

//                 <div className="space-y-4 text-center">
//                     <div id="status" className={`text-lg h-6 transition-colors duration-300 ${isAssistantActive ? (isSpeaking ? 'text-yellow-400' : 'text-green-400') : 'text-gray-400'}`}>
//                         {statusText}
//                     </div>
                    
//                     <div className="bg-gray-900/50 p-6 rounded-2xl min-h-[120px] flex items-center justify-center shadow-inner ring-1 ring-white/10">
//                         <p id="responseText" className="text-xl font-medium text-white/90 leading-relaxed">{responseText}</p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default VideoAssistant;