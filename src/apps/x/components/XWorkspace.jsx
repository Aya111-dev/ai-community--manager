import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlignJustify, BadgeCheck, BarChart2, Bookmark, CalendarDays, Captions, ChevronLeft, Expand, Hash, Heart, Image, MessageCircle, Monitor, MoreHorizontal, MoreVertical, Pause, PenLine, PictureInPicture2, Play, Plus, Repeat2, Send, Settings, Smartphone, Sparkles, Trash2, Upload, Video, Volume1, Volume2, VolumeX, X as XCloseIcon } from 'lucide-react';
import { generateContent, generateHashtags, generateMedia } from '../../../services/api.js';

const typeConfig = {
  text: { label: 'Text', accept: '', maxMedia: 0, aiKind: 'text', mediaLabel: 'Media' },
  image: { label: 'Image', accept: 'image/*', maxMedia: 4, aiKind: 'image', mediaLabel: 'Media' },
  video: { label: 'Video', accept: 'video/*', maxMedia: 1, aiKind: 'video', mediaLabel: 'Media' },
  thread: { label: 'Thread', accept: '', maxMedia: 0, aiKind: 'text', mediaLabel: 'Media' },
};

const fakeImagePool = [
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=70'
];

const fakeVideoPool = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/river.mp4'
];
const X_POSTS_STORAGE_KEY = 'x-workspace-posts-v1';

const formatHourOnly = (value) => {
  if (!value || typeof value !== 'string') return '';
  const [, timePart] = value.split('T');
  if (!timePart) return '';
  const [hour] = timePart.split(':');
  if (!hour) return '';
  return `${Number(hour)}h`;
};

const formatDuration = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const buildHashtagsFromText = (text) => {
  const words = String(text || '')
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 2)
    .slice(0, 3);
  if (!words.length) return '#x #thread';
  return words.map((word) => `#${word}`).join(' ');
};

/** Légende de démo si le post n’a pas encore de texte (arabe, comme sur X). */
const X_VIDEO_CAPTION_FALLBACK_AR = 'مشهد من المدرجات — أجواء رائعة ومشاركة جميلة من الجمهور.';

function XVideoMedia({
  src,
  deviceView = 'Desktop',
  videoPortalHostRef = null,
  caption = '',
  authorName = 'Berlin',
  authorHandle = '@realmfberlin',
  authorAvatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60',
}) {
  const videoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(deviceView !== 'Mobile');
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const getActiveVideo = () => (isExpanded && modalVideoRef.current ? modalVideoRef.current : videoRef.current);

  const closeExpanded = () => {
    const inline = videoRef.current;
    const modal = modalVideoRef.current;
    if (inline && modal) {
      try {
        inline.currentTime = modal.currentTime;
      } catch (_) {
        // ignore
      }
    }
    setIsExpanded(false);
  };

  const togglePlayback = async () => {
    const el = getActiveVideo();
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch (_) {
        setIsPlaying(false);
      }
      return;
    }
    el.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const el = getActiveVideo();
    if (!el) return;
    const nextMuted = !isMuted;
    el.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const applyPlaybackRate = (rate) => {
    const el = getActiveVideo();
    if (!el) return;
    el.playbackRate = rate;
    setPlaybackSpeed(rate);
    setShowSettings(false);
  };

  const togglePictureInPicture = async () => {
    const element = getActiveVideo();
    if (!element || typeof document === 'undefined' || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await element.requestPictureInPicture();
      }
    } catch (_) {
      // Ignore blocked browser actions.
    }
  };

  const toggleFullscreen = async () => {
    const element = getActiveVideo();
    if (!element) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch (_) {
      // Ignore blocked browser actions.
    }
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  useEffect(() => {
    const el = getActiveVideo();
    if (!el) return;
    el.volume = volume;
    el.muted = isMuted;
  }, [isMuted, volume, isExpanded]);

  useEffect(() => {
    if (!isExpanded) {
      if (deviceView !== 'Mobile') {
        videoRef.current?.play?.().catch(() => {});
      } else {
        videoRef.current?.pause?.();
      }
      return;
    }
    videoRef.current?.pause?.();
    const id = requestAnimationFrame(() => {
      const from = videoRef.current;
      const to = modalVideoRef.current;
      if (from && to) {
        try {
          to.currentTime = from.currentTime;
        } catch (_) {
          // ignore
        }
        to.volume = volume;
        to.muted = isMuted;
        to.play().catch(() => {});
      }
    });
    return () => cancelAnimationFrame(id);
  }, [isExpanded, volume, isMuted, deviceView]);

  const expandedCaption = (caption && String(caption).trim()) ? String(caption).trim() : X_VIDEO_CAPTION_FALLBACK_AR;

  const mobileExpandedChrome = (
    <div
      className="x-video-mobile-overlay x-image-viewer-overlay--mobile x-image-viewer-overlay--in-phone"
      role="dialog"
      aria-modal="true"
      onClick={closeExpanded}
    >
      <div className="x-video-mobile-inner" onClick={(event) => event.stopPropagation()}>
        <div className="x-video-mobile-body">
          <video
            ref={modalVideoRef}
            className="x-video-mobile-fill"
            src={src}
            loop
            playsInline
            muted={isMuted}
            onLoadedMetadata={(event) => {
              const el = event.currentTarget;
              setDuration(el.duration || 0);
              setPlaybackSpeed(el.playbackRate || 1);
            }}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <header className="x-video-mobile-topbar">
            <button type="button" className="x-image-viewer-mobile-icon-btn x-video-mobile-fs-icon" onClick={closeExpanded} aria-label="Retour">
              <ChevronLeft size={26} strokeWidth={2.2} />
            </button>
            <button type="button" className="x-image-viewer-mobile-icon-btn x-video-mobile-fs-icon" aria-label="Plus d'options">
              <MoreVertical size={22} strokeWidth={2.2} />
            </button>
          </header>
          <div className="x-video-mobile-gradient" aria-hidden="true" />
          <div className="x-video-mobile-chrome" onClick={(event) => event.stopPropagation()}>
            <div className="x-video-mobile-poster-row">
              <img className="x-video-mobile-mini-avatar" src={authorAvatarUrl} alt="" />
              <div className="x-video-mobile-poster-meta">
                <div className="x-video-mobile-handle-line">
                  <strong className="x-video-mobile-handle">{authorHandle}</strong>
                  <BadgeCheck className="x-video-mobile-verified" size={17} aria-hidden="true" />
                </div>
              </div>
              <button type="button" className="x-video-mobile-follow">
                Suivre
              </button>
            </div>
            <p className="x-video-mobile-caption" dir="auto">
              {expandedCaption}
            </p>
            <div className="x-video-mobile-engage">
              <button type="button" className="x-video-mobile-engage-pill" aria-label="Commentaires">
                <MessageCircle size={17} strokeWidth={2} />
                <span className="x-video-mobile-engage-count">138</span>
              </button>
              <button type="button" className="x-video-mobile-engage-pill" aria-label="Reposts">
                <Repeat2 size={17} strokeWidth={2} />
                <span className="x-video-mobile-engage-count">13,6k</span>
              </button>
              <button type="button" className="x-video-mobile-engage-pill" aria-label="J'aime">
                <Heart size={17} strokeWidth={2} />
                <span className="x-video-mobile-engage-count">190k</span>
              </button>
              <button type="button" className="x-video-mobile-engage-circle" aria-label="Enregistrer">
                <Bookmark size={17} strokeWidth={2} />
              </button>
              <button type="button" className="x-video-mobile-engage-circle" aria-label="Partager">
                <Upload size={17} strokeWidth={2} />
              </button>
            </div>
            <div className="x-video-mobile-playback">
              <div className="x-video-progress">
                <span style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <div className="x-video-controls x-video-controls--mobile-fs">
                <div className="x-video-controls-left">
                  <button type="button" className="x-video-ctrl-btn" onClick={togglePlayback} aria-label="Lecture / Pause">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <span className="x-video-mobile-remain">
                    -{formatDuration(Math.max(0, duration - currentTime))}
                  </span>
                </div>
                <button
                  type="button"
                  className="x-video-mobile-rate x-video-mobile-rate-btn"
                  onClick={() => setShowSettings((prev) => !prev)}
                  aria-label="Vitesse de lecture"
                >
                  {playbackSpeed}x
                </button>
                <div className="x-video-controls-right">
                  <button type="button" className="x-video-ctrl-btn" onClick={toggleMute} aria-label="Son">
                    <VolumeIcon size={14} />
                  </button>
                  <button type="button" className="x-video-ctrl-btn" onClick={toggleFullscreen} aria-label="Plein écran">
                    <Expand size={14} />
                  </button>
                  <button type="button" className="x-video-ctrl-btn" onClick={() => setShowSettings((prev) => !prev)} aria-label="Paramètres">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
              {showSettings ? (
                <div className="x-video-settings-menu x-video-settings-menu--mobile-fs">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <button key={rate} type="button" onClick={() => applyPlaybackRate(rate)}>
                      Vitesse x{rate}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`x-video-wrap${deviceView === 'Mobile' ? ' x-video-wrap--mobile-feed' : ''}`}
        onClick={() => setIsExpanded(true)}
      >
        <video
          ref={videoRef}
          src={src}
          muted={isMuted}
          loop
          autoPlay={deviceView !== 'Mobile'}
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const el = event.currentTarget;
            setDuration(el.duration || 0);
            setPlaybackSpeed(el.playbackRate || 1);
          }}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <span className="x-video-duration-badge">{formatDuration(duration)}</span>
        {deviceView !== 'Mobile' && ccEnabled ? <span className="x-video-cc-badge">CC</span> : null}
        {deviceView !== 'Mobile' ? (
        <div className="x-video-hover-ui" onClick={(event) => event.stopPropagation()}>
          <div className="x-video-progress">
            <span style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <div className="x-video-controls">
            <div className="x-video-controls-left">
              <button type="button" className="x-video-ctrl-btn" onClick={togglePlayback} aria-label="Lecture / Pause">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <span>{formatDuration(currentTime)} / {formatDuration(duration)}</span>
              <button type="button" className="x-video-ctrl-btn" onClick={toggleMute} aria-label="Activer ou couper le son">
                <VolumeIcon size={14} />
              </button>
              <button type="button" className="x-video-ctrl-btn" onClick={() => setCcEnabled((prev) => !prev)} aria-label="Sous-titres">
                <Captions size={14} />
              </button>
            </div>
            <div className="x-video-controls-right">
              <button type="button" className="x-video-ctrl-btn" onClick={() => setShowSettings((prev) => !prev)} aria-label="Parametres">
                <Settings size={14} />
              </button>
              <button type="button" className="x-video-ctrl-btn" onClick={togglePictureInPicture} aria-label="Lecture en incrustation">
                <PictureInPicture2 size={14} />
              </button>
              <button type="button" className="x-video-ctrl-btn" onClick={toggleFullscreen} aria-label="Plein ecran">
                <Expand size={14} />
              </button>
            </div>
          </div>
          {showSettings ? (
            <div className="x-video-settings-menu">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button key={rate} type="button" onClick={() => applyPlaybackRate(rate)}>
                  Vitesse x{rate}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        ) : null}
      </div>
      {isExpanded ? (
        deviceView === 'Mobile' ? (
          videoPortalHostRef?.current
            ? createPortal(mobileExpandedChrome, videoPortalHostRef.current)
            : mobileExpandedChrome
        ) : (
          <div className="x-video-expand-overlay" onClick={closeExpanded}>
            <div className="x-video-expand-content" onClick={(event) => event.stopPropagation()}>
              <video ref={modalVideoRef} src={src} controls autoPlay playsInline />
            </div>
          </div>
        )
      ) : null}
    </>
  );
}

function XPostPreview({ post, onEdit, onDelete, deviceView = 'Desktop', imageViewerPortalHostRef = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const media = post.media ?? [];
  const threadParts = Array.isArray(post.threadPosts) && post.threadPosts.length
    ? post.threadPosts.map((item) => (typeof item === 'string'
      ? { text: item, hashtags: '' }
      : { text: item.text || '', hashtags: item.hashtags || '' }))
    : [{ text: post.caption || 'Tweet du thread', hashtags: post.hashtags || '' }];
  const isThread = post.type === 'thread';
  const displayName = 'Berlin';
  const handle = '@realmfberlin';
  const timeAgo = '19h';
  const timeLabel = post?.time || timeAgo;

  return (
    <article className="x-tweet">
      <header className="x-tweet-head">
        <img
          className="x-tweet-avatar"
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60"
          alt="Profil"
        />
        <div className="x-tweet-meta">
          <div className="x-tweet-meta-top">
            <strong className="x-tweet-name">
              {displayName}
              <BadgeCheck className="x-tweet-verified" size={16} />
            </strong>
            <span className="x-tweet-handle">{handle}</span>
            <span className="x-tweet-sep">·</span>
            <span className="x-tweet-time">{timeLabel}</span>
          </div>
        </div>
        <button type="button" className="x-tweet-more" aria-label="Options" onClick={() => setMenuOpen((current) => !current)}>
          <MoreHorizontal size={18} />
        </button>
        {menuOpen ? (
          <div className="x-tweet-menu" role="menu">
            <button type="button" className="x-tweet-menu-item" onClick={() => { onEdit?.(post); setMenuOpen(false); }}>
              Modifier
            </button>
            <button type="button" className="x-tweet-menu-item" onClick={() => { onDelete?.(post.id); setMenuOpen(false); }}>
              Supprimer
            </button>
          </div>
        ) : null}
      </header>

      {isThread ? (
        <div className="x-thread-stack">
          {threadParts.filter((item) => item.text?.trim()).map((item, index) => (
            <article key={`${post.id}-thread-${index}`} className="x-thread-post">
              <div className="x-thread-post-side">
                <img
                  className="x-thread-avatar"
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60"
                  alt="Profil"
                />
              </div>
              <div className="x-thread-post-main">
                <div className="x-thread-post-meta">
                  <strong>
                    Berlin
                    <BadgeCheck className="x-tweet-verified" size={14} />
                  </strong>
                  <span>@realmfberlin</span>
                  <span>·</span>
                  <span>{timeLabel}</span>
                </div>
                <p className="x-thread-post-text">{item.text || `Tweet ${index + 1}`}</p>
                {item.hashtags ? <p className="x-thread-post-hashtags">{item.hashtags}</p> : null}
                <div className="x-tweet-actions x-thread-actions">
                  <div className="x-tweet-actions-left">
                    <button type="button" className="x-tweet-action" aria-label="Commentaires">
                      <MessageCircle size={18} />
                      <span>505</span>
                    </button>
                    <button type="button" className="x-tweet-action" aria-label="Reposts">
                      <Repeat2 size={18} />
                      <span>289</span>
                    </button>
                    <button type="button" className="x-tweet-action" aria-label="J'aime">
                      <Heart size={18} />
                      <span>760</span>
                    </button>
                    <button type="button" className="x-tweet-action" aria-label="Vues">
                      <BarChart2 size={18} />
                      <span>54K</span>
                    </button>
                  </div>
                  <div className="x-tweet-actions-right">
                    <button type="button" className="x-tweet-action icon-only" aria-label="Enregistrer">
                      <Bookmark size={18} />
                    </button>
                    <button type="button" className="x-tweet-action icon-only" aria-label="Partager">
                      <Upload size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <p className="x-tweet-text">{post.caption || 'Votre texte du post apparaîtra ici.'}</p>
          {post.hashtags ? <p className="x-tweet-text x-tweet-hashtags">{post.hashtags}</p> : null}
        </>
      )}
      {!isThread && showAnalytics ? (
        <div className="x-tweet-media x-tweet-analytics-page">
          <button type="button" className="x-analytics-back-btn" onClick={() => setShowAnalytics(false)}>
            ← Retour au post
          </button>
          <div className="x-analytics-content">
            <h3>Analytics du post</h3>
            <p className="x-analytics-subtitle">Vue rapide des performances du contenu.</p>
            <div className="x-analytics-grid">
              <div className="x-analytics-card">
                <span>Impressions</span>
                <strong>168</strong>
              </div>
              <div className="x-analytics-card">
                <span>Engagements</span>
                <strong>36</strong>
              </div>
              <div className="x-analytics-card">
                <span>Détails ouverts</span>
                <strong>16</strong>
              </div>
              <div className="x-analytics-card">
                <span>Visites profil</span>
                <strong>12</strong>
              </div>
              <div className="x-analytics-card x-analytics-wide">
                <span>Clics lien</span>
                <strong>5</strong>
              </div>
            </div>
          </div>
        </div>
      ) : !isThread && media.length ? (
        <div className={`x-tweet-media ${media.length > 1 ? `grid count-${Math.min(media.length, 4)}` : ''} ${media.length === 1 && media[0]?.kind === 'video' ? 'single-video' : ''}`}>
          {media.map((item) => (
            item.kind === 'video'
              ? (
                <XVideoMedia
                  key={item.id}
                  src={item.url}
                  deviceView={deviceView}
                  videoPortalHostRef={imageViewerPortalHostRef}
                  caption={post.caption || ''}
                  authorName={displayName}
                  authorHandle={handle}
                  authorAvatarUrl="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60"
                />
              )
              : (
                <button
                  key={item.id}
                  type="button"
                  className="x-media-open-btn"
                  onClick={() => setActiveImage(item)}
                  aria-label="Ouvrir l'image en grand format"
                >
                  <img src={item.url} alt="media x" />
                </button>
              )
          ))}
        </div>
      ) : null}

      {!isThread ? (
      <footer className="x-tweet-actions">
        <div className="x-tweet-actions-left">
          <button type="button" className="x-tweet-action" aria-label="Commentaires">
            <MessageCircle size={18} />
            <span>505</span>
          </button>
          <button type="button" className="x-tweet-action" aria-label="Reposts">
            <Repeat2 size={18} />
            <span>289</span>
          </button>
          <button type="button" className="x-tweet-action" aria-label="J'aime">
            <Heart size={18} />
            <span>760</span>
          </button>
          <button type="button" className="x-tweet-action" aria-label="Vues" onClick={() => setShowAnalytics(true)}>
            <BarChart2 size={18} />
            <span>54K</span>
          </button>
        </div>
        <div className="x-tweet-actions-right">
          <button type="button" className="x-tweet-action icon-only" aria-label="Enregistrer">
            <Bookmark size={18} />
          </button>
          <button type="button" className="x-tweet-action icon-only" aria-label="Partager">
            <Upload size={18} />
          </button>
        </div>
      </footer>
      ) : null}
      {activeImage ? (
        deviceView === 'Mobile' && post.type === 'image' ? (
          (() => {
            const portalHost = imageViewerPortalHostRef?.current;
            const mobileOverlay = (
              <div
                className={`x-image-viewer-overlay x-image-viewer-overlay--mobile ${portalHost ? 'x-image-viewer-overlay--in-phone' : ''}`}
                role="dialog"
                aria-modal="true"
                onClick={() => setActiveImage(null)}
              >
                <div className="x-image-viewer-mobile-shell" onClick={(event) => event.stopPropagation()}>
                  <header className="x-image-viewer-mobile-top">
                    <button type="button" className="x-image-viewer-mobile-icon-btn" onClick={() => setActiveImage(null)} aria-label="Fermer">
                      <XCloseIcon size={22} strokeWidth={2.2} />
                    </button>
                    <button type="button" className="x-image-viewer-mobile-icon-btn" aria-label="Plus d'options">
                      <MoreHorizontal size={22} strokeWidth={2} />
                    </button>
                  </header>
                  <div className="x-image-viewer-mobile-stage">
                    <img src={activeImage.url} alt="Image en grand format" />
                  </div>
                  <footer className="x-image-viewer-mobile-bottom">
                    <div className="x-image-viewer-mobile-stats">
                      <span><MessageCircle size={20} strokeWidth={2} /> 39</span>
                      <span><Repeat2 size={20} strokeWidth={2} /> 39</span>
                      <span><Heart size={20} strokeWidth={2} /> 1,3k</span>
                      <span><BarChart2 size={20} strokeWidth={2} /> 347k</span>
                      <span className="x-image-viewer-mobile-stat-share"><Upload size={20} strokeWidth={2} /></span>
                    </div>
                    <div className="x-image-viewer-mobile-reply">
                      <input type="text" readOnly placeholder="Postez votre réponse" />
                    </div>
                  </footer>
                </div>
              </div>
            );
            return portalHost ? createPortal(mobileOverlay, portalHost) : mobileOverlay;
          })()
        ) : (
          <div className="x-image-viewer-overlay" role="dialog" aria-modal="true" onClick={() => setActiveImage(null)}>
            <button type="button" className="x-image-viewer-close" onClick={() => setActiveImage(null)} aria-label="Fermer l'image">
              ×
            </button>
            <button type="button" className="x-image-viewer-next" aria-label="Image suivante">
              ‹‹
            </button>
            <div className="x-image-viewer-content" onClick={(event) => event.stopPropagation()}>
              <img src={activeImage.url} alt="Image en grand format" />
              <div className="x-image-viewer-actions">
                <span><MessageCircle size={16} /> 6</span>
                <span><Repeat2 size={16} /> 458</span>
                <span><Heart size={16} /> 8.5K</span>
                <span><BarChart2 size={16} /> 62K</span>
                <span><Upload size={16} /></span>
              </div>
            </div>
          </div>
        )
      ) : null}

    </article>
  );
}

function XCreatePost({ onCancel, onPublish, onSchedule, onSaveDraft, initialPost }) {
  const [selectedType, setSelectedType] = useState('text');
  const [typeLocked, setTypeLocked] = useState(false);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [lastAiTheme, setLastAiTheme] = useState('');
  const [scheduleAt, setScheduleAt] = useState('2026-04-15T10:14');
  const [media, setMedia] = useState([]);
  const [error, setError] = useState('');
  const [manualCaptionEnabled, setManualCaptionEnabled] = useState(true);
  const [manualHashtagsEnabled, setManualHashtagsEnabled] = useState(true);
  const [aiPromptFocused, setAiPromptFocused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [threadPosts, setThreadPosts] = useState([{ text: '', hashtags: '' }]);
  const mediaInputRef = useRef(null);
  const scheduleInputRef = useRef(null);
  const activeConfig = typeConfig[selectedType];

  useEffect(() => {
    if (!initialPost) {
      setSelectedType('text');
      setTypeLocked(false);
      setCaption('');
      setHashtags('');
      setAiPrompt('');
      setScheduleAt('2026-04-15T10:14');
      setMedia([]);
      setManualCaptionEnabled(true);
      setManualHashtagsEnabled(true);
      setError('');
      setPreviewMedia(null);
      setThreadPosts([{ text: '', hashtags: '' }]);
      return;
    }

    setSelectedType(initialPost.type || 'text');
    setTypeLocked(true);
    setCaption(initialPost.caption || '');
    setHashtags(initialPost.hashtags || '');
    setAiPrompt('');
    setScheduleAt(initialPost.scheduleAt || '2026-04-15T10:14');
    setMedia(initialPost.media || []);
    setManualCaptionEnabled(true);
    setManualHashtagsEnabled(true);
    setError('');
    setPreviewMedia(null);
    setThreadPosts((initialPost.type === 'thread' && Array.isArray(initialPost.threadPosts) && initialPost.threadPosts.length)
      ? initialPost.threadPosts.map((item) => (typeof item === 'string'
        ? { text: item, hashtags: '' }
        : { text: item.text || '', hashtags: item.hashtags || '' }))
      : [{ text: '', hashtags: '' }]);
  }, [initialPost]);

  const formatDisplayDate = (localDateTime) => {
    if (!localDateTime) return '';
    const [datePart, timePart] = localDateTime.split('T');
    if (!datePart || !timePart) return localDateTime;
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  const scheduleLabel = formatDisplayDate(scheduleAt);
  const hourLabel = formatHourOnly(scheduleAt) || '10 h';

  const releaseMedia = (items) => {
    items.forEach((item) => {
      if (typeof item.url === 'string' && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
    });
  };

  const removeMedia = (id) => {
    setMedia((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.url?.startsWith?.('blob:')) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
    setPreviewMedia((prev) => (prev?.id === id ? null : prev));
  };

  const onManualMediaChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (activeConfig.maxMedia === 0) {
      setError('Ce type de post X ne prend pas de média.');
      event.target.value = '';
      return;
    }

    const hasWrongType = files.some((file) => {
      if (selectedType === 'image') return !file.type.startsWith('image/');
      if (selectedType === 'video') return !file.type.startsWith('video/');
      return false;
    });
    if (hasWrongType) {
      setError(`Type de fichier invalide pour "${activeConfig.label}".`);
      event.target.value = '';
      return;
    }

    setMedia((prev) => {
      const remaining = Math.max(activeConfig.maxMedia - prev.length, 0);
      const next = files.slice(0, remaining).map((file, index) => ({
        id: `x-${selectedType}-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        kind: file.type.startsWith('video/') ? 'video' : 'image',
      }));
      return [...prev, ...next];
    });
    setError('');
    event.target.value = '';
  };

  const bustMediaUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('data:')) return `${url}#${Date.now()}`;
    return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  };

  const applyGeneratedMedia = (items = []) => {
    if (!items.length || activeConfig.maxMedia === 0) return;
    const batchId = Date.now();
    setMedia(items.slice(0, activeConfig.maxMedia).map((item, index) => ({
      id: `x-${selectedType}-ai-${batchId}-${index}`,
      url: bustMediaUrl(item.url),
      kind: item.type === 'video' ? 'video' : 'image',
    })));
  };

  const getRegenerateTheme = () => aiPrompt.trim() || lastAiTheme || 'Nouvelle idee';

  const fillFromAI = async () => {
    const promptText = aiPrompt.trim();
    if (!promptText || !typeLocked) {
      if (!promptText) setError('Entrez une thématique dans la barre IA.');
      return;
    }
    try {
      setLastAiTheme(promptText);
      const isNewSubject = caption.trim() || hashtags.trim() || media.length > 0;
      const requests = [
        generateContent({ description: promptText, platform: 'x', postType: selectedType, regenerate: isNewSubject }),
        generateHashtags({ description: promptText, platform: 'x', postType: selectedType, regenerate: isNewSubject }),
      ];
      if (activeConfig.maxMedia > 0) {
        requests.push(generateMedia({
          description: promptText,
          platform: 'x',
          postType: selectedType,
          count: activeConfig.maxMedia,
          regenerate: true,
        }));
      }
      const results = await Promise.allSettled(requests);
      const contentRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const hashtagsRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const mediaRes = results[2]?.status === 'fulfilled' ? results[2].value : null;
      if (!contentRes) throw results[0].reason;
      setCaption(contentRes.contenu);
      if (selectedType === 'thread') {
        const parts = contentRes.contenu.split('\n\n').filter(Boolean);
        setThreadPosts(parts.length >= 2 ? parts.map((text, i) => ({
          text,
          hashtags: i === 0 ? (hashtagsRes?.hashtags || '') : '',
        })) : [
          { text: contentRes.contenu, hashtags: hashtagsRes?.hashtags || '' },
        ]);
      }
      if (hashtagsRes?.hashtags) setHashtags(hashtagsRes.hashtags);
      if (mediaRes?.media) applyGeneratedMedia(mediaRes.media);
      if (results[1].status === 'rejected') {
        setError(results[1].reason?.message || 'La génération des hashtags a échoué');
      }
      if (results[2]?.status === 'rejected') {
        setError(results[2].reason?.message || 'La génération des médias a échoué');
      }
    } catch (err) {
      setError(err.message || 'Erreur de génération IA');
      return;
    }
    setError('');
  };

  const generateCaption = async () => {
    const promptText = getRegenerateTheme();
    try {
      const result = await generateContent({
        description: promptText,
        platform: 'x',
        postType: selectedType,
        regenerate: true,
        previousContent: caption,
      });
      if (selectedType === 'thread') {
        const parts = result.contenu.split('\n\n').filter(Boolean);
        setThreadPosts(parts.map((text) => ({ text, hashtags: '' })));
        return;
      }
      setCaption(result.contenu);
    } catch (err) {
      setError(err.message || 'Erreur de génération caption');
    }
  };

  const generateHashtagsFromAI = async () => {
    const promptText = getRegenerateTheme();
    try {
      const result = await generateHashtags({
        description: promptText,
        platform: 'x',
        postType: selectedType,
        regenerate: true,
        previousContent: hashtags,
      });
      setHashtags(result.hashtags);
    } catch (err) {
      setError(err.message || 'Erreur de génération hashtags');
    }
  };

  const removeThreadHashtag = (index, hashtagToRemove) => {
    setThreadPosts((prev) => prev.map((entry, entryIndex) => {
      if (entryIndex !== index) return entry;
      const nextHashtags = entry.hashtags
        .split(/\s+/)
        .filter(Boolean)
        .filter((item) => item !== hashtagToRemove)
        .join(' ');
      return { ...entry, hashtags: nextHashtags };
    }));
  };

  const generateMediaFromAI = async () => {
    if (!typeLocked || activeConfig.maxMedia === 0) return;
    const promptText = aiPrompt.trim() || caption.trim();
    if (!promptText) return;
    try {
      const result = await generateMedia({
        description: promptText,
        platform: 'x',
        postType: selectedType,
        count: activeConfig.maxMedia,
        regenerate: true,
      });
      applyGeneratedMedia(result.media);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur de génération média');
    }
  };

  const openCalendarPicker = () => {
    if (!scheduleInputRef.current) return;
    scheduleInputRef.current.focus();
    if (typeof scheduleInputRef.current.showPicker === 'function') {
      scheduleInputRef.current.showPicker();
    }
  };

  const requestCloseEditor = () => {
    const hasThreadContent = threadPosts.some((item) => item.text.trim() || item.hashtags.trim());
    const hasDraftContent = caption.trim() || hashtags.trim() || aiPrompt.trim() || media.length > 0 || hasThreadContent;
    if (!hasDraftContent) {
      onCancel();
      return;
    }
    setShowExitConfirm(true);
  };

  const confirmCloseEditor = () => {
    setShowExitConfirm(false);
    onCancel();
  };

  const publishPayload = useMemo(() => {
    const cleanThreadPosts = threadPosts
      .map((item) => ({ text: item.text.trim(), hashtags: item.hashtags.trim() }))
      .filter((item) => item.text || item.hashtags)
      .map((item) => ({
        text: item.text,
        hashtags: item.hashtags || buildHashtagsFromText(item.text)
      }));
    return {
      id: `x-${selectedType}-${Date.now()}`,
      type: selectedType,
      caption: selectedType === 'thread' ? (cleanThreadPosts[0]?.text || caption) : caption,
      hashtags,
      media,
      threadPosts: selectedType === 'thread' ? cleanThreadPosts : undefined,
      time: hourLabel,
      scheduleAt
    };
  }, [caption, hashtags, hourLabel, media, scheduleAt, selectedType, threadPosts]);

  const availableMediaSlots = activeConfig.maxMedia > 0 ? activeConfig.maxMedia : 0;

  return (
    <section className="x-create-card">
      {!typeLocked ? (
        <div className="x-type-grid">
          {[
            { id: 'text', icon: <AlignJustify size={18} strokeWidth={1.8} /> },
            { id: 'image', icon: <Image size={18} /> },
            { id: 'video', icon: <Video size={18} /> },
            { id: 'thread', icon: <Hash size={18} strokeWidth={1.8} /> },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              className={`x-type-btn ${selectedType === type.id ? 'selected' : ''}`}
              onClick={() => {
                releaseMedia(media);
                setMedia([]);
                setSelectedType(type.id);
                setTypeLocked(true);
                setError('');
                setThreadPosts([{ text: '', hashtags: '' }]);
              }}
            >
              <span className="x-type-btn-icon">{type.icon}</span>
              <span>{typeConfig[type.id].label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {typeLocked ? (
        <div className="x-editor">
          <div className="x-editor-head">
            <h3>
              <span className="x-title-fixed-icon" aria-hidden="true">
                <Sparkles size={14} />
              </span>
              Apercu du post - <span>{activeConfig.label}</span>
            </h3>
            <button
              type="button"
              className="x-close-btn"
              onClick={requestCloseEditor}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="x-ai-compose-row">
            <label className="x-ai-input-wrap" htmlFor="x-ai-compose-prompt">
              <span className="x-ai-input-icon" aria-hidden="true">
                <Sparkles size={13} />
              </span>
              <input
                id="x-ai-compose-prompt"
                type="text"
                className="x-ai-input"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                onFocus={() => setAiPromptFocused(true)}
                onBlur={() => setAiPromptFocused(false)}
                placeholder="Decrivez votre post, l IA genere tout..."
              />
            </label>
            <button type="button" className={`x-generate-btn ${aiPromptFocused ? 'active' : ''}`} onClick={fillFromAI}>
              <Sparkles size={13} />
              Generer
            </button>
          </div>

          <div className="x-preview-card">
            <div className="x-preview-user">
              <img
                className="x-tweet-avatar"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60"
                alt="Profil"
              />
              <div className="x-preview-user-meta">
                <div className="x-preview-user-top">
                  <strong className="x-preview-user-name">
                    Berlin
                    <BadgeCheck className="x-tweet-verified" size={16} />
                  </strong>
                  <span className="x-preview-user-handle">@realmfberlin</span>
                  <span className="x-tweet-sep">·</span>
                  <span className="x-preview-user-time">{hourLabel}</span>
                </div>
              </div>
            </div>

            <div className={`x-editor-block ${selectedType === 'thread' ? 'x-editor-block-thread' : ''}`}>
              <div className="x-editor-label-row">
                {selectedType !== 'thread' ? <span>CAPTION</span> : <span />}
                <div className="x-editor-icons">
                  <button type="button" className="x-icon-btn" aria-label="Generation IA caption" onClick={generateCaption}>
                    <Sparkles size={14} />
                  </button>
                  <button
                    type="button"
                    className={`x-icon-btn ${manualCaptionEnabled ? 'active' : ''}`}
                    aria-label="Edition manuelle caption"
                    onClick={() => setManualCaptionEnabled(true)}
                  >
                    <PenLine size={14} />
                  </button>
                </div>
              </div>
              <div className={`x-editor-input-shell ${selectedType === 'thread' ? 'thread-mode' : ''}`}>
                {selectedType === 'thread' ? (
                  <div className="x-thread-editor">
                    {threadPosts.map((item, index) => (
                      <div key={`thread-item-${index}`} className="x-thread-editor-item">
                        <div className="x-thread-editor-side">
                          <img
                            className="x-thread-avatar"
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60"
                            alt="Profil"
                          />
                        </div>
                        <div className="x-thread-editor-content">
                        <div className="x-thread-post-meta">
                          <strong>
                            Berlin
                            <BadgeCheck className="x-tweet-verified" size={14} />
                          </strong>
                          <span>@realmfberlin</span>
                        </div>
                        <div className="x-thread-caption-shell">
                          <textarea
                            className="x-caption x-thread-caption"
                            value={item.text}
                            onChange={(event) => setThreadPosts((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? { ...entry, text: event.target.value } : entry)))}
                            placeholder={`Ecrire le tweet ${index + 1}`}
                            readOnly={!manualCaptionEnabled}
                          />
                          <div className="x-thread-editor-tools">
                            {item.hashtags
                              ? item.hashtags.split(/\s+/).filter(Boolean).map((tag) => (
                                <span key={`${index}-${tag}`} className="x-thread-hashtag-chip">
                                  <span>{tag}</span>
                                  <button
                                    type="button"
                                    className="x-thread-hashtag-remove"
                                    onClick={() => removeThreadHashtag(index, tag)}
                                    aria-label={`Supprimer ${tag}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                              : null}
                          </div>
                        </div>
                        </div>
                        {threadPosts.length > 1 ? (
                          <button
                            type="button"
                            className="x-thread-remove-btn"
                            onClick={() => setThreadPosts((prev) => prev.filter((_, entryIndex) => entryIndex !== index))}
                            aria-label="Supprimer ce tweet du thread"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="x-thread-add-btn"
                      onClick={() => setThreadPosts((prev) => [...prev, { text: '', hashtags: '' }])}
                    >
                      + Ajouter un tweet au thread
                    </button>
                  </div>
                ) : (
                  <textarea
                    className="x-caption"
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Cliquez pour rediger ou generer avec l IA"
                    readOnly={!manualCaptionEnabled}
                  />
                )}
              </div>
            </div>

            {selectedType !== 'thread' ? (
            <div className="x-editor-block">
              <div className="x-editor-label-row">
                <span>HASHTAGS</span>
                <div className="x-editor-icons">
                  <button type="button" className="x-icon-btn" aria-label="Generation IA hashtags" onClick={generateHashtagsFromAI}>
                    <Sparkles size={14} />
                  </button>
                  <button
                    type="button"
                    className={`x-icon-btn ${manualHashtagsEnabled ? 'active' : ''}`}
                    aria-label="Edition manuelle hashtags"
                    onClick={() => setManualHashtagsEnabled(true)}
                  >
                    <Hash size={14} />
                  </button>
                </div>
              </div>
              <div className="x-editor-input-shell">
                <input
                  type="text"
                  className="x-editor-input"
                  value={hashtags}
                  onChange={(event) => setHashtags(event.target.value)}
                  placeholder="Cliquez pour ajouter ou generer avec l IA"
                  readOnly={!manualHashtagsEnabled}
                />
              </div>
            </div>
            ) : null}

            {activeConfig.maxMedia > 0 ? (
              <div className="x-editor-block">
                <div className="x-editor-label-row">
                  <span>MEDIA</span>
                  <div className="x-editor-icons">
                    <button type="button" className="x-icon-btn" aria-label="Generation IA media" onClick={generateMediaFromAI}>
                      <Sparkles size={14} />
                    </button>
                  </div>
                </div>
                <div className="x-media-grid">
                  {Array.from({ length: availableMediaSlots }).map((_, index) => {
                    const item = media[index];
                    if (item) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="x-media-slot x-media-preview-trigger"
                          onClick={() => setPreviewMedia(item)}
                          aria-label="Voir le media en grand format"
                        >
                          {item.kind === 'video' ? <video src={item.url} muted loop /> : <img src={item.url} alt="Media X" />}
                          <button
                            type="button"
                            className="x-remove-media"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeMedia(item.id);
                            }}
                            aria-label="Supprimer media"
                          >
                            <Trash2 size={14} />
                          </button>
                        </button>
                      );
                    }
                    return (
                      <button key={`add-${index}`} type="button" className="x-media-slot x-media-add" onClick={() => mediaInputRef.current?.click()}>
                        <Plus size={18} />
                        <small>{activeConfig.mediaLabel}</small>
                      </button>
                    );
                  })}
                  <input
                    ref={mediaInputRef}
                    type="file"
                    className="x-hidden-file"
                    accept={activeConfig.accept}
                    multiple={activeConfig.maxMedia > 1}
                    onChange={onManualMediaChange}
                  />
                </div>
                {error ? <p className="x-error">{error}</p> : null}
              </div>
            ) : null}
            {previewMedia ? (
              <div className="x-media-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewMedia(null)}>
                <div className="x-media-lightbox-content" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="x-media-lightbox-close" onClick={() => setPreviewMedia(null)} aria-label="Fermer l'aperçu">
                    ×
                  </button>
                  {previewMedia.kind === 'video'
                    ? <video src={previewMedia.url} controls autoPlay />
                    : <img src={previewMedia.url} alt="Apercu media complet" />}
                </div>
              </div>
            ) : null}

        </div>

          <button type="button" className="x-btn-primary x-post-now-btn" onClick={() => onPublish?.(publishPayload)}>
            <Send size={14} /> Publier maintenant
          </button>

          <div className="x-schedule-card">
            <div className="x-schedule-header">PLANIFIER POUR PLUS TARD</div>
            <div className="x-schedule-date-wrap">
              <input type="text" className="x-schedule-input" value={scheduleLabel} readOnly />
              <input
                ref={scheduleInputRef}
                type="datetime-local"
                className="x-hidden-date-input"
                value={scheduleAt}
                onChange={(event) => setScheduleAt(event.target.value)}
              />
              <button type="button" className="x-date-icon-btn" onClick={openCalendarPicker} aria-label="Ouvrir le calendrier">
                <CalendarDays size={16} />
              </button>
            </div>
            <div className="x-schedule-actions">
              <button type="button" className="x-schedule-btn" onClick={() => onSchedule?.(publishPayload)}>
                <CalendarDays size={14} />
                Planifier
              </button>
              <button type="button" className="x-reserve-btn" onClick={() => onSaveDraft?.(publishPayload)}>
                Garder en réserve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showExitConfirm ? (
        <div className="x-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmation abandon publication">
          <div className="x-confirm-card">
            <h4>Quitter l'éditeur maintenant ?</h4>
            <p>Si vous continuez la fermeture, votre création en cours sera perdue.</p>
            <div className="x-confirm-actions">
              <button type="button" className="x-confirm-stay-btn" onClick={() => setShowExitConfirm(false)}>
                Continuer la création
              </button>
              <button type="button" className="x-confirm-leave-btn" onClick={confirmCloseEditor}>
                Abandonner
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function XWorkspace({ meta, onBack }) {
  const [activeTab, setActiveTab] = useState('Publiés');
  const [deviceView, setDeviceView] = useState('Desktop');
  const phoneScreenRef = useRef(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [pendingDeletePostId, setPendingDeletePostId] = useState(null);
  const [postsByTab, setPostsByTab] = useState(() => {
    try {
      const raw = localStorage.getItem(X_POSTS_STORAGE_KEY);
      if (!raw) return { Publiés: [], Planifiés: [], Brouillons: [] };
      const parsed = JSON.parse(raw);
      return {
        Publiés: Array.isArray(parsed?.Publiés) ? parsed.Publiés : [],
        Planifiés: Array.isArray(parsed?.Planifiés) ? parsed.Planifiés : [],
        Brouillons: Array.isArray(parsed?.Brouillons) ? parsed.Brouillons : []
      };
    } catch (_) {
      return { Publiés: [], Planifiés: [], Brouillons: [] };
    }
  });
  const platformName = meta?.name ?? 'X';
  const posts = postsByTab[activeTab] ?? [];

  const savePost = (tab, post) => {
    setPostsByTab((prev) => {
      const next = { ...prev };

      if (editingPost?.id) {
        Object.keys(next).forEach((key) => {
          next[key] = next[key].filter((item) => item.id !== editingPost.id);
        });
      }

      next[tab] = [post, ...(next[tab] ?? [])];
      return next;
    });
    setActiveTab(tab);
    setIsCreating(false);
    setEditingPost(null);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setIsCreating(true);
  };

  const handleDeletePost = (postId) => {
    setPostsByTab((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        next[key] = prev[key].filter((item) => item.id !== postId);
      });
      return next;
    });
  };

  const headerTitle = `Posts ${String(activeTab || '').toLowerCase()}`;

  useEffect(() => {
    localStorage.setItem(X_POSTS_STORAGE_KEY, JSON.stringify(postsByTab));
  }, [postsByTab]);

  useEffect(() => {
    if (deviceView !== 'Mobile') return undefined;
    const el = phoneScreenRef.current;
    if (!el) return undefined;
    const damp = 0.2;
    const onWheel = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const canScroll = scrollHeight > clientHeight + 1;
      if (!canScroll) return;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
        return;
      }
      event.preventDefault();
      el.scrollTop += event.deltaY * damp;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [deviceView, activeTab, postsByTab]);

  return (
    <main className="x-workspace">
      <header className="x-topbar">
        <div className="x-topbar-left">
          <button type="button" className="x-platform-chip">
            <span className="x-platform-dot" style={meta?.color ? { background: meta.color } : undefined}>
              {meta?.logoUrl ? <img src={meta.logoUrl} alt={`${platformName} logo`} /> : null}
            </span>
            {platformName}
          </button>
          <button type="button" className="x-back-btn" onClick={() => onBack?.()}>← Retourner</button>
        </div>
        <div className="x-topbar-actions">
          <button type="button" className="x-create-btn" onClick={() => setIsCreating(true)}>+ Créer un post</button>
          <button type="button" className="x-strategy-btn">Stratégie</button>
        </div>
      </header>

      {isCreating ? (
        <XCreatePost
          initialPost={editingPost}
          onCancel={() => {
            setIsCreating(false);
            setEditingPost(null);
          }}
          onPublish={(post) => savePost('Publiés', post)}
          onSchedule={(post) => savePost('Planifiés', post)}
          onSaveDraft={(post) => savePost('Brouillons', post)}
        />
      ) : null}

      <section className="x-posts-card">
        <div className="x-posts-header">
          <h2>{headerTitle}</h2>
          <div className="x-posts-controls">
            <div className="x-control-group">
              {['Publiés', 'Planifiés', 'Brouillons'].map((tab) => (
                <button key={tab} type="button" className={`x-pill ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="x-control-group">
              <button type="button" className={`x-pill ${deviceView === 'Desktop' ? 'active' : ''}`} onClick={() => setDeviceView('Desktop')}>
                <Monitor size={16} />
                <span>Desktop</span>
              </button>
              <button type="button" className={`x-pill ${deviceView === 'Mobile' ? 'active' : ''}`} onClick={() => setDeviceView('Mobile')}>
                <Smartphone size={16} />
                <span>Mobile</span>
              </button>
            </div>
          </div>
        </div>
        {posts.length === 0 ? <div className="x-empty">Aucun post {activeTab.toLowerCase()} pour {platformName}.</div> : null}
        {deviceView === 'Mobile' ? (
          <div className="x-phone-wrap">
            <div className="x-phone-device">
              <div className="x-phone-screen" ref={phoneScreenRef}>
                <div className="x-phone-notch" aria-hidden="true" />
                <div className={`x-rendered-list mobile`}>
                  {posts.map((post) => (
                    <XPostPreview
                      key={post.id}
                      post={post}
                      deviceView={deviceView}
                      imageViewerPortalHostRef={phoneScreenRef}
                      onEdit={(item) => handleEditPost(item)}
                      onDelete={(id) => setPendingDeletePostId(id)}
                    />
                  ))}
                </div>
                <div className="x-phone-home-bar" aria-hidden="true" />
              </div>
            </div>
          </div>
        ) : (
          <div className="x-rendered-list">
            {posts.map((post) => (
              <XPostPreview
                key={post.id}
                post={post}
                deviceView={deviceView}
                imageViewerPortalHostRef={phoneScreenRef}
                onEdit={(item) => handleEditPost(item)}
                onDelete={(id) => setPendingDeletePostId(id)}
              />
            ))}
          </div>
        )}
      </section>
      {pendingDeletePostId ? (
        <div className="x-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmation suppression post">
          <div className="x-confirm-card">
            <h4>Etes-vous sur de vouloir supprimer ?</h4>
            <p>Cette action supprimera ce post de vos publications.</p>
            <div className="x-confirm-actions">
              <button type="button" className="x-confirm-stay-btn" onClick={() => setPendingDeletePostId(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="x-confirm-leave-btn"
                onClick={() => {
                  handleDeletePost(pendingDeletePostId);
                  setPendingDeletePostId(null);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
