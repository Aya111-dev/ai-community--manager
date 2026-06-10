import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Camera, Film, Grid3X3, Hash, Image, PenLine, Plus, Send, Sparkles, Video, X } from 'lucide-react';
import MediaGrid from '../components/MediaGrid.jsx';
import { generateContent, generateHashtags, generateMedia } from '../../../services/api.js';
import PreviewVideo from '../../../components/PreviewVideo.jsx';

const formatDisplayDate = (localDateTime) => {
  if (!localDateTime) return '';
  const [datePart, timePart] = localDateTime.split('T');
  if (!datePart || !timePart) return localDateTime;
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

const fakeImagePool = [
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=70'
];

const fakeVideoPool = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/river.mp4'
];

const typeConfig = {
  image: {
    title: 'Aperçu du post',
    maxMedia: 1,
    showHashtags: true,
    showCaption: true,
    mediaLabel: 'Ajouter un média',
    accept: 'image/*',
    aiKind: 'image',
  },
  carousel: {
    title: 'Aperçu du post',
    maxMedia: 5,
    showHashtags: true,
    showCaption: true,
    mediaLabel: 'Ajouter un média',
    accept: 'image/*,video/*',
    aiKind: 'image',
  },
  reel: {
    title: 'Aperçu du post',
    maxMedia: 1,
    showHashtags: true,
    showCaption: true,
    mediaLabel: 'Importer une vidéo',
    accept: 'video/*',
    aiKind: 'video',
  },
  video: {
    title: 'Aperçu du post',
    maxMedia: 1,
    showHashtags: true,
    showCaption: true,
    mediaLabel: 'Importer une vidéo',
    accept: 'video/*',
    aiKind: 'video',
  },
  story: {
    title: 'Aperçu du post',
    maxMedia: 1,
    showHashtags: false,
    showCaption: false,
    mediaLabel: 'Ajouter un média',
    accept: 'image/*,video/*',
    aiKind: 'image',
  }
};

const CreatePost = ({ initialPost = null, onCancel, onPublish, onSchedule, onSaveDraft, onUpdate }) => {
  const defaultAuthor = 'devaito_manager';
  const profileImage = '/instagram-profile.png';
  const [selectedType, setSelectedType] = useState(initialPost?.type ?? 'image');
  const [typeLocked, setTypeLocked] = useState(Boolean(initialPost));
  const [visibleMediaSlots, setVisibleMediaSlots] = useState(initialPost?.type === 'carousel' ? 3 : 1);
  const [caption, setCaption] = useState(initialPost?.caption ?? '');
  const [hashtags, setHashtags] = useState(initialPost?.hashtags ?? '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [lastAiTheme, setLastAiTheme] = useState('');
  const [scheduleAt, setScheduleAt] = useState(initialPost?.scheduleAt ?? '2026-04-15T10:14');
  const [media, setMedia] = useState(initialPost?.media ?? []);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [manualCaptionEnabled, setManualCaptionEnabled] = useState(true);
  const [manualHashtagsEnabled, setManualHashtagsEnabled] = useState(true);
  const [formError, setFormError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [aiPromptFocused, setAiPromptFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaRenderKey, setMediaRenderKey] = useState(0);
  const scheduleInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const captionInputRef = useRef(null);
  const hashtagsInputRef = useRef(null);
  const mediaRef = useRef([]);

  const postTypes = [
    { id: 'image', label: 'Image', icon: <Image size={20} strokeWidth={1.8} /> },
    { id: 'carousel', label: 'Carousel', icon: <Grid3X3 size={20} strokeWidth={1.8} /> },
    { id: 'reel', label: 'Reel', icon: <Film size={20} strokeWidth={1.8} /> },
    { id: 'video', label: 'Video', icon: <Video size={20} strokeWidth={1.8} /> },
    { id: 'story', label: 'Story', icon: <Camera size={20} strokeWidth={1.8} /> }
  ];

  const activeConfig = typeConfig[selectedType];
  const selectedTypeLabel = postTypes.find((type) => type.id === selectedType)?.label;
  const scheduleLabel = useMemo(() => formatDisplayDate(scheduleAt), [scheduleAt]);
  const scheduleTimeOnly = useMemo(() => {
    const [, timePart] = String(scheduleAt || '').split('T');
    if (!timePart) return '';
    const [hourPart] = timePart.split(':');
    if (!hourPart) return '';
    return `${Number(hourPart)} h`;
  }, [scheduleAt]);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    if (!initialPost) return;
    setSelectedType(initialPost.type ?? 'image');
    setTypeLocked(true);
    setVisibleMediaSlots(initialPost.type === 'carousel' ? 3 : 1);
    setCaption(initialPost.caption ?? '');
    setHashtags(initialPost.hashtags ?? '');
    setMedia(initialPost.media ?? []);
    setPreviewMedia(null);
    setScheduleAt(initialPost.scheduleAt ?? '2026-04-15T10:14');
    setManualCaptionEnabled(true);
    setManualHashtagsEnabled(true);
    setFormError('');
  }, [initialPost]);

  useEffect(() => () => {
    mediaRef.current.forEach((item) => {
      if (typeof item.url === 'string' && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
  }, []);

  const handleMediaPreview = (mediaItem) => {
    setPreviewMedia(mediaItem);
  };

  const bustMediaUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('data:')) return `${url}#${Date.now()}`;
    return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  };

  const getMediaGenerationCount = () => {
    if (selectedType === 'carousel') return Math.max(visibleMediaSlots, 3);
    return 1;
  };

  const getMediaRegenerationMeta = () => {
    if (selectedType === 'carousel') {
      const emptySlots = Math.max(visibleMediaSlots - media.length, 0);
      if (emptySlots > 0 && media.length > 0) {
        return { count: emptySlots, merge: true };
      }
      return { count: Math.max(visibleMediaSlots, 3), merge: false };
    }
    return { count: 1, merge: false };
  };

  const applyGeneratedMedia = (items = [], { merge = false } = {}) => {
    if (!items.length) return;
    setMediaRenderKey((prev) => prev + 1);
    const batchId = Date.now();
    const isVideoType = activeConfig.aiKind === 'video';
    const mapped = items.map((item, index) => ({
      id: `${selectedType}-ai-${batchId}-${index}`,
      url: bustMediaUrl(item.url),
      kind: (item.type === 'video' || isVideoType) ? 'video' : 'image',
    }));

    if (isVideoType) {
      const videoItem = mapped.find((m) => m.kind === 'video') || { ...mapped[0], kind: 'video' };
      setMedia([videoItem]);
      setVisibleMediaSlots(1);
      return;
    }

    if (selectedType === 'carousel' && merge) {
      setMedia((prev) => {
        const next = [...prev];
        let itemIdx = 0;
        while (next.length < visibleMediaSlots && itemIdx < mapped.length) {
          next.push(mapped[itemIdx++]);
        }
        while (itemIdx < mapped.length) next.push(mapped[itemIdx++]);
        setVisibleMediaSlots((slots) => Math.max(slots, visibleMediaSlots, next.length));
        return next;
      });
      return;
    }

    setMedia(mapped);
    setVisibleMediaSlots((prev) => Math.max(prev, selectedType === 'carousel' ? Math.max(mapped.length, 3) : 1));
  };

  const getRegenerateTheme = () => aiPrompt.trim() || lastAiTheme || 'Nouveau post';

  const fillFromAI = async () => {
    const promptText = aiPrompt.trim();
    if (!promptText || !typeLocked) {
      if (!promptText) alert('Entrez une thématique dans la barre IA.');
      return;
    }
    setIsGenerating(true);
    try {
      setLastAiTheme(promptText);
      const isNewSubject = caption.trim() || hashtags.trim() || media.length > 0;

      const contentRes = await generateContent({
        description: promptText,
        platform: 'instagram',
        postType: selectedType,
        regenerate: isNewSubject,
      });
      setCaption(contentRes.contenu);

      if (activeConfig.showHashtags) {
        try {
          const hashtagsRes = await generateHashtags({
            description: promptText,
            platform: 'instagram',
            postType: selectedType,
            regenerate: isNewSubject,
          });
          setHashtags(hashtagsRes.hashtags);
        } catch (hashtagsError) {
          alert(hashtagsError.message || 'La génération des hashtags a échoué');
        }
      }

      try {
        const mediaRes = await generateMedia({
          description: promptText,
          platform: 'instagram',
          postType: selectedType,
          count: getMediaGenerationCount(),
          regenerate: isNewSubject,
        });
        applyGeneratedMedia(mediaRes.media);
      } catch (mediaError) {
        alert(mediaError.message || 'La génération des médias a échoué');
      }
    } catch (error) {
      alert(error.message || 'Erreur de génération IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCaption = async () => {
    const promptText = getRegenerateTheme();
    setIsGenerating(true);
    try {
      const result = await generateContent({
        description: promptText,
        platform: 'instagram',
        postType: selectedType,
        regenerate: true,
        previousContent: caption,
      });
      setCaption(result.contenu);
      setManualCaptionEnabled(true);
    } catch (error) {
      alert(error.message || 'Erreur de génération caption');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHashtagsFromAI = async () => {
    const promptText = getRegenerateTheme();
    setIsGenerating(true);
    try {
      const result = await generateHashtags({
        description: promptText,
        platform: 'instagram',
        postType: selectedType,
        regenerate: true,
        previousContent: hashtags,
      });
      setHashtags(result.hashtags);
      setManualHashtagsEnabled(true);
    } catch (error) {
      alert(error.message || 'Erreur de génération hashtags');
    } finally {
      setIsGenerating(false);
    }
  };

  const enableManualCaption = () => {
    setManualCaptionEnabled(true);
    setTimeout(() => captionInputRef.current?.focus(), 0);
  };

  const enableManualHashtags = () => {
    setManualHashtagsEnabled(true);
    setTimeout(() => hashtagsInputRef.current?.focus(), 0);
  };

  const generateMediaFromAI = async () => {
    if (!typeLocked) return;
    const promptText = getRegenerateTheme();
    if (!promptText) {
      alert('Entrez une thématique dans la barre IA ou générez d\'abord le contenu.');
      return;
    }
    setIsGenerating(true);
    try {
      const { count, merge } = getMediaRegenerationMeta();
      const result = await generateMedia({
        description: promptText,
        platform: 'instagram',
        postType: selectedType,
        count,
        regenerate: true,
      });
      applyGeneratedMedia(result.media, { merge });
      setFormError('');
    } catch (error) {
      alert(error.message || 'Erreur de génération média');
    } finally {
      setIsGenerating(false);
    }
  };

  const addMediaManually = () => {
    mediaInputRef.current?.click();
  };

  const onManualMediaChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) return;

    const isAcceptedMedia = (file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (selectedType === 'image') return isImage;
      if (selectedType === 'video' || selectedType === 'reel') return isVideo;
      if (selectedType === 'story') return isImage || isVideo;
      if (selectedType === 'carousel') return isImage || isVideo;
      return false;
    };

    const invalidFiles = selectedFiles.filter((file) => !isAcceptedMedia(file));
    if (invalidFiles.length) {
      setFormError(`Type de média invalide pour "${selectedTypeLabel}".`);
      event.target.value = '';
      return;
    }

    setMedia((previous) => {
      const remaining = Math.max(activeConfig.maxMedia - previous.length, 0);
      const toAdd = selectedFiles.slice(0, remaining).map((file, index) => {
        const isVideo = file.type.startsWith('video/');
        return {
          id: `${selectedType}-${Date.now()}-manual-${index}`,
          url: URL.createObjectURL(file),
          kind: isVideo ? 'video' : 'image'
        };
      });
      return [...previous, ...toAdd];
    });
    if (selectedFiles.length > activeConfig.maxMedia) {
      setFormError(`Maximum ${activeConfig.maxMedia} média autorisé(s) pour "${selectedTypeLabel}".`);
    } else {
      setFormError('');
    }
    event.target.value = '';
  };

  const removeMedia = (mediaId) => {
    setMedia((previous) => {
      const target = previous.find((item) => item.id === mediaId);
      if (target?.url?.startsWith?.('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return previous.filter((item) => item.id !== mediaId);
    });
  };

  const requestCloseEditor = () => {
    const hasDraftContent = caption.trim() || hashtags.trim() || aiPrompt.trim() || media.length > 0;
    if (!hasDraftContent) {
      onCancel?.();
      return;
    }
    setShowExitConfirm(true);
  };

  const confirmCloseEditor = () => {
    setShowExitConfirm(false);
    onCancel?.();
  };

  const buildPostPayload = () => ({
    id: initialPost?.id ?? `ig-${selectedType}-${Date.now()}`,
    author: initialPost?.author ?? defaultAuthor,
    type: selectedType,
    time: scheduleLabel,
    caption: selectedType === 'story' ? '' : caption,
    hashtags,
    scheduleAt,
    musicTitle: selectedType === 'video' ? (initialPost?.musicTitle ?? 'Chris Isaak • Wicked Game') : initialPost?.musicTitle,
    media: media.length ? media : [{ id: 'fallback-1', url: activeConfig.aiKind === 'video' ? fakeVideoPool[0] : fakeImagePool[0], kind: activeConfig.aiKind }],
    mediaUrl: media[0]?.url || (activeConfig.aiKind === 'video' ? fakeVideoPool[0] : fakeImagePool[0])
  });

  const validateBeforeSubmit = () => {
    if (selectedType === 'carousel' && media.length < 2) {
      setFormError('Carousel: ajoutez au moins 2 médias.');
      return false;
    }
    setFormError('');
    return true;
  };

  const publishNow = () => {
    if (!validateBeforeSubmit()) return;
    const payload = buildPostPayload();
    if (initialPost) {
      onUpdate?.(payload, 'Publiés');
      return;
    }
    onPublish?.(payload);
  };

  const schedulePost = () => {
    if (!validateBeforeSubmit()) return;
    const payload = buildPostPayload();
    if (initialPost) {
      onUpdate?.(payload, 'Planifiés');
      return;
    }
    onSchedule?.(payload);
  };

  const saveDraft = () => {
    if (!validateBeforeSubmit()) return;
    const payload = buildPostPayload();
    if (initialPost) {
      onUpdate?.(payload, 'Brouillons');
      return;
    }
    onSaveDraft?.(payload);
  };

  const openCalendarPicker = () => {
    if (!scheduleInputRef.current) return;
    scheduleInputRef.current.focus();
    if (typeof scheduleInputRef.current.showPicker === 'function') {
      scheduleInputRef.current.showPicker();
    }
  };

  const canAddMoreMedia = media.length < activeConfig.maxMedia;
  const isMultiSlotType = activeConfig.maxMedia > 1;
  const defaultSlotCount = isMultiSlotType ? 3 : 1;
  const effectiveSlotCount = Math.min(Math.max(defaultSlotCount, visibleMediaSlots, media.length), activeConfig.maxMedia);
  const canAddEmptySlot = isMultiSlotType && effectiveSlotCount < activeConfig.maxMedia;
  const displayedSlots = Array.from({ length: effectiveSlotCount }).map((_, index) => {
    if (index < media.length) {
      return { kind: 'media', mediaItem: media[index], key: `media-${media[index].id}` };
    }
    return { kind: 'add', key: `add-slot-${index}` };
  });

  return (
    <section className="ig-create-post-card">
      {!typeLocked ? (
        <div className="ig-post-types-grid">
          {postTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`ig-post-type-card ${selectedType === type.id ? 'selected' : ''}`}
              onClick={() => {
                if (selectedType !== type.id) {
                  media.forEach((item) => {
                    if (typeof item.url === 'string' && item.url.startsWith('blob:')) {
                      URL.revokeObjectURL(item.url);
                    }
                  });
                }
                setSelectedType(type.id);
                setTypeLocked(true);
                setMedia([]);
                setVisibleMediaSlots(type.id === 'carousel' ? 3 : 1);
                setFormError('');
              }}
            >
              <div className="ig-post-type-icon">{type.icon}</div>
              <span className="ig-post-type-label">{type.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {typeLocked ? (
      <div className="ig-post-editor">
        <div className="ig-post-editor-header">
          <h3 className={`ig-editor-title ig-editor-title-${selectedType}`}>
            <span className="ig-title-fixed-icon" aria-hidden="true">
              <Sparkles size={14} />
            </span>
            {activeConfig.title} — <span>{selectedTypeLabel}</span>
          </h3>
          <button type="button" className="ig-close-btn ig-close-editor-btn" onClick={requestCloseEditor} aria-label="Fermer">
            ×
          </button>
        </div>

        <div className="ig-ai-compose-row">
          <label className="ig-ai-input-wrap" htmlFor="ig-ai-compose-prompt">
            <span className="ig-ai-input-icon" aria-hidden="true">
              <Sparkles size={13} />
            </span>
            <input
              id="ig-ai-compose-prompt"
              type="text"
              className="ig-ai-input"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              onFocus={() => setAiPromptFocused(true)}
              onBlur={() => setAiPromptFocused(false)}
              placeholder="Décrivez votre post, l'IA génère tout..."
            />
          </label>
          <button type="button" className={`ig-generate-btn ${aiPromptFocused ? 'active' : ''}`} onClick={fillFromAI}>
            <Sparkles size={13} />
            Générer
          </button>
        </div>

        <div className="ig-preview-card">
          <div className="ig-post-content-header ig-create-preview-header">
            <div className="ig-post-header-left">
              <img src={profileImage} alt="Profil" className="ig-post-avatar ig-post-avatar-photo" />
              <div className="ig-post-header-meta">
                <div className="ig-post-header-row">
                  <strong className="ig-create-preview-username">{defaultAuthor}</strong>
                  <span className="ig-post-time">• {scheduleTimeOnly || scheduleLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {previewMedia ? (
            <div className="ig-preview-media-panel">
              {previewMedia.kind === 'video' ? (
                <PreviewVideo
                  src={previewMedia.url}
                  controls
                  autoPlay
                  loop
                  className="ig-preview-media-player"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt="Aperçu média"
                  className="ig-preview-media-player"
                />
              )}
              <button
                type="button"
                className="ig-preview-media-close"
                onClick={() => setPreviewMedia(null)}
                aria-label="Fermer l'aperçu"
              >
                ×
              </button>
            </div>
          ) : null}

          <div className="ig-editor-block">
            <div className="ig-editor-label-row">
              <span>MEDIA</span>
              <div className="ig-editor-icons">
                <button type="button" className="ig-icon-btn" aria-label="Génération média IA" onClick={generateMediaFromAI} disabled={isGenerating}>
                  <Sparkles size={14} />
                </button>
              </div>
            </div>
            <MediaGrid
              media={media}
              maxMedia={activeConfig.maxMedia}
              mediaRenderKey={mediaRenderKey}
              visibleSlots={visibleMediaSlots}
              onVisibleSlotsChange={setVisibleMediaSlots}
              onMediaAdd={addMediaManually}
              onMediaRemove={removeMedia}
              onMediaPreview={handleMediaPreview}
              onMediaGenerate={generateMediaFromAI}
              selectedTypeLabel={selectedTypeLabel}
              mediaLabel={activeConfig.mediaLabel}
              accept={activeConfig.accept}
              aiKind={activeConfig.aiKind}
            />
            <input
              ref={mediaInputRef}
              type="file"
              className="ig-hidden-file-input"
              accept={activeConfig.accept}
              multiple={activeConfig.maxMedia > 1}
              onChange={onManualMediaChange}
            />
            {formError ? <p className="ig-form-error">{formError}</p> : null}
          </div>

          {activeConfig.showCaption ? (
            <div className="ig-editor-block">
                <div className="ig-editor-label-row">
                  <span>CAPTION</span>
                  <div className="ig-editor-icons">
                    <button type="button" className="ig-icon-btn" aria-label="Génération IA" onClick={generateCaption}>
                      <Sparkles size={14} />
                    </button>
                    <button
                      type="button"
                      className={`ig-icon-btn ${manualCaptionEnabled ? 'active' : ''}`}
                      aria-label="Édition manuelle"
                      onClick={enableManualCaption}
                    >
                      <PenLine size={14} />
                    </button>
                  </div>
                </div>
                <div className="ig-editor-input-shell">
                  <textarea
                    className="ig-editor-textarea"
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Cliquez pour rédiger ou générer avec l'IA"
                    readOnly={!manualCaptionEnabled}
                    ref={captionInputRef}
                  />
                </div>
            </div>
          ) : null}

          {activeConfig.showHashtags ? (
            <div className="ig-editor-block">
              <div className="ig-editor-label-row">
                <span>HASHTAGS</span>
                <div className="ig-editor-icons">
                  <button type="button" className="ig-icon-btn" aria-label="Génération IA hashtags" onClick={generateHashtagsFromAI} disabled={isGenerating}>
                    <Sparkles size={14} />
                  </button>
                  <button
                    type="button"
                    className={`ig-icon-btn ${manualHashtagsEnabled ? 'active' : ''}`}
                    aria-label="Édition manuelle hashtags"
                    onClick={enableManualHashtags}
                  >
                    <Hash size={14} />
                  </button>
                </div>
              </div>
              <div className="ig-editor-input-shell">
                <input
                  type="text"
                  className="ig-editor-input"
                  value={hashtags}
                  onChange={(event) => setHashtags(event.target.value)}
                  placeholder="Cliquez pour ajouter ou générer avec l'IA"
                  readOnly={!manualHashtagsEnabled}
                  ref={hashtagsInputRef}
                />
              </div>
            </div>
          ) : null}
        </div>

        <button type="button" className="ig-primary-btn ig-post-now-btn" onClick={publishNow}>
          <Send size={13} />
          Publier maintenant
        </button>

        <div className="ig-schedule-card">
          <div className="ig-schedule-header">PLANIFIER POUR PLUS TARD</div>
          <div className="ig-schedule-date-wrap">
            <input
              type="text"
              className="ig-schedule-input"
              value={scheduleLabel}
              readOnly
            />
            <input
              ref={scheduleInputRef}
              type="datetime-local"
              className="ig-hidden-date-input"
              value={scheduleAt}
              onChange={(event) => setScheduleAt(event.target.value)}
            />
            <button type="button" className="ig-date-icon-btn" onClick={openCalendarPicker} aria-label="Ouvrir le calendrier">
              <CalendarDays size={14} />
            </button>
          </div>
          <div className="ig-schedule-actions">
            <button type="button" className="ig-schedule-btn" onClick={schedulePost}>
              <CalendarDays size={14} />
              Planifier
            </button>
            <button type="button" className="ig-reserve-btn" onClick={saveDraft}>Garder en réserve</button>
          </div>
        </div>
      </div>
      ) : null}

      {showExitConfirm ? (
        <div className="ig-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmation abandon publication">
          <div className="ig-confirm-card">
            <h4>Quitter l'éditeur maintenant ?</h4>
            <p>Si vous continuez la fermeture, votre création en cours sera perdue.</p>
            <div className="ig-confirm-actions">
              <button type="button" className="ig-confirm-stay-btn" onClick={() => setShowExitConfirm(false)}>
                Continuer la création
              </button>
              <button type="button" className="ig-confirm-leave-btn" onClick={confirmCloseEditor}>
                Abandonner
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CreatePost;
