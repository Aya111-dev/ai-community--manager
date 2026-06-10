import React, { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Carrousel horizontal (scroll-snap) pour plusieurs médias manuels dans le cadre TikTok.
 * Une seule slide : rendu identique à avant (pas de scroll).
 */
export default function TiktokManualMediaCarousel({ files, carouselRef, onSlideIndexChange }) {
  const urls = useMemo(() => (files || []).map((f) => URL.createObjectURL(f)), [files]);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  const handleScroll = useCallback(
    (e) => {
      if (!files || files.length <= 1) return;
      const el = e.currentTarget;
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        const w = el.clientWidth;
        if (w <= 0) return;
        const i = Math.round(el.scrollLeft / w);
        if (i >= 0 && i < files.length) onSlideIndexChange?.(i);
      }, 60);
    },
    [files, onSlideIndexChange]
  );

  if (!files?.length) return null;

  if (files.length === 1) {
    const f = files[0];
    return f.type?.startsWith('video/') ? (
      <video className="story-preview-video" autoPlay muted loop playsInline>
        <source src={urls[0]} />
      </video>
    ) : (
      <img className="story-preview-image" src={urls[0]} alt="" />
    );
  }

  return (
    <div
      className="tiktok-manual-carousel"
      ref={carouselRef}
      onScroll={handleScroll}
    >
      {files.map((file, i) => (
        <div
          key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
          className="tiktok-manual-carousel-slide"
        >
          {file.type?.startsWith('video/') ? (
            <video className="story-preview-video" autoPlay muted loop playsInline>
              <source src={urls[i]} />
            </video>
          ) : (
            <img className="story-preview-image" src={urls[i]} alt={`Média ${i + 1}`} />
          )}
        </div>
      ))}
    </div>
  );
}
