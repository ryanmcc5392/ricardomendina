import { type FC, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';

interface Link {
  id: number;
  location: string;
  text: string;
}

// const glitchColors = [
//   [0, 0, 0],      // black
//   [255, 255, 255],// white
//   [255, 0, 0],    // red
//   [0, 255, 0],    // green
//   [0, 0, 255],    // blue
//   [0, 255, 255],  // cyan
//   [255, 0, 255],  // magenta
// ];

const LINKS: Link[] = [
  { id: 1, location: '#', text: 'Reel' },
  { id: 2, location: '#', text: 'Work' },
  { id: 3, location: '#', text: 'About' },
  { id: 4, location: '#', text: 'Contact' },
];

function getScale(scrollY: number, maxScroll: number) {
  const normalized = Math.min(Math.max(scrollY / maxScroll, 0), 1);
  const scale = 1 - normalized * 0.35;
  return Math.max(0.6, Math.min(1, scale));
}

const HomePage: FC = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parent = useRef<HTMLElement | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const offscreenImage = useRef<HTMLImageElement | null>(null);
  const offscreenRed = useRef<HTMLCanvasElement | null>(null);
  const offscreenBlue = useRef<HTMLCanvasElement | null>(null);
  // const blueNoiseImage = useRef<HTMLImageElement | null>(null);
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const videoShouldPlay = useRef<boolean>(false);
  useEffect(() => {
    // Create and load the blue-noise image
    const img = new Image();
    img.src = '/images/noise.jpeg'; // place your PNG in /public
    img.crossOrigin = 'anonymous'; // optional, for CORS-safe drawing
    // img.onload = () => {
    //   blueNoiseImage.current = img;
    //   console.log('Blue noise image loaded');
    // };
  }, []);

  // Capture HTML to image once
  useEffect(() => {
    const el = container.current;
    if (!el) return;

    document.fonts.ready.then(() => {
      html2canvas(el, {
        foreignObjectRendering: true,
        height: el.offsetHeight,
        useCORS: true,
        width: el.offsetWidth,
      }).then((canvasCapture) => {
        // Store the base image
        const baseImg = new Image();
        baseImg.src = canvasCapture.toDataURL();
        offscreenImage.current = baseImg;

        const ctxCapture = canvasCapture.getContext('2d');
        if (!ctxCapture) return;

        const imgData = ctxCapture.getImageData(0, 0, canvasCapture.width, canvasCapture.height);

        // --- Offscreen canvases for red and blue layers ---
        const redCanvas = document.createElement('canvas');
        redCanvas.width = canvasCapture.width;
        redCanvas.height = canvasCapture.height;
        const redCtx = redCanvas.getContext('2d')!;
        const redImgData = redCtx.createImageData(canvasCapture.width, canvasCapture.height);

        const blueCanvas = document.createElement('canvas');
        blueCanvas.width = canvasCapture.width;
        blueCanvas.height = canvasCapture.height;
        const blueCtx = blueCanvas.getContext('2d')!;
        const blueImgData = blueCtx.createImageData(canvasCapture.width, canvasCapture.height);

        for (let i = 0; i < imgData.data.length; i += 4) {
          const r = imgData.data[i];
          const g = imgData.data[i + 1];
          const b = imgData.data[i + 2];
          const a = imgData.data[i + 3];

          if (r < 50 && g < 50 && b < 50) {
            // Red
            redImgData.data[i] = 255;
            redImgData.data[i + 1] = 80;
            redImgData.data[i + 2] =  50;
            redImgData.data[i + 3] = a;

            // Blue
            blueImgData.data[i] = 80;
            blueImgData.data[i + 1] = 160;
            blueImgData.data[i + 2] = 255;
            blueImgData.data[i + 3] = a;
          }
        }

        redCtx.putImageData(redImgData, 0, 0);
        blueCtx.putImageData(blueImgData, 0, 0);

        // Store offscreen canvases
        offscreenRed.current = redCanvas;
        offscreenBlue.current = blueCanvas;

        console.log('Precomputed red/blue canvases ready');
      });
    });
    const onScroll = () => {
      if (!el) return;
      el.style.opacity = window.scrollY > 0 ? '0' : '1';
      el.style.pointerEvents = window.scrollY > 0 ? 'none' : 'auto';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Draw onto visible canvas each frame
  useEffect(() => {
    const canvasEl = canvas.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const img = offscreenImage.current;
      if (!img) {
        requestAnimationFrame(draw);
        return;
      }

      const rect = canvasEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // const maxScroll = parent.current ? parent.current.getBoundingClientRect().height : window.innerHeight;
      const maxScroll = window.innerHeight;
      const scale = getScale(window.scrollY, maxScroll);
      const scrollFactor = Math.min(window.scrollY / maxScroll, 1);
      const intensity = scrollFactor * 3;

      // Maintain aspect ratio
      const imgRatio = img.width / img.height;
      const canvasRatio = rect.width / rect.height;
      let drawWidth, drawHeight;
      if (canvasRatio > imgRatio) {
        drawHeight = rect.height * scale;
        drawWidth = drawHeight * imgRatio;
      } else {
        drawWidth = rect.width * scale;
        drawHeight = drawWidth / imgRatio;
      }
      const baseX = (rect.width - drawWidth) / 2;
      const baseY = (rect.height - drawHeight) / 2;

      if (videoEl.current && videoShouldPlay.current) {
        ctx.drawImage(videoEl.current, baseX, baseY, drawWidth, drawHeight);
        videoEl.current.play().then(() => {
          requestAnimationFrame(draw);
        });
        return;
      }

      // Draw base image
      ctx.fillStyle = '#EBEBEB';
      ctx.fillRect(baseX, baseY, drawWidth, drawHeight);
      ctx.drawImage(img, baseX, baseY, drawWidth, drawHeight);
      // Horizontal slice glitch
      const minSlices = 1;      // minimum number of slices
      const maxSlices = 10;      // maximum number of slices at max scroll
      const sliceCount = minSlices + Math.floor(scrollFactor * (maxSlices - minSlices));

      for (let i = 0; i < sliceCount; i++) {
        const sliceHeight = Math.floor(drawHeight / sliceCount);
        const y = baseY + i * sliceHeight;

        // Make offset more intense
        const maxOffset = 1 + (intensity * 0.5); // maximum pixels to shift
        const xOffset = (Math.random() - 0.5) * intensity * maxOffset;

        ctx.drawImage(
          img,
          0,
          (i * img.height) / sliceCount,
          img.width,
          img.height / sliceCount,
          baseX + xOffset,
          y,
          drawWidth,
          sliceHeight
        );
      }

      //Vertical jitter slices
      // const jitterCount = 10 + scrollFactor * 6;
      // for (let i = 0; i < jitterCount; i++) {
      //   const sliceWidth = drawWidth / jitterCount;
      //   const x = baseX + i * sliceWidth;
      //   const yOffset = (Math.random() - 0.5) * intensity;
      //   // Compute max safe offset so the slice never overflows vertically
      //   const maxOffset = img.height - drawHeight;

      //   // Clamp yOffset between 0 and maxOffset
      //   const safeYOffset = Math.max(0, Math.min(yOffset, maxOffset));

      //   ctx.drawImage(
      //     img,
      //     (i * img.width) / jitterCount, // source x
      //     0,                             // source y
      //     img.width / jitterCount,       // source width
      //     img.height,                    // source height
      //     x,                             // dest x
      //     baseY + safeYOffset,           // dest y
      //     sliceWidth,                    // dest width
      //     drawHeight                     // dest height
      //   );
      // }

      // --- Precomputed red/blue glitch layers ---
      if (offscreenRed.current && offscreenBlue.current) {
        ctx.save();

        const scrollFactor = Math.min(window.scrollY / maxScroll, 1);
        const maxOffset = 10; // maximum separation in pixels

        const redOffset = scrollFactor * maxOffset;   // move right as scroll increases
        const blueOffset = -scrollFactor * maxOffset; // move left as scroll increases

        ctx.globalAlpha = scrollFactor * 0.8;

        ctx.drawImage(offscreenRed.current, baseX + redOffset, baseY, drawWidth, drawHeight);
        ctx.drawImage(offscreenBlue.current, baseX + blueOffset, baseY, drawWidth, drawHeight);

        ctx.restore();
      }

      // --- Scanlines with glitch ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(baseX, baseY, drawWidth, drawHeight); // restrict to image bounds
      ctx.clip();

      const lineHeight = 1.5 + (intensity * 0.2);
      const maxAlpha = 0.6;
      const baseAlpha = 0.0;
      const alpha = baseAlpha + scrollFactor * (maxAlpha - baseAlpha);

      //const [r, g, b] = glitchColors[Math.floor(Math.random() * glitchColors.length)];
      const [r, g, b] = [0,0,0];
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha - 0.1})`;
      for (let y = baseY; y < baseY + drawHeight; y += lineHeight * 2) {
        ctx.fillRect(baseX, y, drawWidth, lineHeight);
      }

      for (let x = baseX; x < baseX + drawWidth; x += lineHeight * 2) {
        ctx.fillRect(x, baseY, lineHeight, drawHeight);
      }
      ctx.restore();

      // --- Refraction gradient overlay ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(baseX, baseY, drawWidth, drawHeight);
      ctx.clip();

      const gradientMaxAlpha = 1.0;
      const gradientBaseAlpha = 0.1;
      const gradientAlpha = gradientBaseAlpha + scrollFactor + 0.5 * (gradientMaxAlpha - gradientBaseAlpha);

      // left → right, but mirrored around the center
      const grad = ctx.createLinearGradient(
        baseX, baseY,
        baseX + drawWidth, baseY
      );

      grad.addColorStop(0.0, `rgba(235,131,81,${gradientAlpha})`);
      grad.addColorStop(0.02, `rgba(235,215,137,${gradientAlpha})`);
      grad.addColorStop(0.04, `rgba(235,235,235,${gradientAlpha})`);
      grad.addColorStop(0.96, `rgba(235,235,235,${gradientAlpha})`);
      grad.addColorStop(0.98, `rgba(235,215,137,${gradientAlpha})`);
      grad.addColorStop(1.0, `rgba(235,131,81,${gradientAlpha})`);

      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(baseX, baseY, drawWidth, drawHeight);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  const [scrollState, setScrollState] = useState(0);
  console.log(scrollState)
  useEffect(() => {
    const onScroll = () => setScrollState(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!videoEl.current) {
          const video = document.createElement('video');
          video.src = '/videos/f3.mp4';
          video.muted = true;
          video.autoplay = true;
          video.loop = true;
          video.playsInline = true;

          video.addEventListener('loadeddata', () => {
            videoEl.current = video;
            videoShouldPlay.current = true;
          })
        } else {
          videoShouldPlay.current = true;
        }
      } else {
        if (videoEl.current) {
          videoEl.current.pause();
        }
        videoShouldPlay.current = false;
      }
    }, {
      rootMargin: '0px',
      threshold:0,
    });
    observer.observe(el)
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    }
  }, []);
  // const maxBlur = 50; // maximum blur in px
  // const scrollFactor = 0.05; // how quickly blur increases with scroll
  return (
    <>
      <main 
        className='w-full h-[200dvh]'
        ref={parent}
      >
        <section className='sticky top-0 h-[100dvh] w-full flex items-center justify-center'>
          <div
            className='grid grid-cols-10 h-[100dvh] w-full bg-background-1 relative z-[1]'
            ref={container}
          >
            <div className='col-start-2 col-span-6 flex flex-col pt-[123rem] gap-[80rem]'>
              <div className='text-[20rem] leading-[150%]'>
                <p>Ricardo Medina,</p>
                <p>Product & Design Leader</p>
              </div>
              <div className='flex-1 flex flex-col justify-center gap-[20rem]'>
                <h1 className='text-[50rem] leading-[120%] font-[400] font-warbler-deck'>
              I help founders grow their business through emerging technology and design.
                </h1>
                <div className='w-[144rem] bg-[#D9D9D9] h-[2rem]' />
                <p className='leading-[150%] text-[16rem]'>
              Currently leading a global team at UK's{' '}
                  <a href='https://www.format-3.co'>
                    <u>Startup of the year</u>
                  </a>{' '}
                  <strong>Format-3</strong>
                </p>
              </div>
            </div>

            <div className='col-start-9 col-span-1 flex flex-col'>
              <ul className='flex flex-col gap-[23rem] pt-[202rem]'>
                {LINKS.map((link) => (
                  <li className='text-[16rem] font-[300] font-pt-mono' key={link.id}>
                    <a href={link.location}>{link.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <canvas
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0'
            ref={canvas}
          />

          {/* <div className='absolute w-full h-full'>
            <canvas
              className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0'
              ref={canvas}
            />
            <div
              className='absolute top-0 left-0 w-full h-full pointer-events-none z-10'
              style={{
                backdropFilter: `blur(${Math.min(maxBlur, scrollState * scrollFactor)}px)`,
                WebkitBackdropFilter: `blur(${Math.min(maxBlur, scrollState * scrollFactor)}px)`,
                maskImage: `radial-gradient(circle at center, rgba(0,0,0,0) ${Math.min(maxBlur, scrollState * scrollFactor)}%, rgba(0,0,0,1) 100%)`,
                WebkitMaskImage: `radial-gradient(circle at center, rgba(0,0,0,0) ${Math.min(maxBlur, scrollState * scrollFactor)}%, rgba(0,0,0,1) 100%)`,
              }}
            />
          </div> */}
        </section>
      </main>
      <div className='w-full h-[1px]' ref={scroll} />
    </>
  );
};

export default HomePage;
