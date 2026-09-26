import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Boxes, Package, PackagePlus, Warehouse } from 'lucide-react';

const WORD = 'StockSense';
const PLAY_MS = 3400;
const EXIT_MS = 480;

export function StartupScreen({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);
  const finished = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setExiting(true);
    window.setTimeout(onComplete, EXIT_MS);
  }, [onComplete]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(finish, reduce ? 350 : PLAY_MS);
    return () => window.clearTimeout(timer);
  }, [finish]);

  useEffect(() => {
    rootRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="StockSense starting"
      aria-live="polite"
      onClick={finish}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          finish();
        }
      }}
      tabIndex={0}
      ref={rootRef}
      className={`fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-zinc-950 outline-none transition-opacity duration-500 ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,_rgba(99,102,241,0.14),transparent_40%)]" />
      <div className="splash-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />

      <div className="relative flex flex-col items-center px-6">
        <div className="relative mb-10 flex h-36 w-36 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-blue-400/20 animate-splash-ring" />
          <span
            className="absolute inset-[-14px] rounded-full border border-indigo-400/15 animate-splash-ring"
            style={{ animationDelay: '0.45s' }}
          />
          <span
            className="absolute inset-[-28px] rounded-full border border-blue-500/10 animate-splash-ring"
            style={{ animationDelay: '0.9s' }}
          />

          <div className="absolute inset-[-42px] animate-splash-orbit">
            <OrbitIcon className="absolute left-0 top-1/2 -translate-y-1/2" icon={ArrowLeftRight} delay="0.1s" />
            <OrbitIcon className="absolute left-1/2 top-0 -translate-x-1/2" icon={Package} delay="0s" />
            <OrbitIcon className="absolute right-0 top-1/2 -translate-y-1/2" icon={Warehouse} delay="0.15s" />
            <OrbitIcon className="absolute bottom-0 left-1/2 -translate-x-1/2" icon={PackagePlus} delay="0.3s" />
          </div>

          <div className="relative animate-splash-logo">
            <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white animate-splash-pulse-glow">
              <Boxes size={42} strokeWidth={1.75} />
            </div>
          </div>
        </div>

        <h1 className="flex text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          {WORD.split('').map((letter, i) => (
            <span
              key={`${letter}-${i}`}
              className="inline-block animate-splash-letter opacity-0"
              style={{ animationDelay: `${0.2 + i * 0.05}s` }}
            >
              {letter}
            </span>
          ))}
        </h1>
        <p
          className="mt-3 animate-splash-letter text-sm tracking-wide text-zinc-400 opacity-0 sm:text-base"
          style={{ animationDelay: '0.75s' }}
        >
          Inventory intelligence, in motion
        </p>

        <div className="mt-10 w-48">
          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 animate-splash-bar" />
          </div>
          <p
            className="mt-3 animate-splash-letter text-center text-[11px] uppercase tracking-[0.22em] text-zinc-500 opacity-0"
            style={{ animationDelay: '0.9s' }}
          >
            Loading workspace
          </p>
        </div>

        <p
          className="mt-12 animate-splash-letter text-xs text-zinc-600 opacity-0"
          style={{ animationDelay: '1.15s' }}
        >
          Click anywhere to skip
        </p>
      </div>
    </div>
  );
}

function OrbitIcon({
  icon: Icon,
  className,
  delay,
}: {
  icon: typeof Package;
  className: string;
  delay: string;
}) {
  return (
    <span
      className={`${className} flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/90 text-blue-400 shadow-glow-sm animate-splash-orbit-rev`}
      style={{ animationDelay: delay }}
    >
      <Icon size={14} />
    </span>
  );
}
