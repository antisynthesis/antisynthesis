import * as THREE from 'three';

export interface WireframeOverlay {
    group: THREE.Group;
    meshes: THREE.LineSegments[];
    material: THREE.ShaderMaterial;
}

export function createWireframeOverlay(scene: THREE.Scene): WireframeOverlay {
    const group = new THREE.Group();
    const meshes: THREE.LineSegments[] = [];

    // Custom shader material for animated wireframe
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            opacity: { value: 0.0 },
            color: { value: new THREE.Color(0x00ffff) }, // Cyan wireframe
        },
        vertexShader: `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float opacity;
            uniform vec3 color;
            varying vec3 vPosition;

            void main() {
                // Scan line effect moving up
                float scanLine = sin(vPosition.y * 10.0 - time * 2.0) * 0.5 + 0.5;
                float alpha = opacity * (0.3 + scanLine * 0.4);

                // Pulse effect
                float pulse = sin(time * 1.5) * 0.1 + 0.9;

                gl_FragColor = vec4(color * pulse, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
    });

    // Create multiple geometric wireframe shapes

    // Icosahedron - main focal geometry
    const icoGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const icoEdges = new THREE.EdgesGeometry(icoGeo);
    const icoLines = new THREE.LineSegments(icoEdges, material);
    meshes.push(icoLines);
    group.add(icoLines);

    // Outer octahedron
    const octaGeo = new THREE.OctahedronGeometry(5, 0);
    const octaEdges = new THREE.EdgesGeometry(octaGeo);
    const octaLines = new THREE.LineSegments(octaEdges, material);
    meshes.push(octaLines);
    group.add(octaLines);

    // Inner tetrahedron
    const tetraGeo = new THREE.TetrahedronGeometry(2, 0);
    const tetraEdges = new THREE.EdgesGeometry(tetraGeo);
    const tetraLines = new THREE.LineSegments(tetraEdges, material);
    meshes.push(tetraLines);
    group.add(tetraLines);

    // Surrounding ring
    const torusGeo = new THREE.TorusGeometry(4.5, 0.02, 3, 32);
    const torusEdges = new THREE.EdgesGeometry(torusGeo);
    const torusLines = new THREE.LineSegments(torusEdges, material);
    torusLines.rotation.x = Math.PI / 2;
    meshes.push(torusLines);
    group.add(torusLines);

    scene.add(group);

    return { group, meshes, material };
}

export interface WireframeState {
    phase: 'hidden' | 'fading_in' | 'visible' | 'fading_out';
    timer: number;
    nextTrigger: number;
}

export function createWireframeState(): WireframeState {
    return {
        phase: 'hidden',
        timer: 0,
        nextTrigger: 8 + Math.random() * 12, // First appearance 8-20 seconds
    };
}

export function updateWireframeOverlay(
    overlay: WireframeOverlay,
    state: WireframeState,
    deltaTime: number,
    elapsedTime: number
): void {
    const fadeSpeed = 0.4; // How fast it fades in/out
    const visibleDuration = 3 + Math.random() * 2; // How long it stays visible (3-5 sec)
    const hiddenDuration = 10 + Math.random() * 15; // Time between appearances (10-25 sec)

    state.timer += deltaTime;

    // State machine for fade behavior
    switch (state.phase) {
        case 'hidden':
            if (state.timer >= state.nextTrigger) {
                state.phase = 'fading_in';
                state.timer = 0;
            }
            break;

        case 'fading_in':
            overlay.material.uniforms.opacity.value = Math.min(
                overlay.material.uniforms.opacity.value + deltaTime * fadeSpeed,
                0.6 // Max opacity
            );
            if (overlay.material.uniforms.opacity.value >= 0.6) {
                state.phase = 'visible';
                state.timer = 0;
                state.nextTrigger = visibleDuration;
            }
            break;

        case 'visible':
            if (state.timer >= state.nextTrigger) {
                state.phase = 'fading_out';
                state.timer = 0;
            }
            break;

        case 'fading_out':
            overlay.material.uniforms.opacity.value = Math.max(
                overlay.material.uniforms.opacity.value - deltaTime * fadeSpeed,
                0
            );
            if (overlay.material.uniforms.opacity.value <= 0) {
                state.phase = 'hidden';
                state.timer = 0;
                state.nextTrigger = hiddenDuration;
            }
            break;
    }

    // Update time uniform for animations
    overlay.material.uniforms.time.value = elapsedTime;

    // Slow rotation of the wireframe group
    overlay.group.rotation.y += deltaTime * 0.05;
    overlay.group.rotation.x += deltaTime * 0.02;

    // Individual mesh rotations for complexity
    overlay.meshes[0].rotation.z += deltaTime * 0.03; // Icosahedron
    overlay.meshes[1].rotation.y -= deltaTime * 0.02; // Octahedron
    overlay.meshes[2].rotation.x += deltaTime * 0.04; // Tetrahedron
}
