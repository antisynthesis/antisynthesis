import { initScene, handleResize } from './scene';
import { setupLights } from './lighting';
import { createCrystalCube, animateCube } from './cube';
import { loadSkull } from './skull';
import { setupMouseTracking, updateSkullRotation } from './interaction';
import { setupPostProcessing, updatePostProcessing, resizePostProcessing } from './postprocessing';
import { createParticleSystem, updateParticles } from './particles';
import { createWireframeOverlay, createWireframeState, updateWireframeOverlay } from './wireframe';
import { initHUD, updateHUD } from './hud';
import * as THREE from 'three';

console.log('🎨 ANTISYNTHESIS initializing...');

const { scene, camera, renderer } = initScene();
console.log('✓ Scene initialized');

setupLights(scene);
console.log('✓ Lights added to scene:', scene.children.filter(c => (c as THREE.Light).isLight).length);

const crystalCube = createCrystalCube(scene);
console.log('✓ Crystal cube created');

// Setup post-processing pipeline
const postProcessing = setupPostProcessing(renderer, scene, camera);
console.log('✓ Post-processing initialized (bloom, DoF, film grain)');

// Create particle system
const particleSystem = createParticleSystem(scene);
const particleBounds = { x: 12, y: 10, z: 12 };
console.log('✓ Particle system created');

// Create wireframe overlay
const wireframeOverlay = createWireframeOverlay(scene);
const wireframeState = createWireframeState();
console.log('✓ Wireframe overlay created');

// Initialize HUD
initHUD();
console.log('✓ HUD initialized');

const { targetRotation, currentRotation } = setupMouseTracking();

let skull: THREE.Group | null = null;
let skullGroup: THREE.Group | null = null;

loadSkull(scene).then(({ skull: loadedSkull, skullGroup: loadedGroup }) => {
    skull = loadedSkull;
    skullGroup = loadedGroup;
    console.log('✓ Skull loaded successfully');
    console.log('  - Skull position:', skullGroup.position);
    console.log('  - Skull children:', skull.children.length);
}).catch(err => {
    console.error('✗ Failed to load skull:', err);
});

// Handle resize for both renderer and post-processing
handleResize(camera, renderer);
window.addEventListener('resize', () => {
    resizePostProcessing(postProcessing, window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let lastTime = 0;

let frameCount = 0;
function animate(): void {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastTime;
    lastTime = elapsedTime;

    animateCube(crystalCube);

    if (skull && skullGroup) {
        updateSkullRotation(skullGroup, targetRotation, currentRotation);
    }

    // Update particles
    updateParticles(particleSystem, elapsedTime, particleBounds);

    // Update wireframe overlay
    updateWireframeOverlay(wireframeOverlay, wireframeState, deltaTime, elapsedTime);

    // Update HUD stats
    updateHUD(elapsedTime);

    // Update post-processing (animates film grain)
    updatePostProcessing(postProcessing, elapsedTime);

    // Render through post-processing pipeline instead of direct render
    postProcessing.composer.render();

    // Log initial state
    if (frameCount === 60) {
        console.log('📊 After 60 frames:');
        console.log('  - Scene children:', scene.children.length);
        console.log('  - Lights:', scene.children.filter(c => (c as THREE.Light).isLight).map(l => ({ type: l.type, intensity: (l as THREE.Light).intensity })));
        console.log('  - Camera position:', camera.position);
        console.log('  - Skull loaded:', !!skull);
        console.log('  - Post-processing: enabled');
    }
    frameCount++;
}

animate();
console.log('✓ Animation loop started');
