import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Heart, Home, MessageCircle, MoreHorizontal, Music, Pause, PlusSquare, Repeat2, Search, Send, Volume2, VolumeX, Monitor, Smartphone, Check, CheckCircle2 } from 'lucide-react';
import CreatePost from '../pages/CreatePost.jsx';
import StoryThumbnail from './StoryThumbnail.jsx';
import StoryViewer from './StoryViewer.jsx';

function InstagramPostPreview({ post, deviceView, onEdit, onDelete, hasActiveStory, hasStories, onOpenStories }) {
  const media = post.media ?? [];
  const primaryMedia = media[0];
  const displayAuthor = 'devaito_manager';
  const profileImage = '/instagram-profile.png';
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isReelPaused, setIsReelPaused] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const carouselTrackRef = useRef(null);
  const postMenuRef = useRef(null);
  const reelVideoRef = useRef(null);
  const postVideoRef = useRef(null);
  const containerClass = `ig-preview-shell ${deviceView === 'Mobile' ? 'mobile' : 'desktop'}`;
  const typeClass = `ig-preview-type ${post.type}`;

  useEffect(() => {
    if (!isPostMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (!postMenuRef.current?.contains(event.target)) {
        setIsPostMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPostMenuOpen]);

  const formatTimeOnly = (value) => {
    if (!value) return '';
    let date;
    if (typeof value === 'string') {
      const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (match) {
        const [, day, month, year, hours, minutes] = match;
        date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
      } else {
        date = new Date(value);
      }
    } else if (value instanceof Date) {
      date = value;
    }
    if (!date || Number.isNaN(date.getTime())) return value;

    const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'à l’instant';
    if (diffMinutes < 60) return `${diffMinutes} m`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} j`;
  };

  const scrollToSlide = (nextIndex, itemCount) => {
    const safeIndex = ((nextIndex % itemCount) + itemCount) % itemCount;
    const track = carouselTrackRef.current;
    if (!track) return;
    const target = track.children[safeIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setCarouselIndex(safeIndex);
  };

  const handleMenuEdit = () => {
    setIsPostMenuOpen(false);
    onEdit?.(post);
  };

  const handleMenuDelete = () => {
    setIsPostMenuOpen(false);
    onDelete?.(post);
  };

  const handleAvatarClick = () => {
    if (!hasStories) return;
    onOpenStories?.();
  };

  const handleAvatarKeyDown = (event) => {
    if (!hasStories) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenStories?.();
    }
  };

  const handleReelMediaClick = () => {
    const video = reelVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsReelPaused(false);
      return;
    }
    video.pause();
    setIsReelPaused(true);
  };

  const handleVideoMediaClick = () => {
    const video = postVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      return;
    }
    video.pause();
  };

  const handleVideoSoundToggle = (event) => {
    event.stopPropagation();
    setIsVideoMuted((previous) => !previous);
  };

  const renderPostActionsMenu = () => (
    <div className="ig-post-actions-menu" ref={postMenuRef}>
      <button
        type="button"
        className="ig-post-actions-trigger"
        aria-label="Options du post"
        title="Options"
        aria-expanded={isPostMenuOpen}
        onClick={() => setIsPostMenuOpen((previous) => !previous)}
      >
        <MoreHorizontal size={16} />
      </button>
      {isPostMenuOpen ? (
        <div className="ig-post-actions-dropdown" role="menu" aria-label="Actions du post">
          <button type="button" className="ig-post-actions-item" role="menuitem" onClick={handleMenuEdit}>
            Modifier
          </button>
          <button type="button" className="ig-post-actions-item delete" role="menuitem" onClick={handleMenuDelete}>
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderReelSidebarActionsMenu = () => (
    <div className="ig-post-actions-menu ig-post-actions-menu-reel-sidebar" ref={postMenuRef}>
      <button
        type="button"
        className="ig-reel-action-icon"
        aria-label="Options du post"
        title="Options"
        aria-expanded={isPostMenuOpen}
        onClick={() => setIsPostMenuOpen((previous) => !previous)}
      >
        <MoreHorizontal size={24} />
      </button>
      {isPostMenuOpen ? (
        <div className="ig-post-actions-dropdown reel-sidebar-dropdown" role="menu" aria-label="Actions du post">
          <button type="button" className="ig-post-actions-item" role="menuitem" onClick={handleMenuEdit}>
            Modifier
          </button>
          <button type="button" className="ig-post-actions-item delete" role="menuitem" onClick={handleMenuDelete}>
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderTypeMedia = () => {
    if (!primaryMedia) return null;

    if (post.type === 'carousel') {
      const carouselItems = media.length ? media : (primaryMedia ? [primaryMedia] : []);
      if (!carouselItems.length) return null;
      const goPrev = () => scrollToSlide(carouselIndex - 1, carouselItems.length);
      const goNext = () => scrollToSlide(carouselIndex + 1, carouselItems.length);
      const onTrackScroll = (event) => {
        const { scrollLeft, clientWidth } = event.currentTarget;
        if (!clientWidth) return;
        const nearestIndex = Math.round(scrollLeft / clientWidth);
        if (nearestIndex !== carouselIndex) {
          setCarouselIndex(nearestIndex);
        }
      };

      return (

        <div className="ig-post-media-card" style={{borderRadius: '14px', overflow: 'hidden'}}>
          <div className="ig-post-content-header">
            <div className="ig-post-header-left">
              <img
                src={profileImage}
                alt="Profil"
                className={`ig-post-avatar ig-post-avatar-photo ${hasActiveStory ? 'ig-avatar-story-ring' : ''} ${hasStories ? 'ig-story-avatar-trigger' : ''}`}
                role={hasStories ? 'button' : undefined}
                tabIndex={hasStories ? 0 : undefined}
                onClick={handleAvatarClick}
                onKeyDown={handleAvatarKeyDown}
              />
              <div className="ig-post-header-meta">
                <div className="ig-post-header-row">
                  <strong>{displayAuthor}</strong>
                  <span className="ig-post-time">• {formatTimeOnly(post.time)}</span>
                </div>
              </div>
            </div>
            <div className="ig-post-header-actions">{renderPostActionsMenu()}</div>
          </div>
          <div className="ig-carousel-layout">
            <button type="button" className="ig-carousel-arrow left" onClick={goPrev} aria-label="Media précédent">
              <ChevronLeft size={20} />
            </button>
            <div className="ig-carousel-track" ref={carouselTrackRef} onScroll={onTrackScroll}>
              {carouselItems.map((item) => (
                <div key={item.id} className="ig-carousel-item">
                  {item?.kind === 'video' ? (
                    <video
                      src={item.url}
                      className="ig-main-media"
                      muted
                      loop
                      playsInline
                      aria-label="Vidéo du carrousel"
                    />
                  ) : (
                    <img src={item?.url} className="ig-main-media" alt="Média carousel" />
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="ig-carousel-arrow right" onClick={goNext} aria-label="Media suivant">
              <ChevronRight size={20} />
            </button>
            {carouselItems.length > 1 && (
              <div className="ig-carousel-dots">
                {carouselItems.map((item, index) => (
                  <button
                    key={`dot-${item.id}`}
                    type="button"
                    className={`ig-carousel-dot ${carouselIndex === index ? 'active' : ''}`}
                    onClick={() => scrollToSlide(index, carouselItems.length)}
                    aria-label={`Aller au média ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (post.type === 'image') {
      return (
        <div className="ig-post-media-card" style={{borderRadius: '14px', overflow: 'hidden'}}>
          <div className="ig-post-content-header">
            <div className="ig-post-header-left">
              <img
                src={profileImage}
                alt="Profil"
                className={`ig-post-avatar ig-post-avatar-photo ${hasActiveStory ? 'ig-avatar-story-ring' : ''} ${hasStories ? 'ig-story-avatar-trigger' : ''}`}
                role={hasStories ? 'button' : undefined}
                tabIndex={hasStories ? 0 : undefined}
                onClick={handleAvatarClick}
                onKeyDown={handleAvatarKeyDown}
              />
              <div className="ig-post-header-meta">
                <div className="ig-post-header-row">
                  <strong>{displayAuthor}</strong>
                  <span className="ig-post-time">• {formatTimeOnly(post.time)}</span>
                </div>
              </div>
            </div>
            <div className="ig-post-header-actions">{renderPostActionsMenu()}</div>
          </div>
          <div className="ig-image-card" style={{borderRadius: '14px', overflow: 'hidden'}}>
            <img src={primaryMedia.url} className="ig-main-media" alt="Post media" style={{borderRadius: '14px'}} />
          </div>
        </div>
      );
    }

    if (post.type === 'video') {
      return (
        <div className="ig-post-media-card" style={{borderRadius: '14px', overflow: 'hidden'}}>
          <div className="ig-post-content-header">
            <div className="ig-post-header-left">
              <img
                src={profileImage}
                alt="Profil"
                className={`ig-post-avatar ig-post-avatar-photo ${hasActiveStory ? 'ig-avatar-story-ring' : ''} ${hasStories ? 'ig-story-avatar-trigger' : ''}`}
                role={hasStories ? 'button' : undefined}
                tabIndex={hasStories ? 0 : undefined}
                onClick={handleAvatarClick}
                onKeyDown={handleAvatarKeyDown}
              />
              <div className="ig-post-header-meta">
                <div className="ig-post-header-row">
                  <strong>{displayAuthor}</strong>
                  <span className="ig-post-time">• {formatTimeOnly(post.time)}</span>
                </div>
                <div className="ig-post-video-music">
                  <span>{post.musicTitle || 'Chris Isaak • Wicked Game'}</span>
                </div>
              </div>
            </div>
            <div className="ig-post-header-actions">{renderPostActionsMenu()}</div>
          </div>
          <div className="ig-image-card" style={{borderRadius: '14px', overflow: 'hidden', position: 'relative'}}>
            <video
              ref={postVideoRef}
              src={primaryMedia.url}
              className="ig-main-media"
              muted={isVideoMuted}
              loop
              playsInline
              style={{borderRadius: '14px'}}
              onClick={handleVideoMediaClick}
            />
            <button
              type="button"
              className="ig-video-sound-toggle"
              aria-label={isVideoMuted ? 'Activer le son' : 'Couper le son'}
              onClick={handleVideoSoundToggle}
            >
              {isVideoMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      );
    }

    if (post.type === 'reel') {
      const isMobileReel = deviceView === 'Mobile';
      return (
        <div className="ig-reel-wrapper">
          <div className="ig-reel-container">
            <video
              ref={reelVideoRef}
              src={primaryMedia.url}
              muted
              autoPlay
              loop
              playsInline
              className="ig-reel-media"
              onClick={handleReelMediaClick}
              aria-label={isReelPaused ? 'Reel en pause' : 'Reel en lecture'}
            />

            <div className="ig-reel-overlay-bottom-left">
              <div className="ig-reel-profile-row">
                <img
                  src={profileImage}
                  alt="Profil"
                  className={`ig-reel-avatar-small ig-reel-avatar-photo ${hasActiveStory ? 'ig-avatar-story-ring' : ''} ${hasStories ? 'ig-story-avatar-trigger' : ''}`}
                  role={hasStories ? 'button' : undefined}
                  tabIndex={hasStories ? 0 : undefined}
                  onClick={handleAvatarClick}
                  onKeyDown={handleAvatarKeyDown}
                />
                <div className="ig-reel-profile-info">
                  <div className="ig-reel-author-username">
                    <strong>{displayAuthor}</strong>
                  </div>
                  <div className="ig-reel-music-line">
                    <Music size={12} />
                    <span>{post.musicTitle || 'Chris Isaak • Wicked Game'}</span>
                    <button type="button" className="ig-reel-btn-follow">
                      Suivre
                    </button>
                  </div>
                </div>
              </div>
              {post.caption ? (
                <p className="ig-reel-caption">{post.caption}</p>
              ) : (
                <p className="ig-reel-caption">#makeup #reel moderne ... plus</p>
              )}
            </div>

            {isMobileReel ? (
              <div className="ig-reel-actions-sidebar">
                <button type="button" className="ig-reel-action-icon" aria-label="J'aime">
                  <Heart size={24} />
                  <span className="ig-action-count">7716</span>
                </button>
                <button type="button" className="ig-reel-action-icon" aria-label="Commenter">
                  <MessageCircle size={24} />
                  <span className="ig-action-count">9</span>
                </button>
                <button type="button" className="ig-reel-action-icon" aria-label="Republier">
                  <Repeat2 size={24} strokeWidth={2.2} />
                </button>
                <button type="button" className="ig-reel-action-icon" aria-label="Partager">
                  <Send size={24} />
                </button>
                {renderReelSidebarActionsMenu()}
                <button type="button" className="ig-reel-action-icon ig-reel-action-icon-music" aria-label="Musique">
                  <Music size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="ig-reel-overlay-bottom-right">
                  <button type="button" className="ig-reel-sound-icon" aria-label="Son">
                    <VolumeX size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
          {!isMobileReel ? (
            <div className="ig-reel-actions-sidebar">
              <button type="button" className="ig-reel-action-icon" aria-label="J'aime">
                <Heart size={24} />
                <span className="ig-action-count">7716</span>
              </button>
              <button type="button" className="ig-reel-action-icon" aria-label="Commenter">
                <MessageCircle size={24} />
                <span className="ig-action-count">9</span>
              </button>
              <button type="button" className="ig-reel-action-icon" aria-label="Partager">
                <Send size={24} />
              </button>
              <button type="button" className="ig-reel-action-icon" aria-label="Enregistrer">
                <Bookmark size={24} />
              </button>
              {renderReelSidebarActionsMenu()}
              <button type="button" className="ig-reel-action-icon ig-reel-action-icon-music" aria-label="Musique">
                <Music size={18} />
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    if (post.type === 'story') {
      return (
        <div className="ig-story-wrapper">
          <div className="ig-story-progress-bar">
            <span></span>
          </div>

          {primaryMedia.kind === 'video' ? (
            <video src={primaryMedia.url} muted autoPlay loop playsInline className="ig-story-media" />
          ) : (
            <img src={primaryMedia.url} alt="Story media" className="ig-story-media" />
          )}
          <div className="ig-story-top-fade" />
          <div className="ig-story-bottom-fade" />

          <div className="ig-story-header-overlay">
            <div className="ig-story-left-section">
              <img src={profileImage} alt="Profil" className={`ig-story-avatar-large ig-story-avatar-photo ${hasActiveStory ? 'ig-avatar-story-ring' : ''}`} />
              <div className="ig-story-user-info">
                <strong>{displayAuthor}</strong>
                <span className="ig-story-time">{formatTimeOnly(post.time) || '11 min'}</span>
              </div>
            </div>
            <div className="ig-story-right-actions">
              <button type="button" className="ig-story-action-btn" aria-label="Pause">
                <Pause size={16} />
              </button>
              {renderPostActionsMenu()}
            </div>
          </div>

          {post.caption && (
            <div className="ig-story-caption-overlay">
              <p>{post.caption}</p>
            </div>
          )}

          {/* Pied – barre réponse */}
          <div className="ig-story-footer">
            <div className="ig-story-reply-bar">
              <input type="text" placeholder={`Répondre à ${displayAuthor}...`} readOnly />
            </div>
            <div className="ig-story-footer-actions">
              <button type="button" className="ig-story-footer-btn" aria-label="J'aime">
                <Heart size={18} />
              </button>
              <button type="button" className="ig-story-footer-btn" aria-label="Envoyer">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <img className="ig-single-media" src={primaryMedia.url} alt="Post media" />;
  };

  const likeCount = 881;
  const commentCount = 62;

  return (
    <article className={containerClass}>
      <div className={typeClass}>
        <div className="ig-rendered-media">{renderTypeMedia()}</div>

        {['image', 'video', 'carousel'].includes(post.type) ? (
          <>
            <div className="ig-feed-actions-row">
              <div className="ig-feed-actions-left ig-feed-actions-left-compact">
                <button
                  type="button"
                  className={`ig-feed-action-btn ig-feed-action-with-count ${liked ? 'liked' : ''}`}
                  onClick={() => setLiked(!liked)}
                  aria-label="J'aime"
                >
                  <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
                  <span>{likeCount}</span>
                </button>
                <button type="button" className="ig-feed-action-btn ig-feed-action-with-count" aria-label="Commenter">
                  <MessageCircle size={24} />
                  <span>{commentCount}</span>
                </button>
                <button type="button" className="ig-feed-action-btn" aria-label="Partager">
                  <Send size={24} />
                </button>
              </div>
              <button
                type="button"
                className={`ig-feed-save-btn ${saved ? 'saved' : ''}`}
                onClick={() => setSaved(!saved)}
                aria-label="Enregistrer"
              >
                <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>

            {post.caption && (
              <p className="ig-post-caption">
                <strong>{displayAuthor}</strong> {post.caption}
              </p>
            )}

            {post.hashtags && <p className="ig-post-tags">{post.hashtags}</p>}

            <button type="button" className="ig-view-comments">Voir la traduction</button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default function InstagramWorkspace({ meta, onBack }) {
  const POSTS_STORAGE_KEY = 'instagram.postsByTab.v1';
  const getDefaultPostsByTab = () => ({
    Publiés: [
      {
        id: 'ig-post-1',
        author: 'devaito_manager',
        time: '14/04/2026 15:49',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=60',
        caption: 'Premier aperçu de publication Instagram.',
        hashtags: '#instagram #preview',
        media: [
          {
            id: 'ig-seed-1',
            url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=60',
            kind: 'image'
          }
        ]
      }
    ],
    Planifiés: [],
    Brouillons: []
  });
  const loadPostsByTab = () => {
    if (typeof window === 'undefined') {
      return getDefaultPostsByTab();
    }
    try {
      const raw = window.localStorage.getItem(POSTS_STORAGE_KEY);
      if (!raw) return getDefaultPostsByTab();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return getDefaultPostsByTab();
      return {
        Publiés: Array.isArray(parsed.Publiés) ? parsed.Publiés : [],
        Planifiés: Array.isArray(parsed.Planifiés) ? parsed.Planifiés : [],
        Brouillons: Array.isArray(parsed.Brouillons) ? parsed.Brouillons : []
      };
    } catch (error) {
      return getDefaultPostsByTab();
    }
  };
  const [activeTab, setActiveTab] = useState('Publiés');
  const [deviceView, setDeviceView] = useState('Desktop');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [editingPost, setEditingPost] = useState(null);
  const [editingTab, setEditingTab] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [postsByTab, setPostsByTab] = useState(loadPostsByTab);
  const phoneFeedRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(postsByTab));
  }, [postsByTab, POSTS_STORAGE_KEY]);

  useEffect(() => {
    if (deviceView !== 'Mobile') return undefined;
    const el = phoneFeedRef.current;
    if (!el) return undefined;
    const damp = 0.22;
    const onWheel = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const canScroll = scrollHeight > clientHeight + 1;
      if (!canScroll) return;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) return;
      event.preventDefault();
      el.scrollTop += event.deltaY * damp;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [deviceView, activeTab, postsByTab]);
  const posts = postsByTab[activeTab] ?? [];
  const allPosts = Object.values(postsByTab).flat();
  const platformName = meta?.name ?? 'Instagram';
  const prependPost = (targetTab, post) => {
    setPostsByTab((previous) => ({
      ...previous,
      [targetTab]: [post, ...(previous[targetTab] ?? [])]
    }));
    setActiveTab(targetTab);
    setIsCreatingPost(false);
  };

  const closeEditor = () => {
    setIsCreatingPost(false);
    setEditingPost(null);
    setEditingTab(null);
  };

  const handlePublish = (post) => {
    prependPost('Publiés', post);
  };

  const handleSchedule = (post) => {
    prependPost('Planifiés', post);
  };

  const handleSaveDraft = (post) => {
    prependPost('Brouillons', post);
  };

  const handleUpdatePost = (updatedPost, targetTab) => {
    setPostsByTab((previous) => {
      const next = { ...previous };
      Object.keys(next).forEach((tabName) => {
        next[tabName] = (next[tabName] ?? []).filter((item) => item.id !== updatedPost.id);
      });
      next[targetTab] = [updatedPost, ...(next[targetTab] ?? [])];
      return next;
    });
    setActiveTab(targetTab);
    closeEditor();
  };

  const handleEditPost = (post, tab) => {
    setEditingPost(post);
    setEditingTab(tab);
    // Faire défiler vers le haut immédiatement
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Transition immédiate vers la page de génération
    setTimeout(() => setIsCreatingPost(true), 100);
  };

  const handleDeletePost = (post, tab) => {
    setDeleteTarget({ post, tab });
  };

  const confirmDeletePost = () => {
    if (!deleteTarget?.post) return;
    setPostsByTab((previous) => {
      const next = { ...previous };
      Object.keys(next).forEach((tabName) => {
        next[tabName] = (next[tabName] ?? []).filter((item) => item.id !== deleteTarget.post.id);
      });
      return next;
    });
    setDeleteTarget(null);
  };

  const cancelDeletePost = () => setDeleteTarget(null);

  const stories = allPosts.filter((post) => post.type === 'story');
  const otherPosts = posts.filter((post) => post.type !== 'story');
  const hasPublishedStory = (postsByTab.Publiés ?? []).some((item) => item.type === 'story');

  const handleOpenStory = (indexOrStory) => {
    let safeIndex = -1;
    if (typeof indexOrStory === 'number') {
      safeIndex = indexOrStory;
    } else if (typeof indexOrStory === 'string') {
      safeIndex = Number(indexOrStory);
    } else if (indexOrStory && typeof indexOrStory === 'object') {
      safeIndex = stories.findIndex((storyItem) => storyItem.id === indexOrStory.id);
    }

    if (Number.isNaN(safeIndex) || safeIndex < 0 || safeIndex >= stories.length) return;
    setSelectedStory(stories[safeIndex]);
    setCurrentStoryIndex(safeIndex);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
    setCurrentStoryIndex(0);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextStory = stories[currentStoryIndex + 1];
      setSelectedStory(nextStory);
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      handleCloseStory();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      const prevStory = stories[currentStoryIndex - 1];
      setSelectedStory(prevStory);
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const headerTitle = `Posts ${String(activeTab || '').toLowerCase()}`;

  return (
    <main className="ig-workspace">
      <header className="ig-topbar">
        <div className="ig-topbar-left">
          <button type="button" className="ig-platform-chip">
            <span className="ig-platform-dot">
              {meta?.logoUrl ? <img src={meta.logoUrl} alt={`${platformName} logo`} /> : null}
            </span>
            {platformName}
          </button>

          <button type="button" className="ig-back-btn" onClick={() => onBack?.()}>
            ← Retourner
          </button>
        </div>

        <div className="ig-topbar-actions">
          <button type="button" className="ig-strategy-btn">
            Stratégie
          </button>
          <button type="button" className="ig-create-btn" onClick={() => setIsCreatingPost(true)}>
            + Créer un post
          </button>
        </div>
      </header>

      {isCreatingPost ? (
        <CreatePost
          initialPost={editingPost}
          onCancel={closeEditor}
          onPublish={handlePublish}
          onSchedule={handleSchedule}
          onSaveDraft={handleSaveDraft}
          onUpdate={handleUpdatePost}
        />
      ) : null}

      {deleteTarget ? (
        <div className="ig-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmation suppression du post">
          <div className="ig-confirm-card">
            <h4>Supprimer ce post ?</h4>
            <p>Êtes-vous sûr(e) de vouloir supprimer ce post ? Cette action est permanente.</p>
            <div className="ig-confirm-actions">
              <button type="button" className="ig-confirm-stay-btn" onClick={cancelDeletePost}>Annuler</button>
              <button type="button" className="ig-confirm-leave-btn" onClick={confirmDeletePost}>Supprimer</button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="ig-posts-card">
        <div className="ig-posts-header">
          <h2>{headerTitle}</h2>
          <div className="ig-posts-controls">
            <div className="ig-tabs">
              {['Publiés', 'Planifiés', 'Brouillons'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`ig-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="ig-devices">
              <button
                type="button"
                className={`ig-device ${deviceView === 'Desktop' ? 'active' : ''}`}
                onClick={() => setDeviceView('Desktop')}
              >
                <Monitor size={16} />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                className={`ig-device ${deviceView === 'Mobile' ? 'active' : ''}`}
                onClick={() => setDeviceView('Mobile')}
              >
                <Smartphone size={16} />
                <span>Mobile</span>
              </button>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="ig-empty-state">Aucun post {activeTab.toLowerCase()} pour {platformName}.</div>
        ) : deviceView === 'Mobile' ? (
          <div className="ig-phone-wrap">
            <div className="ig-phone-device">
              <div className="ig-phone-screen">
                <div className="ig-phone-notch" aria-hidden="true" />
                <div className="ig-rendered-list mobile" ref={phoneFeedRef}>
                  {stories.length > 0 ? (
                    <div className="ig-stories-section ig-stories-section--in-phone">
                      <h3 className="ig-stories-title">Stories</h3>
                      <div className="ig-stories-grid">
                        {stories.map((story, index) => (
                          <StoryThumbnail
                            key={story.id}
                            story={story}
                            index={index}
                            onOpen={handleOpenStory}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {otherPosts.length > 0 ? (
                    <div className="ig-other-posts-section ig-other-posts-section--in-phone">
                      {otherPosts.map((post) => (
                        <InstagramPostPreview
                          key={post.id}
                          post={post}
                          deviceView={deviceView}
                          hasActiveStory={hasPublishedStory}
                          hasStories={stories.length > 0}
                          onOpenStories={() => {
                            if (!stories.length) return;
                            handleOpenStory(0);
                          }}
                          onEdit={() => handleEditPost(post, activeTab)}
                          onDelete={() => handleDeletePost(post, activeTab)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="ig-phone-home-bar" aria-hidden="true" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {stories.length > 0 && (
              <div className="ig-stories-section">
                <h3 className="ig-stories-title">Stories</h3>
                <div className="ig-stories-grid">
                  {stories.map((story, index) => (
                    <StoryThumbnail
                      key={story.id}
                      story={story}
                      index={index}
                      onOpen={handleOpenStory}
                    />
                  ))}
                </div>
              </div>
            )}
            {otherPosts.length > 0 && (
              <div className="ig-other-posts-section">
                {otherPosts.map((post) => (
                  <InstagramPostPreview
                    key={post.id}
                    post={post}
                    deviceView={deviceView}
                    hasActiveStory={hasPublishedStory}
                    hasStories={stories.length > 0}
                    onOpenStories={() => {
                      if (!stories.length) return;
                      handleOpenStory(0);
                    }}
                    onEdit={() => handleEditPost(post, activeTab)}
                    onDelete={() => handleDeletePost(post, activeTab)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={handleCloseStory}
          allStories={stories}
          currentStoryIndex={currentStoryIndex}
          onNextStory={handleNextStory}
          onPrevStory={handlePrevStory}
          onEdit={() => {
            handleCloseStory();
            handleEditPost(selectedStory, activeTab);
          }}
          onDelete={() => {
            handleCloseStory();
            handleDeletePost(selectedStory, activeTab);
          }}
        />
      )}
    </main>
  );
}
