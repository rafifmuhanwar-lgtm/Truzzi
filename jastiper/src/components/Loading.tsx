import type { ReactNode } from 'react';

/** Overlay loading — meniru LoadingOverlay Flutter. */
export function LoadingOverlay({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      {show && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 rounded-card">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}

export function FullScreenLoader({ text = 'Memuat...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-white text-2xl font-black font-sans">S</span>
        </div>
        <p className="text-sm text-ink-secondary">{text}</p>
      </div>
    </div>
  );
}
