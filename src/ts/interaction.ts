import * as THREE from 'three';

interface MouseTracking {
    targetRotation: THREE.Vector2;
    currentRotation: THREE.Vector2;
}

export function setupMouseTracking(): MouseTracking {
    const targetRotation = new THREE.Vector2();
    const currentRotation = new THREE.Vector2();

    window.addEventListener('mousemove', (event: MouseEvent) => {
        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };

        targetRotation.x = mouse.y * 0.5;
        targetRotation.y = mouse.x * 0.5;
    });

    return { targetRotation, currentRotation };
}

export function updateSkullRotation(
    skullGroup: THREE.Group,
    targetRotation: THREE.Vector2,
    currentRotation: THREE.Vector2
): void {
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

    skullGroup.rotation.x = currentRotation.x;
    skullGroup.rotation.y = currentRotation.y;
}
