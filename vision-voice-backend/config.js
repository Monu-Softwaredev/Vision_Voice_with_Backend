// backend/config.js

module.exports = {
    PORT: 8080,
    DEEPGRAM_URL: 'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&endpointing=300&keepalive=true',
    
    // Circuit Breaker Settings
    MAX_FAILURES: 3,
    COOLDOWN_PERIOD: 10000,
    
    // Finite State Machine States
    STATES: {
        DISCONNECTED: 'DISCONNECTED',
        CONNECTING: 'CONNECTING',
        READY: 'READY',
        CIRCUIT_OPEN: 'CIRCUIT_OPEN'
    }
};