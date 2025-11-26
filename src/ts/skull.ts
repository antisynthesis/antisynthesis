import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface SkullResult {
    skull: THREE.Group;
    skullGroup: THREE.Group;
}

export function loadSkull(scene: THREE.Scene): Promise<SkullResult> {
    const skullGroup = new THREE.Group();
    scene.add(skullGroup);

    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
        loader.load(
            '/assets/models/skull.glb',
            (gltf) => {
                const skull = gltf.scene;

                skull.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;

                        // Ensure normals are computed correctly
                        if (mesh.geometry) {
                            mesh.geometry.computeVertexNormals();
                        }

                        const newMat = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.05,
                            roughness: 0.3,  // Lower roughness to show colored light better
                            side: THREE.DoubleSide,
                        });
                        mesh.material = newMat;
                        console.log('Applied material to mesh:', mesh.name);
                    }
                });

                skull.scale.set(2, 2, 2);
                skull.rotation.y = 0;
                skullGroup.add(skull);
                resolve({ skull, skullGroup });
            },
            undefined,
            (error) => {
                console.error('Failed to load skull:', error);
                reject(error);
            }
        );
    });
}
