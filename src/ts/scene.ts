import * as THREE from 'three';

export function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const container = document.getElementById('canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    camera.position.z = 5;

    return { scene, camera, renderer };
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
