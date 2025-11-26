import * as THREE from 'three';

export interface ParticleSystem {
    points: THREE.Points;
    velocities: Float32Array;
    originalPositions: Float32Array;
}

export function createParticleSystem(scene: THREE.Scene): ParticleSystem {
    const particleCount = 200;
    const spread = 12; // How far particles spread from center
    const height = 10; // Vertical spread

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    // Initialize particles with random positions
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Random position in a box around the scene
        positions[i3] = (Math.random() - 0.5) * spread;
        positions[i3 + 1] = (Math.random() - 0.5) * height;
        positions[i3 + 2] = (Math.random() - 0.5) * spread;

        // Slow, gentle drift velocities
        velocities[i3] = (Math.random() - 0.5) * 0.002;     // x drift
        velocities[i3 + 1] = Math.random() * 0.003 + 0.001; // y drift (upward bias)
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.002; // z drift

        // Random sizes for depth variation
        sizes[i] = Math.random() * 0.03 + 0.01;

        // Random opacity for subtle variation
        opacities[i] = Math.random() * 0.4 + 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // Store original positions for bounds checking
    const originalPositions = new Float32Array(positions);

    // Custom shader material for soft, glowing particles
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            color1: { value: new THREE.Color(0xffffff) },  // White dust
            color2: { value: new THREE.Color(0xff6600) },  // Orange ember tint
            color3: { value: new THREE.Color(0xff00ff) },  // Magenta accent
        },
        vertexShader: `
            attribute float size;
            attribute float opacity;
            varying float vOpacity;
            varying float vColorMix;
            uniform float time;

            void main() {
                vOpacity = opacity;

                // Color variation based on position and time
                vColorMix = sin(position.y * 0.5 + time * 0.2) * 0.5 + 0.5;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                // Size attenuation based on distance
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;
            uniform vec3 color3;
            varying float vOpacity;
            varying float vColorMix;

            void main() {
                // Soft circular particle with glow
                vec2 center = gl_PointCoord - 0.5;
                float dist = length(center);

                // Soft falloff
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= vOpacity;

                // Mix colors based on variation
                vec3 color = mix(color1, color2, vColorMix * 0.3);
                color = mix(color, color3, vColorMix * 0.1);

                gl_FragColor = vec4(color, alpha * 0.6);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    return { points, velocities, originalPositions };
}

export function updateParticles(
    particleSystem: ParticleSystem,
    time: number,
    bounds: { x: number; y: number; z: number }
): void {
    const positions = particleSystem.points.geometry.attributes.position.array as Float32Array;
    const velocities = particleSystem.velocities;

    for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;

        // Add gentle sine wave motion for organic feel
        const waveX = Math.sin(time * 0.5 + i * 0.1) * 0.001;
        const waveZ = Math.cos(time * 0.4 + i * 0.15) * 0.001;

        // Update positions
        positions[i3] += velocities[i3] + waveX;
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2] + waveZ;

        // Wrap around bounds (respawn at bottom when reaching top, etc.)
        if (positions[i3 + 1] > bounds.y / 2) {
            positions[i3 + 1] = -bounds.y / 2;
            // Randomize x/z on respawn for variety
            positions[i3] = (Math.random() - 0.5) * bounds.x;
            positions[i3 + 2] = (Math.random() - 0.5) * bounds.z;
        }

        // Wrap horizontal bounds
        if (positions[i3] > bounds.x / 2) positions[i3] = -bounds.x / 2;
        if (positions[i3] < -bounds.x / 2) positions[i3] = bounds.x / 2;
        if (positions[i3 + 2] > bounds.z / 2) positions[i3 + 2] = -bounds.z / 2;
        if (positions[i3 + 2] < -bounds.z / 2) positions[i3 + 2] = bounds.z / 2;
    }

    // Mark positions as needing update
    particleSystem.points.geometry.attributes.position.needsUpdate = true;

    // Update shader time uniform
    (particleSystem.points.material as THREE.ShaderMaterial).uniforms.time.value = time;
}
