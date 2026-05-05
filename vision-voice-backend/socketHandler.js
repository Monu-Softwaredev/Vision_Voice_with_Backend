// backend/socketHandler.js

const WebSocket = require('ws');
const { STATES, MAX_FAILURES, COOLDOWN_PERIOD, DEEPGRAM_URL } = require('./config');

function handlePhoneConnection(ws) {
    console.log('📱 React Frontend Connected!');

    let currentState = STATES.DISCONNECTED;
    let audioBuffer = [];
    let webmHeader = null; 
    let keepAliveInterval;
    let deepgramSocket;
    
    let failedAttempts = 0;
    let isFirstConnection = true; 

    function connectToDeepgram() {
        if (currentState === STATES.CIRCUIT_OPEN) return;

        currentState = STATES.CONNECTING;
        console.log(`🔄 Spinning up Deepgram connection... (Attempt ${failedAttempts + 1}/${MAX_FAILURES})`);
        
        deepgramSocket = new WebSocket(DEEPGRAM_URL, {
            headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` }
        });

        deepgramSocket.on('open', () => {
            console.log('🎙️ Deepgram connection opened and listening!');
            currentState = STATES.READY;

            if (!isFirstConnection && webmHeader) {
                console.log('💉 Injecting saved WebM header for reconnect...');
                deepgramSocket.send(webmHeader);
            }
            isFirstConnection = false; 

            if (audioBuffer.length > 0) {
                console.log(`📦 Sending ${audioBuffer.length} saved chunks...`);
                audioBuffer.forEach(chunk => deepgramSocket.send(chunk));
                audioBuffer = []; 
            }

            if (keepAliveInterval) clearInterval(keepAliveInterval);
            keepAliveInterval = setInterval(() => {
                if (deepgramSocket.readyState === WebSocket.OPEN) {
                    deepgramSocket.send(JSON.stringify({ type: 'KeepAlive' }));
                }
            }, 10000); 
        });

        deepgramSocket.on('message', (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                if (parsed.type === "Results" && parsed.is_final) {
                    const transcript = parsed.channel.alternatives[0].transcript;
                    if (transcript) {
                        failedAttempts = 0;
                        console.log(`✅ Deepgram heard: "${transcript}"`);
                        ws.send(transcript); 
                    }
                }
            } catch (err) { }
        });

        deepgramSocket.on('error', (error) => {
            console.error('⚠️ Deepgram error:', error.message);
        });

        deepgramSocket.on('close', () => {
            console.log('⚠️ Deepgram hung up.');
            clearInterval(keepAliveInterval);

            if (currentState !== STATES.CIRCUIT_OPEN) {
                failedAttempts++;

                if (failedAttempts >= MAX_FAILURES) {
                    currentState = STATES.CIRCUIT_OPEN;
                    console.log(`🔥 CIRCUIT BREAKER TRIPPED!`);
                    console.log(`⏳ Entering cooldown for ${COOLDOWN_PERIOD / 1000} seconds...`);
                    audioBuffer = []; 
                    ws.send("System Alert: The AI speech server is taking a quick break.");

                    setTimeout(() => {
                        console.log('⏱️ Cooldown complete. Resetting Circuit Breaker.');
                        currentState = STATES.DISCONNECTED;
                        failedAttempts = 0; 
                        if (ws.readyState === WebSocket.OPEN) connectToDeepgram(); 
                    }, COOLDOWN_PERIOD);

                } else {
                    currentState = STATES.DISCONNECTED;
                    if (ws.readyState === WebSocket.OPEN) {
                        console.log('🔌 Retrying connection in 1 second...');
                        setTimeout(connectToDeepgram, 1000);
                    }
                }
            }
        });
    }

    connectToDeepgram();

    ws.on('message', (data) => {
        if (!webmHeader) {
            console.log('💾 Saved the WebM audio header!');
            webmHeader = data;
        }

        if (currentState === STATES.READY && deepgramSocket.readyState === WebSocket.OPEN) {
            deepgramSocket.send(data);
        } else if (currentState !== STATES.CIRCUIT_OPEN) {
            audioBuffer.push(data);
        }
    });

    ws.on('close', () => {
        console.log('📱 React Frontend Disconnected.');
        currentState = STATES.DISCONNECTED;
        clearInterval(keepAliveInterval);
        if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            deepgramSocket.removeAllListeners('close');
            deepgramSocket.close();
        }
    });
}

// Export the function so server.js can use it
module.exports = handlePhoneConnection;