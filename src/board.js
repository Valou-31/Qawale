import * as THREE from 'three';
import { scene, markDirty } from './scene.js';

// ---- Constantes du plateau ----
export const GRID_SIZE = 4;
const CELL_SIZE = 1;
const GAP       = 0.08;
const OFFSET    = ((GRID_SIZE - 1) * (CELL_SIZE + GAP)) / 2;

// ---- Matériaux des cases ----
export const cellMaterial  = new THREE.MeshStandardMaterial({ color: 0xe8d5a3 });
export const validMaterial = new THREE.MeshStandardMaterial({
  color: 0x44ff88, emissive: 0x44ff88, emissiveIntensity: 0.25,
  transparent: true, opacity: 0.7,
});
const cellGeometry = new THREE.BoxGeometry(CELL_SIZE, 0.2, CELL_SIZE);

// ---- Grille 4×4 ----
export const cells     = [];         // flat, row-major (row*4+col)
export const cellIndex = new Map();  // Mesh → { row, col }

for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    const cell = new THREE.Mesh(cellGeometry, cellMaterial);
    cell.position.set(col * (CELL_SIZE + GAP) - OFFSET, 0, row * (CELL_SIZE + GAP) - OFFSET);
    scene.add(cell);
    cells.push(cell);
    cellIndex.set(cell, { row, col });
  }
}

export function cellAt(row, col) { return cells[row * GRID_SIZE + col]; }
export function idxOf(row, col)  { return row * GRID_SIZE + col; }

// ---- Highlights (cases valides en phase spread) ----
const highlightedCells = new Set();

export function highlightCells(list) {
  clearHighlights();
  list.forEach(c => { c.material = validMaterial; highlightedCells.add(c); });
  markDirty();
}

export function clearHighlights() {
  highlightedCells.forEach(c => c.material = cellMaterial);
  highlightedCells.clear();
  markDirty();
}

// ---- Géométrie et matériaux des galets ----
export const GALET_H       = 0.32 * 0.28;  // demi-hauteur aplatie
export const galetGeometry = new THREE.SphereGeometry(0.32, 16, 10);

const galetMaterials = {
  rouge: new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.35, metalness: 0.1 }),
  bleu:  new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.35, metalness: 0.1 }),
  beige: new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.5,  metalness: 0.0 }),
};

const ghostMaterials = {
  rouge: new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.45 }),
  bleu:  new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.45 }),
  beige: new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.5,  metalness: 0.0, transparent: true, opacity: 0.45 }),
};

// ---- Piles de galets par case ----
export const cellStacks = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => []);  // couleurs bottom-to-top
export const cellMeshes = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => []);  // meshes parallèles

function galetY(stackPos) { return 0.1 + GALET_H * (2 * stackPos + 1); }

function createGalet(couleur) {
  const mesh = new THREE.Mesh(galetGeometry, galetMaterials[couleur]);
  mesh.scale.set(1, 0.28, 1);
  return mesh;
}

export function addGaletToCell(cell, couleur) {
  const { row, col } = cellIndex.get(cell);
  const idx  = idxOf(row, col);
  const mesh = createGalet(couleur);
  mesh.position.set(cell.position.x, galetY(cellStacks[idx].length), cell.position.z);
  scene.add(mesh);
  cellStacks[idx].push(couleur);
  cellMeshes[idx].push(mesh);
  markDirty();
}

export function takeStack(cell) {
  const { row, col } = cellIndex.get(cell);
  const idx    = idxOf(row, col);
  const colors = [...cellStacks[idx]];
  cellMeshes[idx].forEach(m => scene.remove(m));
  cellStacks[idx] = [];
  cellMeshes[idx] = [];
  markDirty();
  return colors;  // bottom-to-top
}

export function topColor(cell) {
  const { row, col } = cellIndex.get(cell);
  const stack = cellStacks[idxOf(row, col)];
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

export function stackSize(cell) {
  const { row, col } = cellIndex.get(cell);
  return cellStacks[idxOf(row, col)].length;
}

// ---- Hover marker (indicateur de case survolée) ----
export const hoverMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 12, 8),
  new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.85,
  })
);
hoverMarker.visible = false;
scene.add(hoverMarker);

// ---- Ghost stack (aperçu du prochain dépôt en phase spread) ----
export const ghostGroup = new THREE.Group();
ghostGroup.visible = false;
scene.add(ghostGroup);

export function buildGhostStack(spreadStack) {
  while (ghostGroup.children.length) ghostGroup.remove(ghostGroup.children[0]);
  spreadStack.forEach((couleur, i) => {
    const mesh = new THREE.Mesh(galetGeometry, ghostMaterials[couleur]);
    mesh.scale.set(1, 0.28, 1);
    mesh.position.y = GALET_H * (2 * i + 1);
    ghostGroup.add(mesh);
  });
}

export function removeBottomGhost() {
  if (ghostGroup.children.length) ghostGroup.remove(ghostGroup.children[0]);
  ghostGroup.children.forEach((mesh, i) => { mesh.position.y = GALET_H * (2 * i + 1); });
}

export function clearGhostStack() {
  while (ghostGroup.children.length) ghostGroup.remove(ghostGroup.children[0]);
  ghostGroup.visible = false;
}

// ---- Lifecycle ----
export function initBoard() {
  // Remet à zéro toutes les piles et supprime les meshes de la scène
  cells.forEach(c => {
    const { row, col } = cellIndex.get(c);
    const idx = idxOf(row, col);
    cellMeshes[idx].forEach(m => scene.remove(m));
    cellStacks[idx] = [];
    cellMeshes[idx] = [];
  });
  // Place 2 galets beige dans chaque coin (règle Qawale)
  const corners = [cellAt(0, 0), cellAt(0, 3), cellAt(3, 0), cellAt(3, 3)];
  corners.forEach(c => { addGaletToCell(c, 'beige'); addGaletToCell(c, 'beige'); });
}
