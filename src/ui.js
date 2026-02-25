import { camera, controls, markDirty } from './scene.js';

// ---- HUD + compteurs ----
const hud               = document.getElementById('hud');
const counterRouge      = document.getElementById('counter-rouge');
const counterBleu       = document.getElementById('counter-bleu');
const onlineRoleBanner  = document.getElementById('online-role-banner');

export function showOnlineRoleBanner(role) {
  const color = role === 'rouge' ? '#ff8888' : '#88aaff';
  const name  = role === 'rouge' ? 'Rouge'   : 'Bleu';
  onlineRoleBanner.innerHTML     = `<span style="color:${color}">● Vous jouez ${name}</span>`;
  onlineRoleBanner.style.display = 'block';
}

export function hideOnlineRoleBanner() {
  onlineRoleBanner.style.display = 'none';
}

export function updateHUD(currentPlayer, phase, spreadStack, playerPebbles, myRole = null) {
  markDirty();
  const color = currentPlayer === 'rouge' ? '#ff8888' : '#88aaff';
  const name  = currentPlayer === 'rouge' ? 'Rouge'   : 'Bleu';

  if (myRole) {
    // Mode en ligne : distinguer mon tour / tour adversaire
    const isMyTurn = currentPlayer === myRole;
    if (phase === 'place') {
      if (isMyTurn) {
        hud.innerHTML = `<span style="color:${color}">▶ Votre tour</span> — Posez un galet sur une pile`;
      } else {
        hud.innerHTML = `<span style="color:#999">⏳ Tour de l'adversaire (${name})…</span>`;
      }
    } else {
      const n = spreadStack.length;
      if (isMyTurn) {
        hud.innerHTML = `Égrainage — <span style="color:${color}">${n} galet${n > 1 ? 's' : ''}</span> restant${n > 1 ? 's' : ''}`;
      } else {
        hud.innerHTML = `<span style="color:#999">Égrainage adversaire — ${n} galet${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''}</span>`;
      }
    }
  } else {
    // Mode local
    if (phase === 'place') {
      hud.innerHTML = `<span style="color:${color}">Joueur ${name}</span> — Posez un galet sur une pile`;
    } else {
      const n = spreadStack.length;
      hud.innerHTML = `Égrainage — <span style="color:${color}">${n} galet${n > 1 ? 's' : ''}</span> restant${n > 1 ? 's' : ''}`;
    }
  }

  // Compteurs : marquer (Vous) / (Adv.) en mode en ligne
  const rougeLabel = myRole === 'rouge' ? 'Rouge (Vous)' : myRole === 'bleu' ? 'Rouge (Adv.)' : 'Rouge';
  const bleuLabel  = myRole === 'bleu'  ? 'Bleu (Vous)'  : myRole === 'rouge' ? 'Bleu (Adv.)'  : 'Bleu';
  counterRouge.textContent = `${rougeLabel} : ${playerPebbles.rouge}`;
  counterBleu.textContent  = `${bleuLabel} : ${playerPebbles.bleu}`;
}

export function showEndMessage(msg, playerPebbles) {
  markDirty();
  hud.innerHTML = msg;
  counterRouge.textContent = `Rouge : ${playerPebbles.rouge}`;
  counterBleu.textContent  = `Bleu : ${playerPebbles.bleu}`;
}

// ---- Références DOM partagées avec game.js ----
export const menu       = document.getElementById('menu');
export const gameUI     = document.getElementById('game-ui');
export const uiViews    = document.getElementById('ui-views');
export const btnQuitter = document.getElementById('btn-quitter');

// ---- Lobby en ligne ----
const menuOnline  = document.getElementById('menu-online');
const lobbyView   = document.getElementById('lobby-view');
const lobbyCode   = document.getElementById('lobby-code');
const lobbyStatus = document.getElementById('lobby-status');
const lobbyError  = document.getElementById('lobby-error');

export function showMenuOnline() {
  menu.style.display       = 'none';
  menuOnline.style.display = 'flex';
  lobbyError.textContent   = '';
}

export function hideMenuOnline() {
  menuOnline.style.display = 'none';
  menu.style.display       = 'flex';
}

export function showLobby(mode, code) {
  menuOnline.style.display = 'none';
  lobbyView.style.display  = 'flex';
  lobbyCode.textContent    = code;
  lobbyStatus.textContent  = mode === 'host'
    ? 'En attente d\'un adversaire…'
    : 'Connexion en cours…';
}

export function hideLobby() {
  lobbyView.style.display = 'none';
}

export function showLobbyError(message) {
  lobbyError.textContent = message;
}

export function showOnlineDisconnectMessage() {
  hud.innerHTML = 'L\'adversaire s\'est déconnecté.';
}

// ---- Boutons de vue (créés une seule fois au chargement du module) ----
const viewDefs = [
  { label: 'Dessus', pos: [0, 8, 0.001] },
  { label: 'Face',   pos: [0, 2, 8] },
  { label: 'Côté',   pos: [8, 2, 0] },
  { label: '3/4',    pos: [5, 6, 5] },
];
viewDefs.forEach(({ label, pos }) => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className   = 'btn btn-secondary';
  btn.style.padding  = '6px 14px';
  btn.style.fontSize = '13px';
  btn.addEventListener('click', () => {
    camera.position.set(...pos);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  });
  uiViews.appendChild(btn);
});
