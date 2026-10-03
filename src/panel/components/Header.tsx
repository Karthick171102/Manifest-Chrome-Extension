import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

interface HeaderProps {
  pointerActive: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  pointerActive,
  onToggle,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showHelp) return;
    const onPointerDown = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelp(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHelp(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showHelp]);
  return (
    <header className="shrink-0 px-3 py-2.5 bg-bg border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <img src="icons/logo-light.svg" alt="Manifest" className="h-7 w-auto dark:block hidden" />
          <img src="icons/logo-dark.svg" alt="Manifest" className="h-7 w-auto block dark:hidden" />
          <p className="text-xs text-muted">Inspect, edit & prompt</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`
            px-3 py-1.5 rounded-full text-xs font-semibold border-0 bg-transparent transition-all duration-200
            ${pointerActive
              ? 'bg-accent text-accent-contrast shadow-lg shadow-accent/25 scale-[1.02] animate-pulse'
              : 'text-accent hover:bg-accent/10'}
          `}
          aria-pressed={pointerActive}
          title={pointerActive ? 'Click to cancel selection' : 'Click to inspect an element on the webpage'}
        >
          {pointerActive ? 'Selecting...' : 'Select Element'}
        </button>
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="p-1.5 rounded-lg border border-border hover:bg-border/40 text-muted hover:text-text transition-colors"
            title="How to use"
            aria-label="Help"
            aria-expanded={showHelp}
          >
            <Info className="h-4 w-4" />
          </button>
          {showHelp && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-lg shadow-black/40 p-3 z-50">
              <p className="text-xs font-semibold text-text mb-1">How to use</p>
              <p className="text-xs text-muted leading-relaxed">
                Click <strong className="text-accent font-semibold">"Select Element"</strong>, then
                hover &amp; click any element on the page to inspect and edit it.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;