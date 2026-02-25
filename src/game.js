import { camera, controls, markDirty, setBgTarget, BG_NEUTRAL, BG_ROUGE, BG_BLEU } from './scene.js';
import {
  cellAt, cellIndex, GRID_SIZE,
  addGaletToCell, takeStack, topColor, stackSize,
  highlightCells, clearHighlights,
  buildGhostStack, removeBottomGhost, clearGhostStack,
  initBoard,
} from './board.js';
import { updateHUD, showEndMessage, showOnlineRoleBanner, hideOnlineRoleBanner, menu, gameUI, uiViews, btnQuitter } from './ui.js';
import { onlineMode, myRole, emitMove, setIsMyTurn, emitLeave } from './network.js';

// ---- État du jeu ----
export let gameActive    = false;
export let currentPlayer = 'rouge';
export let phase         = 'place';
export const playerPebbles = { rouge: 0, bleu: 0 };

export let spreadStack    = [];
export let spreadLastCell = null;
export let spreadPrevCell = null;

// ---- Helpers de règles ----
function getOrthogonalNeighbors(cell) {
  const { row, col } = cellIndex.get(cell);
  const neighbors = [];
  if (row > 0)             neighbors.push(cellAt(row - 1, col));
  if (row < GRID_SIZE - 1) neighbors.push(cellAt(row + 1, col));
  if (col > 0)             neighbors.push(cellAt(row, col - 1));
  if (col < GRID_SIZE - 1) neighbors.push(cellAt(row, col + 1));
  return neighbors;
}

// Voisins valides pour l'égrainage : orthogonaux, sauf la case d'où on vient
export function getValidSpreadCells() {
  return getOrthogonalNeighbors(spreadLastCell).filter(c => c !== spreadPrevCell);
}

function checkWin(player) {
  for (let r = 0; r < GRID_SIZE; r++) {
    if ([0, 1, 2, 3].every(c => topColor(cellAt(r, c)) === player)) return true;
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    if ([0, 1, 2, 3].every(r => topColor(cellAt(r, c)) === player)) return true;
  }
  if ([0, 1, 2, 3].every(i => topColor(cellAt(i, i)) === player))                  return true;
  if ([0, 1, 2, 3].every(i => topColor(cellAt(i, GRID_SIZE - 1 - i)) === player))  return true;
  return false;
}

// ---- Lifecycle de partie ----
export function demarrerPartie() {
  initBoard();
  gameActive    = true;
  currentPlayer = 'rouge';
  phase         = 'place';
  playerPebbles.rouge = 8;
  playerPebbles.bleu  = 8;
  spreadStack    = [];
  spreadLastCell = null;
  spreadPrevCell = null;
  clearHighlights();
  markDirty();

  menu.style.display       = 'none';
  btnQuitter.style.display = 'block';
  btnQuitter.textContent   = onlineMode ? '← Revenir au menu' : '← Quitter';
  gameUI.style.display     = 'flex';
  uiViews.style.display    = 'flex';

  controls.enabled = true;
  camera.position.set(0, 6, 5);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
  if (onlineMode) showOnlineRoleBanner(myRole);
  setBgTarget(BG_ROUGE); // rouge commence toujours
  updateHUD(currentPlayer, phase, spreadStack, playerPebbles, onlineMode ? myRole : null);
}

export function retourMenu() {
  if (onlineMode) emitLeave();
  gameActive = false;
  clearHighlights();
  markDirty();
  hideOnlineRoleBanner();
  setBgTarget(BG_NEUTRAL);

  menu.style.display       = 'flex';
  btnQuitter.style.display = 'none';
  gameUI.style.display     = 'none';
  uiViews.style.display    = 'none';
  controls.enabled = false;
}

// ---- Logique des phases ----
export function onPhasePlace(cell) {
  if (stackSize(cell) === 0) return;  // case vide interdite

  addGaletToCell(cell, currentPlayer);
  playerPebbles[currentPlayer]--;

  spreadStack    = takeStack(cell);   // récupère la pile entière, bottom-to-top
  spreadLastCell = cell;
  spreadPrevCell = null;
  phase          = 'spread';

  buildGhostStack(spreadStack);
  highlightCells(getValidSpreadCells());
  updateHUD(currentPlayer, phase, spreadStack, playerPebbles, onlineMode ? myRole : null);

  if (onlineMode) emitMove('place', cell);
}

export function onPhaseSpread(cell) {
  if (!getValidSpreadCells().includes(cell)) return;

  const couleur = spreadStack.shift();   // dépose le galet du bas de la pile
  addGaletToCell(cell, couleur);
  removeBottomGhost();
  spreadPrevCell = spreadLastCell;
  spreadLastCell = cell;

  // Émettre immédiatement après la mise à jour du plateau, avant tout return anticipé
  if (onlineMode) emitMove('spread', cell);

  if (spreadStack.length === 0) {
    // Égrainage terminé
    clearGhostStack();
    clearHighlights();

    if (checkWin(currentPlayer)) {
      const color = currentPlayer === 'rouge' ? '#ff8888' : '#88aaff';
      let msg;
      if (onlineMode) {
        msg = currentPlayer === myRole
          ? `<span style="color:${color}">Vous avez gagné !</span>`
          : `<span style="color:${color}">L'adversaire a gagné !</span>`;
      } else {
        const name = currentPlayer === 'rouge' ? 'Rouge' : 'Bleu';
        msg = `<span style="color:${color}">Joueur ${name} gagne !</span> — Nouvelle partie ?`;
      }
      setBgTarget(BG_NEUTRAL);
      showEndMessage(msg, playerPebbles);
      gameActive = false;
      return;
    }
    if (playerPebbles.rouge === 0 && playerPebbles.bleu === 0) {
      const suffix = onlineMode ? '' : ' — Nouvelle partie ?';
      setBgTarget(BG_NEUTRAL);
      showEndMessage(`Égalité${suffix}`, playerPebbles);
      gameActive = false;
      return;
    }

    currentPlayer = currentPlayer === 'rouge' ? 'bleu' : 'rouge';
    phase = 'place';
    if (onlineMode) setIsMyTurn(currentPlayer === myRole);
    setBgTarget(currentPlayer === 'rouge' ? BG_ROUGE : BG_BLEU);
    updateHUD(currentPlayer, phase, spreadStack, playerPebbles, onlineMode ? myRole : null);
  } else {
    // Égrainage en cours, case suivante
    highlightCells(getValidSpreadCells());
    updateHUD(currentPlayer, phase, spreadStack, playerPebbles, onlineMode ? myRole : null);
  }
}
