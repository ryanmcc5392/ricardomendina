import { type FC, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas-pro';

interface Link {
  id: number;
  location: string;
  text: string;
}

const LINKS: Link[] = [
  { id: 1, location: '#', text: 'Reel' },
  { id: 2, location: '#', text: 'Work' },
  { id: 3, location: '#', text: 'About' },
  { id: 4, location: '#', text: 'Contact' },
];

function getScale(scrollY: number, maxScroll: number) {
  const normalized = Math.min(Math.max(scrollY / maxScroll, 0), 1);
  const scale = 1 - normalized * 0.5;
  return Math.max(0.5, Math.min(1, scale));
}

const HomePage: FC = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const offscreenImage = useRef<HTMLImageElement | null>(null);
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
        const img = new Image();
        img.src = canvasCapture.toDataURL();
        offscreenImage.current = img;
        console.log('Offscreen image ready');
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

      const maxScroll = window.innerHeight;
      const scale = getScale(window.scrollY, maxScroll);
      const scrollFactor = Math.min(window.scrollY / maxScroll, 1);
      const intensity = scrollFactor * 20;

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
      ctx.drawImage(img, baseX, baseY, drawWidth, drawHeight);

      // Horizontal slice glitch
      const sliceCount = 10 + scrollFactor * 10;
      for (let i = 0; i < sliceCount; i++) {
        const sliceHeight = Math.floor(drawHeight / sliceCount);
        const y = baseY + i * sliceHeight;
        const xOffset = (Math.random() - 0.5) * intensity;
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

      // Vertical jitter slices
      const jitterCount = 10 + scrollFactor * 6;
      for (let i = 0; i < jitterCount; i++) {
        const sliceWidth = drawWidth / jitterCount;
        const x = baseX + i * sliceWidth;
        const yOffset = (Math.random() - 0.5) * intensity;
        ctx.drawImage(
          img,
          (i * img.width) / jitterCount,
          0,
          img.width / jitterCount,
          img.height,
          x,
          baseY + yOffset,
          sliceWidth,
          drawHeight
        );
      }

      // --- Scanlines with glitch ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(baseX, baseY, drawWidth, drawHeight); // restrict to image bounds
      ctx.clip();

      const lineHeight = 1.5;
      const maxAlpha = 0.7;
      const baseAlpha = 0.0;
      const alphaLines = baseAlpha + scrollFactor * (1 - baseAlpha);
      const alpha = baseAlpha + scrollFactor * (maxAlpha - baseAlpha);

      ctx.fillStyle = `rgba(0,0,0,${alphaLines})`;

      for (let y = baseY; y < baseY + drawHeight; y += lineHeight * 2) {
        ctx.fillRect(baseX, y, drawWidth, lineHeight);
      }

      ctx.restore();

      // --- Refraction gradient overlay ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(baseX, baseY, drawWidth, drawHeight);
      ctx.clip();

      const gradientShift = (performance.now() / 2000) % drawWidth;
      const grad = ctx.createLinearGradient(
        baseX + gradientShift,
        baseY,
        baseX + drawWidth + gradientShift,
        baseY + drawHeight
      );

      grad.addColorStop(0.0, `rgba(255,0,0,${alpha * 0.2})`);
      grad.addColorStop(0.3, `rgba(0,255,255,${alpha * 0.2})`);
      grad.addColorStop(0.6, `rgba(0,0,255,${alpha * 0.2})`);
      grad.addColorStop(1.0, `rgba(255,255,0,${alpha * 0.2})`);

      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(baseX, baseY, drawWidth, drawHeight);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      requestAnimationFrame(draw);
    };

    draw();
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
      // root: el,
      rootMargin: '0px',
      threshold:0,
    });
    observer.observe(el)
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    }
  }, []);

  return (
    <>
      <main className='w-full h-[200dvh]'>
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
                <h1 className='text-[48rem] leading-[120%] font-[400]'>
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
                  <li className='text-[16rem] font-[300]' key={link.id}>
                    <a href={link.location}>{link.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <canvas
            ref={canvas}
            style={{
              height: '100%',
              left: '50%',
              pointerEvents: 'none',
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              willChange: 'transform',
              zIndex: '-1',
            }}
          />
        </section>
      </main>
      <div className='w-full h-[1px]' ref={scroll} />
    </>
  );
};

export default HomePage;
