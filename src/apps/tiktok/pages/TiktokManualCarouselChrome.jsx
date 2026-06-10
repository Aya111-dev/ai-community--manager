import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Flèches + points au-dessus de l’overlay (z-index), pour carrousel médias manuels.
 */
export default function TiktokManualCarouselChrome({
  count,
  activeIndex,
  onPrev,
  onNext,
  onDotClick
}) {
  if (count <= 1) return null;

  return (
    <div className="tiktok-manual-carousel-chrome" aria-label="Navigation du carrousel">
      <button
        type="button"
        className="tiktok-carousel-fab tiktok-carousel-fab--prev"
        onClick={onPrev}
        aria-label="Média précédent"
      >
        <ChevronLeft size={26} color="#ffffff" strokeWidth={2.5} aria-hidden />
      </button>
      <button
        type="button"
        className="tiktok-carousel-fab tiktok-carousel-fab--next"
        onClick={onNext}
        aria-label="Média suivant"
      >
        <ChevronRight size={26} color="#ffffff" strokeWidth={2.5} aria-hidden />
      </button>
      <div className="tiktok-carousel-dots" role="tablist" aria-label="Slides">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Slide ${i + 1} sur ${count}`}
            className={`tiktok-carousel-dot ${i === activeIndex ? 'is-active' : ''}`}
            onClick={() => onDotClick(i)}
          />
        ))}
      </div>
    </div>
  );
}
