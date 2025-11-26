import * as THREE from 'three';

export function createCrystalCube(scene: THREE.Scene): THREE.Mesh {
    const size = 3;
    const geometry = new THREE.BoxGeometry(size, size, size);

    // Crystal glass material - dark, refractive, mysterious
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x888899,
        metalness: 0.0,
        roughness: 0.02,
        transmission: 0.92,
        thickness: 2.0,
        ior: 2.0,                  // Higher IOR for more dramatic refraction
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        envMapIntensity: 0.5,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        attenuationColor: new THREE.Color(0x222233),
        attenuationDistance: 2.0,  // Absorbs light over distance - darker interior
    });

    const crystalCube = new THREE.Mesh(geometry, crystalMaterial);

    crystalCube.rotation.x = Math.atan(Math.sin(Math.PI / 4));
    crystalCube.rotation.y = Math.PI / 4;

    scene.add(crystalCube);

    return crystalCube;
}

export function animateCube(cube: THREE.Mesh): void {
    // Slow, contemplative rotation
    cube.rotation.x += 0.0008;
    cube.rotation.y += 0.001;
    cube.rotation.z += 0.0004;
}
