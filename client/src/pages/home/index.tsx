import { type FC, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';

import { Scene } from '@/components/three';

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

const HomePage: FC = () => {
  const parent = useRef<HTMLElement | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const canvasContainer = useRef<HTMLDivElement | null>(null);
  const [offscreenImage, setOffscreenImage]= useState<HTMLImageElement | null>(null);
  const [videoShouldPlay, setVideoShouldPlay] = useState(false);

  // Store canvas container size
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  
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
        const baseImg = new Image();
        baseImg.src = canvasCapture.toDataURL();
        setOffscreenImage(baseImg);
      });
    });

    const onScroll = () => {
      if (!el || !canvasContainer.current) return;
      el.style.opacity = window.scrollY > 0 ? '0' : '1';
      el.style.pointerEvents = window.scrollY > 0 ? 'none' : 'auto';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Set canvas size on mount & resize
  useEffect(() => {
    if (!canvasContainer.current) return;

    const updateSize = () => {
      setCanvasSize({
        height: canvasContainer.current!.clientHeight,
        width: canvasContainer.current!.clientWidth,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVideoShouldPlay(true);
      } else {
        setVideoShouldPlay(false);
      }
    }, {
      rootMargin: '0px',
      threshold: 0,
    });

    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <main className='w-full' ref={parent}>
        <section className='sticky top-0 h-[100dvh] w-full flex items-center justify-center'>
          <div
            className='grid grid-cols-10 h-[100dvh] w-full bg-background-1 relative z-[1]'
            ref={container}
            //style={{ opacity: 0 }}
          >
            {/* Content remains unchanged */}
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
                  <a href='https://www.format-3.co'><u>Startup of the year</u></a>{' '}
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

          <section
            className='absolute inset-0 w-full h-full will-change-transform'
            ref={canvasContainer}
            style={{ transformOrigin: 'center center' }}
          >
            {/* Only render Scene once we have canvas size */}
            {canvasSize && offscreenImage && (
              <Scene 
                height={canvasSize.height} 
                offscreenImage={offscreenImage} 
                videoShouldPlay={videoShouldPlay}
                width={canvasSize.width} 
              />
            )}
          </section>
        </section>
        {/* filler sections for scrolling */}
        <section className='w-full h-[100dvh]' />
        <div className='w-full h-[1px' ref={scroll} />
        <section className='w-full h-[100dvh]' />
      </main>

    </>
  );
};

export default HomePage;
