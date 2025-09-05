#include ./random.glsl;
precision mediump float;

uniform float uTime;           // animation time
uniform float uScrollProgress; // scales glitch strength
uniform float uMaxOffset;      // max horizontal offset
uniform float uIntensity;      // 0 = few glitches, 1 = lots
uniform float uMaxGlitchSize;
varying vec2 vUv;
varying vec3 vPosition;

// Simple pseudo-random function
float rand(float x){
    return fract(sin(x) * 43758.5453);
}

void main() {
    vUv = uv;

    vec3 newPosition = position;
    newPosition.z -= pow((uv.x - 0.5), 2.0) * uScrollProgress * 0.3;
    newPosition.z -= pow((uv.y - 0.5), 2.0) * uScrollProgress * 0.3;
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Segment count along Y
    float frequency = mix(uMaxGlitchSize / 2.0, (uScrollProgress / 0.35 * uMaxGlitchSize), rand(uTime));
    float segmentId = floor(modelPosition.y * frequency);

    // Random seed per segment
    float randSeed = random2D(vec2(segmentId, floor(uTime * 5.0 * (uScrollProgress + 0.5)))); 

    // Only glitch some segments based on intensity
    if(randSeed < uIntensity) {
        // Horizontal offset scales with scroll progress
        float offset = (random2D(vec2(segmentId, uTime * 1.3)) - 0.5) * uMaxOffset * uScrollProgress;
        modelPosition.x += offset;
    }

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    vPosition = modelPosition.xyz;
}