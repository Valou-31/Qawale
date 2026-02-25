import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- Scène + rendu ----
export const scene = new THREE.Scene();

// Couleurs de fond selon le joueur courant
export const BG_NEUTRAL = 0x1a1a2e;
export const BG_ROUGE   = 0x2e1515;  // variante rouge sombre
export const BG_BLEU    = 0x15152e;  // variante bleue sombre

const _bgCurrent = new THREE.Color(BG_NEUTRAL);
const _bgTarget  = new THREE.Color(BG_NEUTRAL);
let   _bgTransitioning = false;
scene.background = _bgCurrent;

export function setBgTarget(hexColor) {
  _bgTarget.set(hexColor);
  _bgTransitioning = true;
  markDirty();
}

export function updateBg() {
  if (!_bgTransitioning) return;
  _bgCurrent.lerp(_bgTarget, 0.06);
  const dist = Math.abs(_bgCurrent.r - _bgTarget.r)
             + Math.abs(_bgCurrent.g - _bgTarget.g)
             + Math.abs(_bgCurrent.b - _bgTarget.b);
  if (dist < 0.002) {
    _bgCurrent.copy(_bgTarget);
    _bgTransitioning = false;
  } else {
    markDirty();
  }
}

export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 5);
camera.lookAt(0, 0, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// ---- Caméra orbitale ----
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.08;
controls.target.set(0, 0, 0);
controls.minPolarAngle  = 0;
controls.maxPolarAngle  = Math.PI / 2;
controls.enabled        = false;

// ---- Flag de rendu à la demande ----
// Plutôt que de rendre à 60fps en permanence, on ne rend que quand quelque chose change.
export let needsRender = true;
export function markDirty()  { needsRender = true; }
export function clearDirty() { needsRender = false; }
controls.addEventListener('change', markDirty);

// ---- Lumières ----
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

export const clock = new THREE.Clock();
