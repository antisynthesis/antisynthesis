import * as THREE from 'three';

interface MouseTracking {
    targetRotation: THREE.Vector2;
    currentRotation: THREE.Vector2;
}

export function setupMouseTracking(): MouseTracking {
    const targetRotation = new THREE.Vector2();
    const currentRotation = new THREE.Vector2();

    // Desktop mouse tracking
    window.addEventListener('mousemove', (event: MouseEvent) => {
        const normalized = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };

        targetRotation.x = normalized.y * 0.5;
        targetRotation.y = normalized.x * 0.5;
    });

    // Mobile touch tracking
    let lastTouch: { x: number; y: number } | null = null;

    window.addEventListener('touchstart', (event: TouchEvent) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            lastTouch = { x: touch.clientX, y: touch.clientY };
        }
    }, { passive: true });

    window.addEventListener('touchmove', (event: TouchEvent) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];

            if (lastTouch) {
                // Calculate drag delta and apply to rotation
                const deltaX = (touch.clientX - lastTouch.x) / window.innerWidth;
                const deltaY = (touch.clientY - lastTouch.y) / window.innerHeight;

                targetRotation.y += deltaX * 2;
                targetRotation.x -= deltaY * 2;

                // Clamp rotation to reasonable bounds
                targetRotation.x = Math.max(-0.8, Math.min(0.8, targetRotation.x));
                targetRotation.y = Math.max(-0.8, Math.min(0.8, targetRotation.y));
            }

            lastTouch = { x: touch.clientX, y: touch.clientY };
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        lastTouch = null;
    }, { passive: true });

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
