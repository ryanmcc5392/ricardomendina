uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    // Desired video aspect ratio
    float videoAspect = 16.0 / 9.0;

    // Current plane aspect ratio (assumes vUv goes 0->1 on both axes)
    float planeAspect = 1.0; // if your plane is square, otherwise pass as uniform

    // Compute scaling factors
    vec2 scale = vec2(1.0, 1.0);
    if (planeAspect > videoAspect) {
        // Plane is wider than 16:9
        scale.x = videoAspect / planeAspect;
    } else {
        // Plane is taller than 16:9
        scale.y = planeAspect / videoAspect;
    }

    // Center the UVs and scale
    vec2 centeredUV = (vUv - 0.5) * scale + 0.5;

    // Sample the texture with corrected UVs
    vec3 baseTex = texture2D(uTexture, centeredUV).rgb;

    gl_FragColor = vec4(baseTex, 1.0);
}
