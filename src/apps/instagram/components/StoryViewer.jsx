import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MoreHorizontal, Send, Volume2, VolumeX, X } from 'lucide-react';

const StoryViewer = ({ story, onClose, allStories = [], currentStoryIndex = 0, onNextStory, onPrevStory, onEdit, onDelete }) => {
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const media = story?.media?.[0];
  const isVideo = media?.kind === 'video';
  const profileImage = '/instagram-profile.png';
  const displayAuthor = story?.author && story.author.toLowerCase() !== 'utilisateur' ? story.author : 'devaito_manager';
  const menuRef = useRef(null);
  const videoRef = useRef(null);
  const songTitle = story?.musicTitle || 'Chris Isaak • Wicked Game';
  const nextStory = allStories[currentStoryIndex + 1] || null;
  const hasNextStory = currentStoryIndex < allStories.length - 1;
  const hasPrevStory = currentStoryIndex > 0;

  const formatStoryHour = (value) => {
    if (!value) return '18 h';
    if (typeof value !== 'string') return '18 h';
    const match = value.match(/(\d{1,2}):\d{2}/);
    if (!match) return '18 h';
    return `${Number(match[1])} h`;
  };
  const storyHour = formatStoryHour(story?.time);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;
      setProgress((prev) => {
        if (prev >= 100) {
          onNextStory?.();
          return 0;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStoryIndex, isPaused, onNextStory]);

  useEffect(() => {
    if (!isOptionsOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOptionsOpen]);

  const handleNextStory = () => {
    onNextStory?.();
  };

  const handlePrevStory = () => {
    onPrevStory?.();
  };

  const togglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (isVideo && videoRef.current) {
      if (nextPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  if (!media) {
    return (
      <div className="ig-story-viewer-overlay" onClick={onClose}>
        <div className="ig-story-viewer-container" onClick={(e) => e.stopPropagation()}>
          <div className="ig-story-viewer-media">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
              Média non disponible
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-story-viewer-overlay" onClick={onClose}>
      <div className="ig-story-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="ig-story-viewer-progress-bar">
          {allStories.map((_, idx) => (
            <div
              key={`progress-${idx}`}
              className="ig-story-viewer-progress-segment"
              style={{
                width: `${100 / allStories.length}%`,
              }}
            >
              <div
                className="ig-story-viewer-progress-fill"
                style={{
                  width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="ig-story-viewer-header">
          <div className="ig-story-viewer-user">
            <img src={profileImage} alt="Profil" className="ig-story-viewer-avatar ig-story-avatar-photo" />
            <div className="ig-story-viewer-user-meta">
              <div className="ig-story-viewer-user-top-row">
                <strong>{displayAuthor}</strong>
                <small>{storyHour}</small>
              </div>
              <small className="ig-story-viewer-song">
                <span className="ig-story-viewer-song-icon" aria-hidden="true">
                  <span></span><span></span><span></span>
                </span>
                {songTitle}
              </small>
            </div>
          </div>
          <div className="ig-story-viewer-header-controls">
            <button type="button" className="ig-story-viewer-header-btn" aria-label="Couper le son" onClick={toggleMute}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              className="ig-story-viewer-header-btn"
              aria-label={isPaused ? 'Reprendre' : 'Pause'}
              onClick={togglePause}
            >
              {isPaused ? (
                <span className="ig-story-viewer-play-icon" aria-hidden="true" />
              ) : (
                <span className="ig-story-viewer-pause-icon" aria-hidden="true">
                  <span></span><span></span>
                </span>
              )}
            </button>
            <div className="ig-story-viewer-options" ref={menuRef}>
              <button
                type="button"
                className="ig-story-viewer-header-btn ig-story-viewer-options-btn"
                aria-label="Options"
                aria-expanded={isOptionsOpen}
                onClick={() => setIsOptionsOpen((prev) => !prev)}
              >
                <MoreHorizontal size={16} />
              </button>
              {isOptionsOpen ? (
                <div className="ig-post-actions-dropdown ig-story-viewer-options-dropdown" role="menu" aria-label="Actions de la story">
                  <button type="button" className="ig-post-actions-item" role="menuitem" onClick={() => { setIsOptionsOpen(false); onEdit?.(); }}>
                    Modifier
                  </button>
                  <button type="button" className="ig-post-actions-item delete" role="menuitem" onClick={() => { setIsOptionsOpen(false); onDelete?.(); }}>
                    Supprimer
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ig-story-viewer-media">
          {isVideo ? (
            <video
              ref={videoRef}
              src={media.url}
              className="ig-story-viewer-content"
              muted={isMuted}
              loop
              autoPlay
              controls={false}
            />
          ) : (
            <img src={media.url} alt="Story" className="ig-story-viewer-content" />
          )}
        </div>

        <div className="ig-story-viewer-actions">
          <input
            type="text"
            className="ig-story-viewer-reply-input"
            placeholder={`Répondre à ${displayAuthor.toLowerCase()}...`}
          />
          <button
            type="button"
            className={`ig-story-viewer-action-btn ${liked ? 'liked' : ''}`}
            onClick={() => setLiked(!liked)}
            aria-label="J'aime"
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className="ig-story-viewer-send-btn"
            aria-label="Envoyer"
          >
            <Send size={18} />
          </button>
        </div>

      </div>
      {nextStory?.media?.[0] ? (
        <button
          type="button"
          className="ig-story-viewer-next-preview"
          onClick={(event) => {
            event.stopPropagation();
            handleNextStory();
          }}
          aria-label="Ouvrir la story suivante"
        >
          {nextStory.media[0].kind === 'video' ? (
            <video src={nextStory.media[0].url} className="ig-story-viewer-next-preview-media" muted loop />
          ) : (
            <img src={nextStory.media[0].url} alt="Aperçu story suivante" className="ig-story-viewer-next-preview-media" />
          )}
        </button>
      ) : null}
      {hasPrevStory ? (
        <button
          type="button"
          className="ig-carousel-arrow left ig-story-viewer-external-nav-left ig-story-viewer-external-nav"
          onClick={(event) => {
            event.stopPropagation();
            handlePrevStory();
          }}
          aria-label="Story précédente"
        >
          <ChevronLeft size={18} />
        </button>
      ) : null}
      {hasNextStory ? (
        <button
          type="button"
          className="ig-carousel-arrow right ig-story-viewer-external-nav-right ig-story-viewer-external-nav"
          onClick={(event) => {
            event.stopPropagation();
            handleNextStory();
          }}
          aria-label="Story suivante"
        >
          <ChevronRight size={18} />
        </button>
      ) : null}
      <button
        type="button"
        className="ig-story-viewer-close-outside"
        onClick={onClose}
        aria-label="Fermer la story"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default StoryViewer;
