import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- Scène + rendu ----
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

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
