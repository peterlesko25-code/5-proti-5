const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Sprístupnenie statických súborov zo zložky 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Objekt na uchovávanie stavu hier pre jednotlivé miestnosti (roomId)
const roomStates = {};

io.on('connection', (socket) => {
  console.log('🔌 Nové zariadenie sa pripojilo:', socket.id);

  // Zariadenie sa pripojí do konkrétnej miestnosti
  socket.on('join_room', (roomId) => {
    // Opustenie predchádzajúcej miestnosti, ak v nejakej zariadenie bolo
    if (socket.roomId) {
      socket.leave(socket.roomId);
    }

    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`👤 Zariadenie ${socket.id} vstúpilo do miestnosti: [ ${roomId} ]`);

    // Ak už v danej miestnosti beží hra, pošleme jej aktuálny stav novopripojenému zariadeniu
    if (roomStates[roomId]) {
      socket.emit('game_message', {
        type: 'UPDATE_GAME_STATE',
        state: roomStates[roomId].state,
        questions: roomStates[roomId].questions
      });
    }
  });

  // Preposielanie správ výhradne v rámci rovnakej miestnosti
  socket.on('game_message', (data) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    if (!roomStates[roomId]) {
      roomStates[roomId] = {};
    }

    // Aktualizácia stavu miestnosti na serveri
    if (data.type === 'UPDATE_GAME_STATE') {
      roomStates[roomId].state = data.state;
      if (data.questions) {
        roomStates[roomId].questions = data.questions;
      }
    }

    // Preposlanie správy všetkým OSTATNÝM zariadeniam v rovnakej miestnosti
    socket.to(roomId).emit('game_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Zariadenie sa odpojilo:', socket.id);
  });
});

// Dynamický port pre cloudové služby (Render.com) alebo 3000 pre lokálne spustenie
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🚀 5 PROTI 5 SERVER BEŽÍ NA PORTE ${PORT}`);
  console.log(`==================================================\n`);
});
