import { io } from 'socket.io-client';
import { cellAt, cellIndex } from './board.js';
import { onPhasePlace, onPhaseSpread, demarrerPartie, retourMenu } from './game.js';
import { showLobby, showLobbyError, hideLobby, hideMenuOnline, showOnlineDisconnectMessage } from './ui.js';

// ---- État réseau ----
export let onlineMode = false;
export let myRole     = null;   // 'rouge' | 'bleu'
export let isMyTurn   = false;

export function setIsMyTurn(val) { isMyTurn = val; }

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io({ autoConnect: false });
    attachHandlers();
  }
  if (!socket.connected) socket.connect();
  return socket;
}

function attachHandlers() {
  socket.on('room-created', ({ code }) => {
    showLobby('host', code);
  });

  socket.on('room-error', ({ message }) => {
    showLobbyError(message);
  });

  socket.on('game-start', ({ yourRole }) => {
    myRole    = yourRole;
    isMyTurn  = yourRole === 'rouge';  // rouge joue en premier
    hideLobby();
    hideMenuOnline();
    demarrerPartie();
  });

  socket.on('opponent-move', ({ type, row, col }) => {
    const cell = cellAt(row, col);
    if (type === 'place') onPhasePlace(cell);
    else                  onPhaseSpread(cell);
  });

  socket.on('opponent-left', () => {
    onlineMode = false;
    myRole     = null;
    isMyTurn   = false;
    showOnlineDisconnectMessage();
    setTimeout(() => retourMenu(), 3000);
  });
}

// ---- API publique ----

export function creerPartie() {
  onlineMode = true;
  getSocket().emit('create-room');
}

export function rejoindrePartie(code) {
  if (!code) return;
  onlineMode = true;
  getSocket().emit('join-room', { code: code.toUpperCase().trim() });
}

export function emitMove(type, cell) {
  if (!onlineMode || !socket) return;
  const { row, col } = cellIndex.get(cell);
  socket.emit('move', { type, row, col });
}

export function emitLeave() {
  if (!socket) return;
  socket.emit('leave-room');
  onlineMode = false;
  myRole     = null;
  isMyTurn   = false;
}
