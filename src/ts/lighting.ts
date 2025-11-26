import * as THREE from 'three';

export interface SceneLights {
    purpleLight: THREE.PointLight;
    orangeLight: THREE.PointLight;
    cyanLight: THREE.PointLight;
}

export function setupLights(scene: THREE.Scene): SceneLights {
    // Position colored lights close to the skull for vivid color pickup
    // Camera is at z=5, skull at origin
    const purpleLight = new THREE.PointLight(0xff00ff, 15);
    purpleLight.position.set(2, 1.5, 2);
    purpleLight.decay = 1;
    scene.add(purpleLight);

    const orangeLight = new THREE.PointLight(0xff6600, 12);
    orangeLight.position.set(-2, 1, 2);
    orangeLight.decay = 1;
    scene.add(orangeLight);

    const cyanLight = new THREE.PointLight(0x00ffff, 14);
    cyanLight.position.set(0, -1.5, 2.5);
    cyanLight.decay = 1;
    scene.add(cyanLight);

    // Very dim ambient - just enough to see shape, let colored lights dominate
    const ambientLight = new THREE.AmbientLight(0x111111, 0.5);
    scene.add(ambientLight);

    return { purpleLight, orangeLight, cyanLight };
}
