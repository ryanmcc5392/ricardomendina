import { FC, useMemo, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import fragmentShader from '@/assets/shaders/fragmentShader.glsl';
import vertexShader from '@/assets/shaders/vertexShader.glsl';

interface Props {
  offscreenImage: HTMLImageElement;
  width: number;
  height: number;
}

function getScale(scrollY: number, maxScroll: number) {
  const normalized = Math.min(Math.max(scrollY / maxScroll, 0), 1);
  const scale = 1 - normalized * 0.35;
  return Math.max(0.6, Math.min(1, scale));
}

function getCameraZ(fovDeg: number, planeHeight: number) {
  const fovRad = (fovDeg * Math.PI) / 180;
  return planeHeight / (2 * Math.tan(fovRad / 2));
}

// ScalablePlane component
const ScalablePlane: FC<Props> = ({ offscreenImage }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create texture
  const texture = useMemo(() => {
    const tex = new THREE.Texture(offscreenImage);
    tex.needsUpdate = true;
    return tex;
  }, [offscreenImage]);

  // Shader material
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fragmentShader,
        uniforms: {
          uIntensity: {value: 0.025},
          uMaxOffset: {value: 0.4},
          uScrollProgress: { value: 0 },
          uTexture: { value: texture },
          uTime: { value: 0 },
        },
        vertexShader,
      }),
    [texture]
  );

  // Compute plane geometry to match image aspect ratio
  const imageAspect = offscreenImage.width / offscreenImage.height;
  const planeWidth = imageAspect >= 1 ? imageAspect : 1;
  const planeHeight = imageAspect >= 1 ? 1 : 1 / imageAspect;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Scale based on scroll
    const scrollY = window.scrollY;
    const scale = getScale(scrollY, window.innerHeight);
    meshRef.current.scale.set(scale, scale, 1);

    // Update uniforms
    material.uniforms.uScrollProgress.value = 1.0 - scale;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[planeWidth, planeHeight, 256, 256]} />
      <primitive attach='material' object={material} />
    </mesh>
  );
};

// Scene component
export const Scene: FC<Props> = ({ width, height, offscreenImage }) => {

  const imageAspect = width / width;
  const planeHeight = imageAspect >= 1 ? 1 : 1 / imageAspect;

  const cameraZ = getCameraZ(45, planeHeight); // 45 is your FOV
  return (
    <Canvas className='absolute inset-0 w-full h-full' dpr={Math.min(window.devicePixelRatio, 2)}>
      <PerspectiveCamera
        far={100}
        fov={45}
        makeDefault
        near={0.1}
        position={[0, 0, cameraZ]} // dynamically computed
      />
      <ScalablePlane height={height} offscreenImage={offscreenImage} width={width} />
    </Canvas>
  );
};
