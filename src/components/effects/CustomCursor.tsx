import { useEffect, useRef, useState } from 'react';

/**
 * Modern cursor: small dot + larger trailing ring with gradient glow.
 * Hides on touch devices. Scales up on interactive elements.
 */
export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setEnabled(true);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
      }
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"]');
      if (ringRef.current) {
        ringRef.current.dataset.hover = interactive ? '1' : '0';
      }
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    document.documentElement.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-9 w-9 rounded-full
                   border border-primary/60
                   bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_70%)]
                   backdrop-blur-[2px]
                   transition-[width,height,opacity,border-color] duration-200 ease-out
                   data-[hover='1']:scale-[1.6] data-[hover='1']:border-primary
                   data-[hover='1']:bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.28),transparent_70%)]
                   will-change-transform"
        data-hover="0"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 rounded-full
                   bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]
                   will-change-transform"
      />
    </>
  );
};
