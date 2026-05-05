// backend/server.js

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const { PORT } = require('./config');
const handlePhoneConnection = require('./socketHandler');

const app = express();

const server = app.listen(PORT, () => {
    console.log(`🚀 Backend is running on port ${PORT}`);
});

// Start the WebSocket Server
const wss = new WebSocket.Server({ server });

// When a phone connects, hand the connection over to our specialized module!
wss.on('connection', (ws) => {
    handlePhoneConnection(ws);
});