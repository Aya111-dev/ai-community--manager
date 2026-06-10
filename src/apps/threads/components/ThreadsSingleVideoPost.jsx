import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Repeat2, Send, Volume2, VolumeX, X } from 'lucide-react';

export function isThreadsSocialPost(post) {
  if (!post) return false;
  return post.type === 'text' || post.type === 'video' || post.type === 'carousel';
}

function formatRelativeTime(createdAt) {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 1) return 'maintenant';
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatCompactCount(value) {
  const count = Number(value || 0);
  if (count >= 1000) {
    const compact = count % 1000 === 0 ? `${count / 1000}` : `${(count / 1000).toFixed(1)}`.replace('.', ',');
    return `${compact} K`;
  }
  return `${count}`;
}

function splitThreadBody(body) {
  const raw = String(body || '').trim();
  const hashtags = raw.match(/#[^\s#]+/g) || [];
  const withoutHashtags = raw.replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim();
  return {
    mainText: withoutHashtags || raw,
    hashtags: hashtags.join(' ')
  };
}

function inferMediaKind(post, src, index) {
  const explicitKinds = Array.isArray(post.contentMediaKinds) ? post.contentMediaKinds : [];
  if (explicitKinds[index]) return explicitKinds[index];

  const lowerSrc = String(src || '').toLowerCase();
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(lowerSrc) || lowerSrc.includes('video')) return 'video';
  if (post.type === 'video') return 'video';
  return 'image';
}

function renderVolumeIcon(isMuted) {
  return isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />;
}

export default function ThreadsSingleVideoPost({ post, headerAction = null, className = '', viewMode = 'desktop' }) {
  const displayName = (post.author || '@vous').replace(/^@/, '') || 'vous';
  const { mainText, hashtags } = splitThreadBody(post.body);
  const showAiNotice = post.generationSource === 'ai';
  const isTextPost = post.type === 'text';
  const fallbackText = post.type === 'carousel' ? 'Votre image Threads' : isTextPost ? 'Votre texte Threads' : 'Votre vidéo Threads';
  const fullscreenVideoRef = useRef(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(null);
  const [isFullscreenVideoMuted, setIsFullscreenVideoMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const mediaItems = useMemo(() => {
    const previews = Array.isArray(post.contentPreviews) ? post.contentPreviews.filter(Boolean) : [];
    const sources = previews.length > 0 ? previews : post.contentPreview ? [post.contentPreview] : [];
    return sources.map((src, index) => ({
      src,
      kind: inferMediaKind(post, src, index)
    }));
  }, [post]);
  const hasMultipleMedia = mediaItems.length > 1;
  const activeMediaItem = activeMediaIndex !== null ? mediaItems[activeMediaIndex] : null;
  const isMediaViewerOpen = activeMediaItem !== null;
  const canGoPrev = isMediaViewerOpen && activeMediaIndex > 0;
  const canGoNext = isMediaViewerOpen && activeMediaIndex < mediaItems.length - 1;
  const singleMediaItem = mediaItems[0] || null;

  useEffect(() => {
    if (!isMediaViewerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMediaIndex(null);
      } else if (event.key === 'ArrowLeft' && canGoPrev) {
        setActiveMediaIndex((current) => current - 1);
      } else if (event.key === 'ArrowRight' && canGoNext) {
        setActiveMediaIndex((current) => current + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canGoNext, canGoPrev, isMediaViewerOpen]);

  useEffect(() => {
    if (!isMediaViewerOpen || activeMediaItem?.kind !== 'video') return undefined;
    const video = fullscreenVideoRef.current;
    if (!video) return undefined;

    const syncProgress = () => {
      if (!video.duration) {
        setVideoProgress(0);
        return;
      }
      setVideoProgress((video.currentTime / video.duration) * 100);
    };

    setVideoProgress(0);
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {});

    video.addEventListener('timeupdate', syncProgress);
    video.addEventListener('loadedmetadata', syncProgress);
    return () => {
      video.removeEventListener('timeupdate', syncProgress);
      video.removeEventListener('loadedmetadata', syncProgress);
    };
  }, [activeMediaItem, isMediaViewerOpen]);

  const lightbox =
    isMediaViewerOpen && activeMediaItem && typeof document !== 'undefined'
      ? createPortal(
          <div className="threads-image-lightbox" role="dialog" aria-modal="true" onClick={() => setActiveMediaIndex(null)}>
            <button
              type="button"
              className="threads-image-lightbox-close"
              onClick={(event) => {
                event.stopPropagation();
                setActiveMediaIndex(null);
              }}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <button
              type="button"
              className="threads-image-lightbox-nav threads-image-lightbox-nav-left"
              onClick={(event) => {
                event.stopPropagation();
                if (canGoPrev) setActiveMediaIndex((current) => current - 1);
              }}
              aria-label="Média précédent"
              disabled={!canGoPrev}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="threads-image-lightbox-stage" onClick={(event) => event.stopPropagation()}>
              {activeMediaItem.kind === 'video' ? (
                <div className="threads-video-lightbox-frame">
                  <video
                    ref={fullscreenVideoRef}
                    className="threads-video-lightbox-video"
                    src={activeMediaItem.src}
                    autoPlay
                    muted={isFullscreenVideoMuted}
                    loop
                    playsInline
                  />
                  <div className="threads-video-lightbox-overlay">
                    <div className="threads-video-lightbox-progress-track">
                      <div className="threads-video-lightbox-progress-fill" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <div className="threads-video-lightbox-controls">
                      <button
                        type="button"
                        className="threads-social-video-volume"
                        aria-label={isFullscreenVideoMuted ? 'Activer le son' : 'Couper le son'}
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsFullscreenVideoMuted((current) => !current);
                        }}
                      >
                        {renderVolumeIcon(isFullscreenVideoMuted)}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <img className="threads-image-lightbox-image" src={activeMediaItem.src} alt="" />
              )}
            </div>

            <button
              type="button"
              className="threads-image-lightbox-nav threads-image-lightbox-nav-right"
              onClick={(event) => {
                event.stopPropagation();
                if (canGoNext) setActiveMediaIndex((current) => current + 1);
              }}
              aria-label="Média suivant"
              disabled={!canGoNext}
            >
              <ChevronRight size={18} />
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <article className={`threads-social-post threads-social-post-${viewMode} ${className}`.trim()}>
        <div className="threads-social-header">
          <div className="threads-social-author">
            <div className="threads-social-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div className="threads-social-author-meta">
              <div className="threads-social-author-line">
                <span className="threads-social-name">{displayName}</span>
                <span className="threads-social-verified" aria-hidden="true">
                  ✓
                </span>
                <span className="threads-social-time">{formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {headerAction ? <div className="threads-social-header-action">{headerAction}</div> : null}
        </div>

        <div className="threads-social-body">
          <p className="threads-social-copy">
            <span>{mainText || fallbackText}</span>
            {hashtags ? <span className="threads-social-hashtags"> {hashtags}</span> : null}
            <span className="threads-social-translate">Traduire</span>
          </p>

          {singleMediaItem && !hasMultipleMedia ? (
            singleMediaItem.kind === 'video' ? (
              <div
                className="threads-social-media-shell threads-social-video-shell"
                onClick={() => setActiveMediaIndex(0)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveMediaIndex(0);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <video className="threads-social-video" src={singleMediaItem.src} autoPlay muted loop playsInline />
                <div className="threads-social-video-overlay">
                  <div className="threads-social-video-controls">
                    <button type="button" className="threads-social-video-volume" aria-label="Audio coupé">
                      <VolumeX size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" className="threads-social-image-trigger" onClick={() => setActiveMediaIndex(0)} aria-label="Ouvrir l’image en plein écran">
                <div className="threads-social-media-shell threads-social-image-shell">
                  <img className="threads-social-image" src={singleMediaItem.src} alt="" />
                </div>
              </button>
            )
          ) : null}

          {hasMultipleMedia ? (
            <div className="threads-social-gallery" style={{ gridTemplateColumns: `repeat(${mediaItems.length}, minmax(0, 1fr))` }}>
              {mediaItems.map((item, index) => (
                <button
                  key={`${item.src}-${index}`}
                  type="button"
                  className="threads-social-gallery-item"
                  onClick={() => setActiveMediaIndex(index)}
                  aria-label={`Ouvrir le média ${index + 1}`}
                >
                  {item.kind === 'video' ? (
                    <div className="threads-social-gallery-video">
                      <video className="threads-social-gallery-media" src={item.src} autoPlay muted loop playsInline />
                      <div className="threads-social-gallery-video-overlay">
                        <span className="threads-social-gallery-pill">Video</span>
                      </div>
                    </div>
                  ) : (
                    <img className="threads-social-gallery-media" src={item.src} alt="" />
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {(singleMediaItem || isTextPost || hasMultipleMedia) && showAiNotice ? <div className="threads-social-ai-note">Notice sur l’IA</div> : null}

          <div className="threads-social-actions">
            <span>
              <Heart size={18} />
              {formatCompactCount(post.likes)}
            </span>
            <span>
              <MessageCircle size={18} />
              {formatCompactCount(post.replies)}
            </span>
            <span>
              <Repeat2 size={18} />
              {formatCompactCount(post.reposts)}
            </span>
            <span>
              <Send size={18} />
              {formatCompactCount(post.shares ?? 224)}
            </span>
          </div>
        </div>
      </article>
      {lightbox}
    </>
  );
}
