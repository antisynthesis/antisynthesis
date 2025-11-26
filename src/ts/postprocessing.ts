import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Custom film grain shader
const FilmGrainShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        intensity: { value: 0.015 },
        speed: { value: 0.5 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        uniform float speed;
        varying vec2 vUv;

        // Pseudo-random function
        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // Animated grain
            float grain = random(vUv + time * speed) * 2.0 - 1.0;

            // Apply grain with intensity falloff toward center (vignette-style)
            vec2 center = vUv - 0.5;
            float vignette = 1.0 - dot(center, center) * 0.5;

            color.rgb += grain * intensity * (1.0 - vignette * 0.3);

            // Subtle color variation in grain
            color.r += grain * intensity * 0.02;
            color.b -= grain * intensity * 0.01;

            gl_FragColor = color;
        }
    `,
};

// Vignette shader - smooth edge darkening
const VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        darkness: { value: 0.7 },      // How dark the edges get
        offset: { value: 0.9 },        // How far from center the effect starts
        smoothness: { value: 0.5 },    // Transition smoothness
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float darkness;
        uniform float offset;
        uniform float smoothness;
        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // Calculate distance from center (accounting for aspect ratio would be ideal but this works well)
            vec2 center = vUv - 0.5;
            float dist = length(center) * 2.0;

            // Smooth vignette falloff
            float vignette = smoothstep(offset, offset - smoothness, dist);

            // Apply darkening
            color.rgb *= mix(1.0 - darkness, 1.0, vignette);

            gl_FragColor = color;
        }
    `,
};

// Subtle glitch shader - occasional digital corruption
const GlitchShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        intensity: { value: 0.06 },       // Base intensity
        frequency: { value: 0.12 },       // How often glitches occur
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        uniform float frequency;
        varying vec2 vUv;

        // Pseudo-random functions
        float random(float seed) {
            return fract(sin(seed * 78.233) * 43758.5453);
        }

        float random2(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;

            // Create time-based trigger for glitch (sporadic, not constant)
            float glitchTime = floor(time * 3.0);
            float glitchTrigger = random(glitchTime);

            // Only glitch occasionally (when trigger exceeds threshold)
            float glitchActive = step(1.0 - frequency, glitchTrigger);

            // Subtle horizontal displacement on random scanlines
            float lineNoise = random(floor(uv.y * 80.0) + glitchTime);
            float displacement = (lineNoise - 0.5) * intensity * glitchActive;

            // Apply displacement only to certain lines
            float lineSelect = step(0.85, lineNoise);
            uv.x += displacement * lineSelect;

            // Sample with RGB separation during glitch
            float rgbShift = intensity * 0.5 * glitchActive;
            float r = texture2D(tDiffuse, uv + vec2(rgbShift, 0.0)).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - vec2(rgbShift, 0.0)).b;

            vec4 color = vec4(r, g, b, 1.0);

            // Occasional color shift
            float colorGlitch = random(glitchTime + 0.5) * glitchActive;
            if (colorGlitch > 0.9) {
                color.rgb = color.gbr; // Channel swap on some glitch frames
            }

            gl_FragColor = color;
        }
    `,
};

// Chromatic aberration shader for extra style
const ChromaticAberrationShader = {
    uniforms: {
        tDiffuse: { value: null },
        distortion: { value: 0.00015 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float distortion;
        varying vec2 vUv;

        void main() {
            vec2 center = vUv - 0.5;
            float dist = length(center);
            vec2 dir = center / dist;

            // Increase effect toward edges
            float offset = distortion * dist * dist;

            float r = texture2D(tDiffuse, vUv + dir * offset).r;
            float g = texture2D(tDiffuse, vUv).g;
            float b = texture2D(tDiffuse, vUv - dir * offset).b;

            gl_FragColor = vec4(r, g, b, 1.0);
        }
    `,
};

export interface PostProcessingSetup {
    composer: EffectComposer;
    filmGrainPass: ShaderPass;
    glitchPass: ShaderPass;
    bloomPass: UnrealBloomPass;
    bokehPass: BokehPass;
}

export function setupPostProcessing(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
): PostProcessingSetup {
    const composer = new EffectComposer(renderer);

    // Base render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom - very subtle glow on bright areas
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.15,   // strength
        0.2,    // radius
        0.95    // threshold (only brightest highlights)
    );
    composer.addPass(bloomPass);

    // Depth of field - barely perceptible
    const bokehPass = new BokehPass(scene, camera, {
        focus: 5.0,         // Focus distance (where camera is looking)
        aperture: 0.00001,  // Nearly imperceptible
        maxblur: 0.001,
    });
    composer.addPass(bokehPass);

    // Chromatic aberration - RGB split on edges
    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaticPass);

    // Vignette - darken edges smoothly
    const vignettePass = new ShaderPass(VignetteShader);
    composer.addPass(vignettePass);

    // Glitch - occasional digital corruption
    const glitchPass = new ShaderPass(GlitchShader);
    composer.addPass(glitchPass);

    // Film grain - cinematic texture
    const filmGrainPass = new ShaderPass(FilmGrainShader);
    composer.addPass(filmGrainPass);

    // Output pass - applies tone mapping and color space conversion
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    return { composer, filmGrainPass, glitchPass, bloomPass, bokehPass };
}

export function updatePostProcessing(
    postProcessing: PostProcessingSetup,
    time: number
): void {
    // Animate film grain
    postProcessing.filmGrainPass.uniforms['time'].value = time;
    // Animate glitch effect
    postProcessing.glitchPass.uniforms['time'].value = time;
}

export function resizePostProcessing(
    postProcessing: PostProcessingSetup,
    width: number,
    height: number
): void {
    postProcessing.composer.setSize(width, height);
    postProcessing.bloomPass.resolution.set(width, height);
}
