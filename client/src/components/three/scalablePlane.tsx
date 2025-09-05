import { FC, useEffect,useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as dat from 'dat.gui';
import * as THREE from 'three';

// @ts-expect-error glsl
import fragmentShader from '@/assets/shaders/fragmentShader.glsl';
// @ts-expect-error glsl
import vertexShader from '@/assets/shaders/vertexShader.glsl';
// @ts-expect-error glsl
import videoFragmentShader from '@/assets/shaders/videoFragmentShader.glsl';
// @ts-expect-error glsl
import videoVertexShader from '@/assets/shaders/videoVertexShader.glsl';

interface Props {
  offscreenImage: HTMLImageElement;
  width: number;
  height: number;
  videoShouldPlay: boolean;
}

function getScale(scrollY: number, maxScroll: number) {
  const normalized = Math.min(Math.max(scrollY / maxScroll, 0), 1);
  const scale = 1 - normalized * 0.35;
  return Math.max(0.6, Math.min(1, scale));
}

export const ScalablePlane: FC<Props> = ({ offscreenImage, videoShouldPlay }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const initialLoad = useRef<boolean>(true);
  // Static image texture
  const imageTexture = useMemo(() => {
    const tex = new THREE.Texture(offscreenImage);
    tex.needsUpdate = true;
    return tex;
  }, [offscreenImage]);

  // Noise texture
  const noise = useMemo(() => {
    const img = new Image();
    img.src = '/images/tv-static-1.jpg';
    const tex = new THREE.Texture(img);
    img.onload = () => {
      tex.needsUpdate = true;
    };
    return tex;
  }, []);

  // Video texture
  // Create video texture
  const videoTexture = useMemo(() => {
    const video = document.createElement('video');
    video.src = '/videos/f3.mp4';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.visibility = 'hidden';
    video.style.position = 'fixed';
    video.style.top = '0';
    document.body.appendChild(video);
    videoEl.current = video;

    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBFormat;
    return tex;
  }, []);

  // Plain video material
  const videoMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fragmentShader: videoFragmentShader,
        uniforms: {
          uTexture: { value: videoTexture },
        },
        vertexShader: videoVertexShader,

      }),
    [videoTexture]
  );

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      fragmentShader,
      uniforms: {
        uBlurStrength: { value: 0.015 },
        uGradientColor1: { value: new THREE.Color(235/255, 146/255, 95/255) },
        uGradientColor2: { value: new THREE.Color(235/255, 221/255, 136/255) },
        uGrainStrength: { value: 0.015 },
        uIntensity: { value: 0.03 },
        uMaxGlitchSize: {value: 50.0},
        uMaxOffset: { value: 0.1 },
        uNoise: { value: noise },
        uRadiusDropOff: { value: 0.4 },
        uRGBShift: { value: 0.025 },
        uScrollProgress: { value: 0 },
        uShowNoise: {value: 0},
        uTexture: { value: imageTexture }, // start with image
        uTime: { value: 0 },
      },
      vertexShader,
    });
  }, [noise, imageTexture]);

  const FLASH_DURATION = 200; // in ms
  const flashTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!videoEl.current || !meshRef.current) return;

    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    const video = videoEl.current;
    const mesh = meshRef.current;

    // Cancel any previous timeout
    if (flashTimeout.current) {
      clearTimeout(flashTimeout.current);
      flashTimeout.current = null;
    }

    const flashImageMaterial = () => {
      material.uniforms.uShowNoise.value = 1.0;
      flashTimeout.current = window.setTimeout(() => {
        material.uniforms.uShowNoise.value = 0.0;
        flashTimeout.current = null;
      }, FLASH_DURATION);
    };

    if (videoShouldPlay) {
    // Image → Video: flash first on image material
      flashImageMaterial();

      // After flash, swap to video and play
      flashTimeout.current = window.setTimeout(() => {
        mesh.material = videoMaterial;
        video.play();
        flashTimeout.current = null;
      }, FLASH_DURATION);
    } else {
    // Video → Image: swap to image material first
      mesh.material = material;
      video.pause();

      // Then flash on image material
      flashImageMaterial();
    }

    // Cleanup on unmount
    return () => {
      if (flashTimeout.current) {
        clearTimeout(flashTimeout.current);
        flashTimeout.current = null;
      }
    };
  }, [videoShouldPlay, material, videoMaterial]);

  // Cleanup
  useEffect(() => {
    return () => {
      material.dispose();
      videoTexture.dispose();
      imageTexture.dispose();
      noise.dispose();
      videoEl.current?.pause();
      videoEl.current?.removeAttribute('src');
      videoEl.current?.load();
    };
  }, [material, videoTexture, imageTexture, noise]);

  // Plane geometry scaling
  const imageAspect = offscreenImage.width / offscreenImage.height;
  const planeWidth = imageAspect >= 1 ? imageAspect : 1;
  const planeHeight = imageAspect >= 1 ? 1 : 1 / imageAspect;

  // Animate uniforms + scaling
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const scrollY = window.scrollY;
    const scale = getScale(scrollY, window.innerHeight);
    meshRef.current.scale.set(scale, scale, 1);

    material.uniforms.uScrollProgress.value =
      1.0 - Math.min(1.0, Math.max(Math.pow(scale, 1.5), 0.65));
    material.uniforms.uTime.value += delta;

  });

  // GUI for Tweaks
  useEffect(() => {
    const gui = new dat.GUI();

    const uniforms = material.uniforms as {
      uBlurStrength: { value: number };
      uGrainStrength: { value: number };
      uIntensity: { value: number };
      uMaxOffset: { value: number };
      uMaxGlitchSize: { value: number };
      uRadiusDropOff: { value: number };
      uRGBShift: { value: number };
      uGradientColor1: {value: THREE.Color}
      uGradientColor2: {value:  THREE.Color}
    };

    gui.add(uniforms.uBlurStrength, 'value', 0, 0.1, 0.001).name('Blur Strength');
    gui.add(uniforms.uGrainStrength, 'value', 0, 0.1, 0.001).name('Grain Strength');
    gui.add(uniforms.uIntensity, 'value', 0, 0.2, 0.001).name('Glitch Frequency');
    gui.add(uniforms.uMaxOffset, 'value', 0, 2.0, 0.01).name('Max Glitch Offset');
    gui.add(uniforms.uMaxGlitchSize, 'value', 0, 100.0, 1).name('Glitch sections');
    gui.add(uniforms.uRadiusDropOff, 'value', 0, 1.0, 0.01).name('Radius DropOff');
    gui.add(uniforms.uRGBShift, 'value', 0, 0.2, 0.001).name('RGB Shift');

    const colorSettings = {
      gradientColor1: `#${uniforms.uGradientColor1.value.getHexString()}`,
      gradientColor2: `#${uniforms.uGradientColor2.value.getHexString()}`
    };

    // Add GUI controls
    gui.addColor(colorSettings, 'gradientColor1').name('Gradient Color 1').onChange((val: string) => {
      uniforms.uGradientColor1.value.set(val);
    });

    gui.addColor(colorSettings, 'gradientColor2').name('Gradient Color 2').onChange((val: string) => {
      uniforms.uGradientColor2.value.set(val);
    });

    return () => {
      gui.destroy();
    };
  }, [material]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[planeWidth, planeHeight, 256, 256]} />
      <primitive attach='material' object={material} />
    </mesh>
  );
};
