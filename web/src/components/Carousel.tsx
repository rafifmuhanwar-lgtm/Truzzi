import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from './icons';

interface CarouselProps {
  children: React.ReactNode[];
  autoSlide?: boolean;
  autoSlideInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  className?: string;
}

export default function Carousel({
  children,
  autoSlide = true,
  autoSlideInterval = 5000,
  showIndicators = true,
  showArrows = false,
  className = '',
}: CarouselProps) {
  const totalSlides = children.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const dragStartRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);

  // ── Auto-slide: SATU sumber timer (setTimeout berantai) ──
  // Timer dijadwal ulang setiap kali currentIndex berubah → dijamin berurutan.
  // Saat paused (sedang digeser user), tidak ada timer sama sekali.
  useEffect(() => {
    if (!autoSlide || totalSlides <= 1 || pausedRef.current) return;
    const id = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, autoSlideInterval);
    return () => clearTimeout(id);
  }, [autoSlide, autoSlideInterval, totalSlides, currentIndex, paused]);

  const goToSlide = (index: number) => setCurrentIndex((index + totalSlides) % totalSlides);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  // ── Drag / swipe (touch + mouse) ──
  const startDrag = (x: number) => {
    dragStartRef.current = x;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setPaused(true); // pause auto-slide saat user mulai menggeser
  };

  const moveDrag = (x: number) => {
    if (dragStartRef.current === null) return;
    const off = x - dragStartRef.current;
    dragOffsetRef.current = off;
    setDragOffset(off);
  };

  const endDrag = () => {
    if (dragStartRef.current === null) return; // cegah double-fire (touch + synthetic mouse)
    const off = dragOffsetRef.current;
    if (off > 50) prevSlide();
    else if (off < -50) nextSlide();
    dragStartRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setPaused(false); // resume auto-slide dari slide terakhir, tetap berurutan
  };

  const transformX =
    -currentIndex * 100 + (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100;

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Slides container */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${transformX}%)` }}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
        onTouchMove={(e) => {
          if (dragStartRef.current !== null) moveDrag(e.touches[0].clientX);
        }}
        onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientX)}
        onMouseMove={(e) => {
          if (dragStartRef.current !== null) moveDrag(e.clientX);
        }}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {showIndicators && totalSlides > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-border hover:bg-ink-secondary/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg text-primary hover:bg-white transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg text-primary hover:bg-white transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
