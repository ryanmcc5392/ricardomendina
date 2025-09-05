precision mediump float;

uniform sampler2D uNoise;
uniform sampler2D uTexture;
uniform float uRadiusDropOff;
uniform float uBlurStrength;
uniform float uGrainStrength;
uniform float uRGBShift;
uniform vec3 uGradientColor1;
uniform vec3 uGradientColor2;
uniform float uShowNoise;
uniform float uScrollProgress;
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

// Pseudo-random function
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Multi-sample blur
vec3 blurSample(vec2 uv, float strength) {
    vec3 col = vec3(0.0);
    float total = 0.0;
    for(int x=-1; x<=1; x++) {
        for(int y=-1; y<=1; y++) {
            vec2 offset = vec2(float(x), float(y)) * strength;
            col += texture2D(uTexture, uv + offset).rgb;
            total += 1.0;
        }
    }
    return col / total;
}

void main() {
    float disp = uScrollProgress * 1.2;

    // --- Radial factor ---
    vec2 center = vec2(0.5);
    float distFromCenter = distance(vUv, center);
    float radialFactor = smoothstep(0.0, uRadiusDropOff, distFromCenter);

    // --- Edge gradient for overlay ---
    float edgeFactor = smoothstep(0.035, 0.0, vUv.x);
    edgeFactor += smoothstep(0.965, 1.0, vUv.x);
    edgeFactor = clamp(edgeFactor, 0.0, 1.0) * uScrollProgress;

    // --- Distortion / grain / blur strengths ---
    float distortionStrength = disp * uRGBShift * radialFactor;
    float grainStrength = disp * uGrainStrength * radialFactor;
    float blurStrength = disp * uBlurStrength * radialFactor;

    // --- Chromatic separation ---
    vec2 offsetR = vec2(-distortionStrength * (0.5 + 0.5 * sin(disp + uTime * 2.0)), 0.0);
    vec2 offsetB = vec2(distortionStrength * (0.5 + 0.5 * cos(disp + uTime * 1.5)), 0.0);

    // --- Grain per-pixel ---
    vec2 grainOffset = vec2(
        (rand(vUv * disp * 10.0) - 0.5 + 0.02 * sin(uTime * 10.0)) * grainStrength,
        (rand(vUv * disp * 15.0) - 0.5 + 0.02 * cos(uTime * 7.0)) * grainStrength
    );

    // --- Subtle horizontal glitch ---
    float glitchShift = (rand(vec2(uTime * 10.0, vUv.y)) - 0.5) * distortionStrength * 0.5;

    // --- Blurred texture ---
    vec3 texBlur = blurSample(vUv + grainOffset + vec2(glitchShift, 0.0), blurStrength); 

    // --- Chromatic shift ---
    float r = texture2D(uTexture, vUv + offsetR + grainOffset + vec2(glitchShift, 0.0)).r;
    float g = texBlur.g;
    float b = texture2D(uTexture, vUv + offsetB + grainOffset - vec2(glitchShift, 0.0)).b;

    vec3 baseTex = vec3(r, g, b);
    
    // --- Overlay gradient ---
    float distanceFromMaxGradient = smoothstep(0.5, 0.485, abs(0.5 - vUv.x));
    vec3 gradient = mix(uGradientColor1, uGradientColor2, distanceFromMaxGradient);
    baseTex = mix(baseTex, gradient, edgeFactor * 3.0);

    // add lines
    float stripes = mod((vPosition.y - uTime * 0.005) * 75.0 / uScrollProgress, 1.0);
    stripes = pow(stripes, 2.5);
    baseTex.rgb -= stripes * uScrollProgress * 0.75;

    // --- TV STATIC EFFECT ---
    vec2 noiseUV = vUv * 1.5; // less repetition

    // subtle vertical movement
    noiseUV.y -= sin(uTime * 0.01);

    // random glitch jumps
    float glitch = step(0.8, fract(sin(uTime * 10.0) * 43758.5453));
    noiseUV += glitch * vec2(0.1, 0.0);

    // wrap UVs
    noiseUV = fract(noiseUV);

    // add row-based jitter for glitchiness
    float rowJitter = step(0.8, fract(vUv.y * 50.0 + uTime * 0.01)) * 0.1;
    noiseUV.x += rowJitter;

    // RGB separation
    vec2 offsetRNoise = vec2(0.01 * sin(uTime * 0.9), 0.0);
    vec2 offsetGNoise = vec2(-0.01 * cos(uTime * 0.75), 0.0);
    vec2 offsetBNoise = vec2(0.015 * sin(uTime * 0.67), 0.0);

    float rNoise = texture2D(uNoise, fract(noiseUV + offsetRNoise)).r;
    float gNoise = texture2D(uNoise, fract(noiseUV + offsetGNoise)).g;
    float bNoise = texture2D(uNoise, fract(noiseUV + offsetBNoise)).b;

    vec3 noiseTexture = vec3(rNoise, gNoise, bNoise);

    // blend with base texture
    baseTex = mix(baseTex, noiseTexture, uShowNoise);

    gl_FragColor = vec4(baseTex, 1.0);
}
