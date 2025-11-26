import * as THREE from 'three';

export interface WireframeOverlay {
    group: THREE.Group;
    globe: THREE.Line;
    material: THREE.ShaderMaterial;
}

// Simplified continent outlines as lat/long coordinates
// Format: [longitude, latitude] arrays for each continent path
function getContinentPaths(): number[][][] {
    return [
        // North America
        [
            [-168, 65], [-166, 60], [-140, 60], [-130, 55], [-125, 48],
            [-124, 40], [-117, 32], [-105, 25], [-97, 25], [-90, 21],
            [-87, 18], [-83, 10], [-80, 8], [-77, 8], [-73, 11],
            [-62, 10], [-60, 14], [-65, 18], [-72, 18], [-75, 20],
            [-80, 25], [-81, 30], [-75, 35], [-70, 41], [-67, 44],
            [-66, 50], [-55, 50], [-55, 52], [-60, 56], [-65, 60],
            [-75, 62], [-80, 65], [-90, 70], [-110, 72], [-130, 70],
            [-145, 70], [-165, 68], [-168, 65]
        ],
        // South America
        [
            [-80, 8], [-77, 4], [-80, -2], [-81, -6], [-75, -15],
            [-70, -18], [-70, -25], [-65, -35], [-68, -52], [-72, -55],
            [-68, -55], [-64, -50], [-58, -40], [-48, -28], [-46, -24],
            [-40, -22], [-38, -15], [-35, -8], [-35, -2], [-50, 2],
            [-55, 5], [-60, 8], [-65, 10], [-73, 11], [-77, 8], [-80, 8]
        ],
        // Europe
        [
            [-10, 36], [-5, 36], [0, 38], [5, 43], [3, 46],
            [-2, 48], [2, 51], [5, 54], [8, 55], [12, 55],
            [15, 55], [18, 55], [24, 60], [28, 70], [20, 70],
            [10, 65], [5, 62], [-5, 58], [-10, 52], [-10, 45], [-10, 36]
        ],
        // Africa
        [
            [-17, 15], [-15, 10], [-5, 5], [10, 2], [12, -5],
            [15, -12], [20, -18], [27, -28], [32, -34], [28, -32],
            [25, -30], [18, -28], [12, -18], [15, -5], [20, 2],
            [30, 5], [42, 10], [50, 12], [43, 12], [35, 20],
            [32, 32], [25, 32], [10, 37], [-5, 36], [-10, 30],
            [-17, 25], [-17, 15]
        ],
        // Asia
        [
            [28, 70], [50, 70], [70, 72], [100, 75], [130, 72],
            [140, 70], [160, 65], [170, 60], [165, 55], [145, 45],
            [140, 35], [130, 30], [122, 25], [120, 22], [110, 20],
            [105, 10], [100, 5], [95, 6], [92, 22], [88, 22],
            [82, 15], [77, 8], [72, 20], [68, 24], [62, 25],
            [55, 25], [50, 30], [40, 35], [35, 35], [28, 42],
            [28, 70]
        ],
        // Australia
        [
            [115, -22], [120, -18], [130, -14], [142, -12], [150, -22],
            [153, -28], [150, -35], [145, -38], [138, -35], [130, -32],
            [122, -34], [115, -34], [115, -22]
        ],
        // Latitude lines (grid)
        ...createLatitudeLines(),
        // Longitude lines (grid)
        ...createLongitudeLines()
    ];
}

function createLatitudeLines(): number[][][] {
    const lines: number[][][] = [];
    const latitudes = [-60, -30, 0, 30, 60];

    for (const lat of latitudes) {
        const line: number[][] = [];
        for (let lon = -180; lon <= 180; lon += 15) {
            line.push([lon, lat]);
        }
        lines.push(line);
    }
    return lines;
}

function createLongitudeLines(): number[][][] {
    const lines: number[][][] = [];
    const longitudes = [-120, -60, 0, 60, 120, 180];

    for (const lon of longitudes) {
        const line: number[][] = [];
        for (let lat = -75; lat <= 75; lat += 10) {
            line.push([lon, lat]);
        }
        lines.push(line);
    }
    return lines;
}

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

function createGlobeGeometry(radius: number): THREE.BufferGeometry {
    const paths = getContinentPaths();
    const points: number[] = [];

    for (const path of paths) {
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = latLongToVector3(path[i][1], path[i][0], radius);
            const p2 = latLongToVector3(path[i + 1][1], path[i + 1][0], radius);

            points.push(p1.x, p1.y, p1.z);
            points.push(p2.x, p2.y, p2.z);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    return geometry;
}

export function createWireframeOverlay(scene: THREE.Scene): WireframeOverlay {
    const group = new THREE.Group();

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
                // Scan line effect moving around the globe
                float scanLine = sin(vPosition.y * 8.0 - time * 1.5) * 0.5 + 0.5;
                float alpha = opacity * (0.4 + scanLine * 0.3);

                // Pulse effect
                float pulse = sin(time * 1.2) * 0.1 + 0.9;

                gl_FragColor = vec4(color * pulse, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
    });

    // Create the globe with continents
    const globeRadius = 4.5;
    const globeGeometry = createGlobeGeometry(globeRadius);
    const globe = new THREE.LineSegments(globeGeometry, material);
    group.add(globe);

    scene.add(group);

    return { group, globe, material };
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
    const visibleDuration = 4 + Math.random() * 3; // How long it stays visible (4-7 sec)
    const hiddenDuration = 12 + Math.random() * 18; // Time between appearances (12-30 sec)

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

    // Slow rotation of the globe - Earth-like rotation
    overlay.group.rotation.y += deltaTime * 0.08;

    // Slight axial tilt like Earth
    overlay.group.rotation.x = 0.15;
}
