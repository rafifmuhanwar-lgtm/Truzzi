export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
        <span className="text-white text-2xl font-black font-sans">S</span>
      </div>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-ink-secondary">Memuat...</p>
    </div>
  );
}