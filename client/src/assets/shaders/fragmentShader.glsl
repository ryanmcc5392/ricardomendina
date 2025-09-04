precision mediump float;

uniform sampler2D uTexture;
uniform float uScrollProgress;
uniform float uTime; // time-based animation
varying vec2 vUv;

// Pseudo-random function for grain
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Multi-sample blur function
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
    float disp = uScrollProgress * 0.5;

    // --- Compute radial factor ---
    vec2 center = vec2(0.5);
    float distFromCenter = distance(vUv, center);
    float radialFactor = smoothstep(0.0, 0.5, distFromCenter); // 0 center, 1 edges

    // --- Edge gradient for orange overlay ---
    float edgeFactor = smoothstep(0.03, 0.0, vUv.x);       // left edge
    edgeFactor += smoothstep(0.97, 1.0, vUv.x);            // right edge
    edgeFactor = clamp(edgeFactor, 0.0, 1.0) * uScrollProgress;

    // --- Strengths scaled by radial factor ---
    float distortionStrength = disp * 0.03 * radialFactor;
    float grainStrength = disp * 0.008 * radialFactor;
    float blurStrength = disp * 0.015 * radialFactor;

    // --- Chromatic separation ---
    vec2 offsetR = vec2(-distortionStrength * (0.5 + 0.5 * sin(disp + uTime * 2.0)), 0.0);
    vec2 offsetB = vec2(distortionStrength * (0.5 + 0.5 * cos(disp + uTime * 1.5)), 0.0);

    // --- Grain per-pixel ---
    vec2 grainOffset = vec2(
        (rand(vUv * disp * 10.0) - 0.5 + 0.02 * sin(uTime * 10.0)) * grainStrength,
        (rand(vUv * disp * 15.0) - 0.5 + 0.02 * cos(uTime * 7.0)) * grainStrength
    );

    // --- Subtle glitch horizontal shift ---
    float glitchShift = (rand(vec2(uTime * 10.0, vUv.y)) - 0.5) * distortionStrength * 0.5;

    // --- Sample blurred texture ---
    vec3 texBlur = blurSample(vUv + grainOffset + vec2(glitchShift, 0.0), blurStrength);

    // --- Chromatic shift ---
    float r = texture2D(uTexture, vUv + offsetR + grainOffset + vec2(glitchShift, 0.0)).r;
    float g = texBlur.g;
    float b = texture2D(uTexture, vUv + offsetB + grainOffset - vec2(glitchShift, 0.0)).b;

    vec3 baseTex = vec3(r, g, b);

    // --- Wavy black lines ---
    float frequency = 10.0;
    float amplitude = 0.02;
    float speed = 2.0;
    float wave = sin(vUv.x * frequency + uTime * speed) * amplitude;

    float lineStrength = mod(vUv.y * 50.0 + wave, 1.0);
    lineStrength = lineStrength < 0.5 ? 0.0 : 0.0; // keep subtle, almost invisible
    baseTex.rgb -= lineStrength;

    vec3 orange = vec3(235.0/255.0, 146.0/255.0, 95.0/255.0);;
    vec3 yellow = vec3(235.0/255.0, 221.0/255.0, 136.0/255.0);
    vec3 overlayColor = vec3(249.0/255.0, 244.0/255.0, 178.0/255.0);
    float distanceFromMaxGradient = smoothstep(0.5, 0.49, abs(0.5 - vUv.x));
    vec3 gradient = mix(orange, yellow, distanceFromMaxGradient);
    //baseTex = mix(baseTex, overlayColor, uScrollProgress);
    baseTex = mix(baseTex, gradient, edgeFactor * 3.7);
    gl_FragColor = vec4(baseTex, 1.0);
}
