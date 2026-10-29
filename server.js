const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sprístupnenie súborov zo zložky public
app.use(express.static(path.join(__dirname, 'public')));

let currentGameState = null;
let currentQuestionsDB = null;

io.on('connection', (socket) => {
    console.log('🔌 Zariadenie pripojené:', socket.id);

    // Odošle aktuálny stav novopripojenému zariadeniu
    if (currentGameState) {
        socket.emit('game_message', {
            type: 'UPDATE_GAME_STATE',
            state: currentGameState,
            questions: currentQuestionsDB
        });
    }

    // Preposielanie správ medzi mobilom a PC
    socket.on('game_message', (data) => {
        if (data.type === 'UPDATE_GAME_STATE') {
            currentGameState = data.state;
            if (data.questions) currentQuestionsDB = data.questions;
        }
        socket.broadcast.emit('game_message', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Zariadenie odpojené:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SERVER BEŽÍ!`);
    console.log(`--------------------------------------------------`);
    console.log(`📺 Na PC (projektor) otvorte: http://localhost:${PORT}?role=divaci`);
    console.log(`🎙️ Na mobile (na rovnakej Wi-Fi) otvorte vašu IP s portom 3000`);
    console.log(`==================================================\n`);
});