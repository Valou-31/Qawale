import * as THREE from 'three';
import { scene, camera, renderer, controls, clock, needsRender, markDirty, clearDirty, updateBg } from './scene.js';
import { cells, stackSize, GALET_H, hoverMarker, ghostGroup } from './board.js';
import { gameActive, phase, getValidSpreadCells, onPhasePlace, onPhaseSpread, demarrerPartie, retourMenu } from './game.js';
import { onlineMode, isMyTurn, creerPartie, rejoindrePartie, emitLeave } from './network.js';
import { showMenuOnline, hideMenuOnline, hideLobby } from './ui.js';

// ---- Raycaster / souris ----
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

window.addEventListener('mousemove', e => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  markDirty();
});

// ---- Clic sur le plateau ----
window.addEventListener('click', e => {
  if (!gameActive) return;
  if (e.target !== renderer.domElement) return;
  if (onlineMode && !isMyTurn) return;   // bloquer pendant le tour de l'adversaire
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(cells);
  if (hits.length === 0) return;
  const cell = hits[0].object;
  if (phase === 'place') onPhasePlace(cell);
  else                   onPhaseSpread(cell);
});

// ---- Boutons menu principal ----
document.getElementById('btn-nouvelle-partie').addEventListener('click', demarrerPartie);
document.getElementById('btn-quitter').addEventListener('click', retourMenu);
document.getElementById('btn-en-ligne').addEventListener('click', showMenuOnline);

// ---- Boutons sous-menu en ligne ----
document.getElementById('btn-creer-partie').addEventListener('click', creerPartie);
document.getElementById('btn-rejoindre').addEventListener('click', () => {
  const code = document.getElementById('input-code').value;
  rejoindrePartie(code);
});
document.getElementById('input-code').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const code = document.getElementById('input-code').value;
    rejoindrePartie(code);
  }
});
document.getElementById('btn-retour-menu-online').addEventListener('click', hideMenuOnline);

// ---- Bouton annuler lobby ----
document.getElementById('btn-annuler-lobby').addEventListener('click', () => {
  emitLeave();
  hideLobby();
  hideMenuOnline();
});

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  markDirty();
});

// ---- Boucle de rendu ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();  // maintient l'amortissement de l'orbite

  // On ne rend que si quelque chose a changé OU si le hover est en cours d'animation
  const hovering = hoverMarker.visible || ghostGroup.visible;
  if (!needsRender && !hovering) return;
  clearDirty();
  updateBg();

  if (gameActive) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(cells);
    const t    = clock.getElapsedTime();

    // En mode en ligne, pas de hover pendant le tour de l'adversaire
    const canInteract = !onlineMode || isMyTurn;

    if (hits.length > 0 && canInteract) {
      const target = hits[0].object;

      if (phase === 'place' && stackSize(target) > 0) {
        // Hover marker animé au-dessus de la pile survolée
        const top = 0.1 + GALET_H * 2 * stackSize(target);
        hoverMarker.position.set(target.position.x, top + 0.18 + Math.sin(t * 3) * 0.06, target.position.z);
        hoverMarker.visible = true;
        ghostGroup.visible  = false;

      } else if (phase === 'spread' && getValidSpreadCells().includes(target)) {
        // Ghost stack animé au-dessus de la case de destination
        const top = 0.1 + GALET_H * 2 * stackSize(target);
        ghostGroup.position.set(target.position.x, top + Math.sin(t * 3) * 0.06, target.position.z);
        ghostGroup.visible  = true;
        hoverMarker.visible = false;

      } else {
        hoverMarker.visible = false;
        ghostGroup.visible  = false;
      }
    } else {
      hoverMarker.visible = false;
      ghostGroup.visible  = false;
    }
  } else {
    hoverMarker.visible = false;
    ghostGroup.visible  = false;
  }

  renderer.render(scene, camera);
}

animate();
