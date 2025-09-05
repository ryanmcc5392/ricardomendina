uniform float uScrollProgress;

varying vec2 vUv;

void main() {
    vUv = uv;

    vec3 newPosition = position;
    newPosition.z -= pow((uv.x - 0.5), 2.0) * 0.35 * 0.3;
    newPosition.z -= pow((uv.y - 0.5), 2.0) * 0.35 * 0.3;
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

}