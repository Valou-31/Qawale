import { camera, controls, markDirty } from './scene.js';

// ---- HUD + compteurs ----
const hud          = document.getElementById('hud');
const counterRouge = document.getElementById('counter-rouge');
const counterBleu  = document.getElementById('counter-bleu');

export function updateHUD(currentPlayer, phase, spreadStack, playerPebbles) {
  markDirty();
  const color = currentPlayer === 'rouge' ? '#ff8888' : '#88aaff';
  const name  = currentPlayer === 'rouge' ? 'Rouge'   : 'Bleu';
  if (phase === 'place') {
    hud.innerHTML = `<span style="color:${color}">Joueur ${name}</span> — Posez un galet sur une pile`;
  } else {
    const n = spreadStack.length;
    hud.innerHTML = `Égrainage — <span style="color:${color}">${n} galet${n > 1 ? 's' : ''}</span> restant${n > 1 ? 's' : ''}`;
  }
  counterRouge.textContent = `Rouge : ${playerPebbles.rouge}`;
  counterBleu.textContent  = `Bleu : ${playerPebbles.bleu}`;
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
