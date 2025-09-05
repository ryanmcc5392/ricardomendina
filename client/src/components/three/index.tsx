import { FC } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

// import { EffectComposer, Glitch } from '@react-three/postprocessing';
// import { GlitchMode } from 'postprocessing';
import { ScalablePlane } from './scalablePlane';
interface Props {
  offscreenImage: HTMLImageElement;
  width: number;
  height: number;
  videoShouldPlay: boolean;
}

function getCameraZ(fovDeg: number, planeHeight: number) {
  const fovRad = (fovDeg * Math.PI) / 180;
  return planeHeight / (2 * Math.tan(fovRad / 2));
}

export const Scene: FC<Props> = ({ width, height, offscreenImage, videoShouldPlay }) => {
  const imageAspect = width / height;
  const planeHeight = imageAspect >= 1 ? 1 : 1 / imageAspect;

  const cameraZ = getCameraZ(45, planeHeight);

  return (
    <>
      <Canvas className='absolute inset-0 w-full h-full' dpr={Math.min(window.devicePixelRatio, 2)}>
        <PerspectiveCamera
          far={100}
          fov={45}
          makeDefault
          near={0.1}
          position={[0, 0, cameraZ]}
        />
        <ScalablePlane
          height={height}
          offscreenImage={offscreenImage}
          videoShouldPlay={videoShouldPlay}
          width={width}
        />
        {/* <EffectComposer>
        <Glitch
          delay={[1.5, 3.5]}        // min and max glitch delay
          duration={[0.1, 0.2]}     // min and max glitch duration
          mode={GlitchMode.SPORADIC} // CONSTANT | SPORADIC
          ratio={0.1}              // how often big glitches happen
          strength={[0.1, 0.9]}     // glitch strength
        />
      </EffectComposer> */}
      </Canvas>
    </>

  );
};
