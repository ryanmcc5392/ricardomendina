#include ./random.glsl;
precision mediump float;

uniform float uTime;           // animation time
uniform float uScrollProgress; // scales glitch strength
uniform float uMaxOffset;      // max horizontal offset
uniform float uIntensity;      // 0 = few glitches, 1 = lots

varying vec2 vUv;

void main() {
    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Segment count along Y
    float frequency = 40.0; // more segments
    float segmentId = floor(modelPosition.y * frequency);

    // Random seed per segment
    float randSeed = random2D(vec2(segmentId, floor(uTime * 5.0))); 

    // Only glitch some segments based on intensity
    if(randSeed < uIntensity) {
        // Horizontal offset scales with scroll progress
        float offset = (random2D(vec2(segmentId, uTime * 1.3)) - 0.5) * uMaxOffset * uScrollProgress;
        modelPosition.x += offset;
    }

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}