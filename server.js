import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app  = express();
const http = createServer(app);
const io   = new Server(http, {
  cors: { origin: '*' },
});

// rooms : Map<code, { host: socketId, guest: socketId|null }>
const rooms = new Map();

function generateCode() {
  // Caractères sans ambiguïté (0/O, 1/I/L exclus)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

io.on('connection', socket => {

  socket.on('create-room', () => {
    let code;
    do { code = generateCode(); } while (rooms.has(code));
    rooms.set(code, { host: socket.id, guest: null });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('room-created', { code });
  });

  socket.on('join-room', ({ code }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('room-error', { message: 'Code invalide.' });
      return;
    }
    if (room.guest !== null) {
      socket.emit('room-error', { message: 'Partie déjà complète.' });
      return;
    }
    room.guest = socket.id;
    socket.join(code);
    socket.data.roomCode = code;

    // Notifie les deux joueurs simultanément
    socket.emit('game-start', { yourRole: 'bleu' });
    io.to(room.host).emit('game-start', { yourRole: 'rouge' });
  });

  socket.on('move', payload => {
    const code = socket.data.roomCode;
    if (code) socket.to(code).emit('opponent-move', payload);
  });

  socket.on('leave-room', () => cleanup(socket));
  socket.on('disconnect', () => cleanup(socket));
});

function cleanup(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  socket.to(code).emit('opponent-left');
  rooms.delete(code);
  socket.leave(code);
  socket.data.roomCode = null;
}

const PORT = process.env.PORT || 3001;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Qawale en écoute sur le port ${PORT}`);
});
