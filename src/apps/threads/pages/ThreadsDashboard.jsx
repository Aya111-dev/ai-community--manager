import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Hash,
  Heart,
  Image,
  MessageCircle,
  Monitor,
  MoreHorizontal,
  Plus,
  Repeat2,
  Send,
  Smartphone,
  Sparkles,
  Video,
  X
} from 'lucide-react';
import ThreadsSingleVideoPost, { isThreadsSocialPost } from '../components/ThreadsSingleVideoPost.jsx';
import { generateThemedPostMedia, mapPostTypeForApi } from '../../../services/aiMediaHelpers.js';

const WEEK_DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const HOURS = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}h`);

function getStartOfWeek(date) {
  const clone = new Date(date);
  const day = clone.getDay();
  clone.setHours(0, 0, 0, 0);
  clone.setDate(clone.getDate() - day);
  return clone;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatWeekRange(startDate) {
  const endDate = addDays(startDate, 6);
  const options = { month: 'short', day: '2-digit', year: 'numeric' };
  return `${startDate.toLocaleDateString('fr-FR', options)} - ${endDate.toLocaleDateString('fr-FR', options)}`;
}

function formatSelectedDate(date) {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const tabs = [
  { id: 'published', label: 'Publiés' },
  { id: 'scheduled', label: 'Planifiés' },
  { id: 'draft', label: 'Brouillons' }
];

const THREADS_LOGO_URL = 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/threads.svg';

function ThreadsChoiceLogo({ size = 24 }) {
  return <img src={THREADS_LOGO_URL} alt="" className="threads-modal-choice-logo" width={size} height={size} />;
}

function generateMetadataFromPromptThreads(rawPrompt, mediaKind) {
  const prompt = rawPrompt.trim();
  const words = prompt.toLowerCase().split(/\s+/).filter(Boolean);
  const thematic = [];
  if (words.some((w) => w.includes('beaute') || w.includes('beauté') || w.includes('skin'))) thematic.push('#beaute', '#beautytips');
  if (words.some((w) => w.includes('mode') || w.includes('fashion') || w.includes('style'))) thematic.push('#fashion', '#style');
  if (words.some((w) => w.includes('food') || w.includes('cuisine') || w.includes('recipe'))) thematic.push('#food', '#foodie');
  if (words.some((w) => w.includes('travel') || w.includes('voyage') || w.includes('aventure'))) thematic.push('#travel', '#explore');
  if (words.some((w) => w.includes('sport') || w.includes('fitness') || w.includes('workout'))) thematic.push('#fitness', '#workout');
  const base =
    mediaKind === 'video'
      ? ['#threads', '#video', '#viral']
      : mediaKind === 'story'
        ? ['#threads', '#discussion', '#viral']
        : ['#threads', '#photo', '#viral'];
  const hashtags = [...new Set([...base, ...thematic])].slice(0, 8).join(' ');
  return { caption: `✨ ${prompt}`, hashtags };
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function ThreadsDashboard() {
  const {
    showCreateSection,
    setShowCreateSection,
    threadsPlatformLayout,
    threadItems,
    setThreadItems,
    showStrategyCalendar,
    setShowStrategyCalendar
  } = useOutletContext();

  const [activeTab, setActiveTab] = useState('published');
  const [viewMode, setViewMode] = useState('desktop');
  const [selectedPublishType, setSelectedPublishType] = useState(null);
  const [threadKind, setThreadKind] = useState('text');

  const [composerPrompt, setComposerPrompt] = useState('');
  const [threadPreview, setThreadPreview] = useState('');
  const [threadCaption, setThreadCaption] = useState('');
  const [threadHashtags, setThreadHashtags] = useState('');
  const [threadMediaUrl, setThreadMediaUrl] = useState('');
  const [threadAiMediaUrls, setThreadAiMediaUrls] = useState([]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [composerText, setComposerText] = useState('');

  const [manualMediaFiles, setManualMediaFiles] = useState([]);
  const manualMediaInputRef = useRef(null);

  const [scheduleWeekStart, setScheduleWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedScheduleAt, setSelectedScheduleAt] = useState(null);
  const [showThreadsSchedulePicker, setShowThreadsSchedulePicker] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');

  const [editingThreadId, setEditingThreadId] = useState(null);
  const [showThreadMoreOptions, setShowThreadMoreOptions] = useState(null);
  const [strategyNotice, setStrategyNotice] = useState('');
  const [publishStatus, setPublishStatus] = useState('');
  const [pendingDeleteThreadId, setPendingDeleteThreadId] = useState(null);

  useEffect(() => {
    setViewMode(threadsPlatformLayout === 'mobile' ? 'mobile' : 'desktop');
  }, [threadsPlatformLayout]);

  useEffect(() => {
    if (!showStrategyCalendar) return;
    setShowStrategyCalendar(false);
    setStrategyNotice('Calendrier stratégique Threads — bientôt disponible.');
    const t = setTimeout(() => setStrategyNotice(''), 4200);
    return () => clearTimeout(t);
  }, [showStrategyCalendar, setShowStrategyCalendar]);

  useEffect(() => {
    if (!publishStatus) return;
    const t = setTimeout(() => setPublishStatus(''), 2800);
    return () => clearTimeout(t);
  }, [publishStatus]);

  useEffect(() => {
    if (!pendingDeleteThreadId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPendingDeleteThreadId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingDeleteThreadId]);

  const [manualMediaPreviewUrls, setManualMediaPreviewUrls] = useState([]);
  useEffect(() => {
    const urls = manualMediaFiles.map((f) => URL.createObjectURL(f));
    setManualMediaPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [manualMediaFiles]);

  const filteredThreads = useMemo(() => {
    const statusMap = { published: 'published', scheduled: 'scheduled', draft: 'draft' };
    const st = statusMap[activeTab];
    return threadItems.filter((p) => p.status === st);
  }, [threadItems, activeTab]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(scheduleWeekStart, index)),
    [scheduleWeekStart]
  );

  const eventsBySlot = useMemo(() => {
    return threadItems
      .filter((t) => t.status === 'scheduled' && t.scheduledAt)
      .reduce((acc, item) => {
        const d = item.scheduledAt instanceof Date ? item.scheduledAt : new Date(item.scheduledAt);
        const key = `${d.toDateString()}-${d.getHours()}`;
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {});
  }, [threadItems]);

  const resetComposerLocal = () => {
    setComposerPrompt('');
    setThreadPreview('');
    setThreadCaption('');
    setThreadHashtags('');
    setThreadMediaUrl('');
    setThreadAiMediaUrls([]);
    setComposerText('');
    setManualMediaFiles([]);
    setEditingThreadId(null);
    setSelectedScheduleAt(null);
    setShowThreadsSchedulePicker(false);
    setScheduleMessage('');
    setScheduleWeekStart(getStartOfWeek(new Date()));
  };

  const closeCreateFlow = () => {
    setShowCreateSection(false);
    setSelectedPublishType(null);
    resetComposerLocal();
  };

  const openComposeFromPicker = (kind) => {
    setEditingThreadId(null);
    resetComposerLocal();
    setThreadKind(kind);
    setSelectedPublishType('thread-compose');
  };

  const handleAiSubmitThreads = async (e) => {
    e?.preventDefault?.();
    const prompt = composerPrompt.trim();
    if (!prompt || prompt.length < 3) return;
    const apiPostType = mapPostTypeForApi(
      threadKind === 'video' ? 'video' : threadKind === 'carousel' ? 'carousel' : 'text'
    );
    const mediaCount = threadKind === 'carousel' ? 3 : threadKind === 'video' ? 1 : 0;
    setIsAiGenerating(true);
    try {
      const result = await generateThemedPostMedia({
        description: prompt,
        platform: 'threads',
        postType: apiPostType,
        count: mediaCount || 1,
        regenerate: Boolean(threadPreview.trim() || threadCaption.trim() || threadMediaUrl),
        withMedia: threadKind !== 'text',
      });
      setThreadPreview(prompt);
      setThreadCaption(result.caption);
      setThreadHashtags(result.hashtags);
      setComposerText(result.caption);
      if (result.mediaItems.length > 0) {
        const urls = result.mediaItems.map((item) => item.url);
        setThreadAiMediaUrls(urls);
        setThreadMediaUrl(urls[0]);
      }
      setSelectedScheduleAt(null);
      setScheduleMessage('');
      setScheduleWeekStart(getStartOfWeek(new Date()));
    } catch (error) {
      alert(error.message || 'Erreur de génération IA');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleManualMediaFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setManualMediaFiles((prev) => {
      const next = [...prev];
      files.forEach((file) => {
        if (next.length < 4) next.push(file);
      });
      return next.slice(0, 4);
    });
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setThreadMediaUrl(url);
    }
    event.target.value = '';
  };

  const handleRemoveManualMediaFile = (index) => {
    setManualMediaFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenManualMediaPicker = () => {
    manualMediaInputRef.current?.click();
  };

  const handleChangeWeek = (direction) => {
    setScheduleWeekStart((current) => addDays(current, direction * 7));
  };

  const handleSelectScheduleCell = (day, hour) => {
    const date = new Date(day);
    date.setHours(parseInt(hour, 10), 0, 0, 0);
    setSelectedScheduleAt(date);
    setScheduleMessage('');
  };

  const hasPlanifiableContent = () => {
    if (threadKind === 'text') {
      return Boolean(threadPreview?.trim() || composerText.trim());
    }
    return Boolean(manualMediaFiles.length || threadMediaUrl || threadPreview);
  };

  const openThreadsSchedulePicker = () => {
    if (!hasPlanifiableContent()) {
      setScheduleMessage(
        threadKind === 'text'
          ? 'Génère ou écris d’abord du contenu avant de planifier.'
          : 'Ajoute ou génère d’abord un média avant de planifier.'
      );
      return;
    }
    setShowThreadsSchedulePicker((prev) => !prev);
    setScheduleMessage('');
  };

  const buildThreadBody = () => {
    const main = (composerText || threadCaption || threadPreview || '').trim();
    const tags = (threadHashtags || '').trim();
    if (!main) return '';
    return tags ? `${main}\n\n${tags}` : main;
  };

  const commitThread = async (status) => {
    let body = buildThreadBody();
    if (!body && (manualMediaFiles.length > 0 || threadMediaUrl)) {
      body = [threadCaption, threadHashtags, threadPreview, composerText].map((s) => (s || '').trim()).find(Boolean) || '—';
    }
    if (!body) return;
    if (status === 'scheduled' && !selectedScheduleAt) {
      setScheduleMessage('Choisis d’abord une date et une heure dans le calendrier.');
      return;
    }

    const contentPreviewsRaw =
      manualMediaFiles.length > 0
        ? await Promise.all(manualMediaFiles.map((file) => fileToDataUrl(file)))
        : threadAiMediaUrls.length > 0
          ? threadAiMediaUrls
          : threadMediaUrl
            ? [threadMediaUrl]
            : [];
    const contentPreviews = contentPreviewsRaw.filter(Boolean);
    const contentMediaKinds =
      manualMediaFiles.length > 0
        ? manualMediaFiles.map((file) => (file.type?.startsWith('video/') ? 'video' : 'image'))
        : contentPreviews.length > 0
          ? contentPreviews.map(() => (threadKind === 'video' ? 'video' : 'image'))
          : [];
    const contentPreview = contentPreviews[0] || '';

    const rowBase = {
      type: threadKind,
      author: '@vous',
      body,
      caption: threadCaption || composerText || threadPreview,
      hashtags: threadHashtags,
      contentPreview,
      contentPreviews,
      contentMediaKinds,
      likes: 0,
      replies: 0,
      reposts: 0,
      shares: 0,
      generationSource: composerPrompt.trim() ? 'ai' : 'manual',
      createdAt: new Date(),
      scheduledAt: status === 'scheduled' ? selectedScheduleAt : undefined
    };

    if (editingThreadId) {
      setThreadItems((prev) =>
        prev.map((t) =>
          t.id === editingThreadId
            ? {
                ...t,
                ...rowBase,
                status,
                id: t.id
              }
            : t
        )
      );
      setPublishStatus('Thread mis à jour');
    } else {
      setThreadItems((prev) => [
        {
          id: `th-${Date.now()}`,
          status,
          ...rowBase
        },
        ...prev
      ]);
      setPublishStatus(
        status === 'published' ? 'Thread publié' : status === 'scheduled' ? 'Thread planifié' : 'Brouillon enregistré'
      );
    }

    resetComposerLocal();
    setSelectedPublishType(null);
    setShowCreateSection(false);
    setShowThreadsSchedulePicker(false);
    setShowThreadMoreOptions(null);
  };

  const handleThreadsScheduleConfirm = () => {
    if (!selectedScheduleAt) {
      setScheduleMessage('Choisis d’abord une date et une heure.');
      return;
    }
    commitThread('scheduled');
  };

  const handleRequestDeleteThread = (id) => {
    setShowThreadMoreOptions(null);
    setPendingDeleteThreadId(id);
  };

  const handleConfirmDeleteThread = () => {
    if (!pendingDeleteThreadId) return;
    setThreadItems((prev) => prev.filter((t) => t.id !== pendingDeleteThreadId));
    setPendingDeleteThreadId(null);
    setPublishStatus('Thread supprimé');
  };

  const handlePublishDraftThread = (post) => {
    setThreadItems((prev) => prev.map((t) => (t.id === post.id ? { ...t, status: 'published' } : t)));
    setShowThreadMoreOptions(null);
    setPublishStatus('Thread publié');
  };

  const handleEditThread = (post) => {
    setShowThreadMoreOptions(null);
    setEditingThreadId(post.id);
    setThreadKind(post.type || 'text');
    setComposerText(post.body || '');
    setThreadCaption(post.caption || '');
    setThreadHashtags(post.hashtags || '');
    setThreadPreview(post.caption || post.body || '');
    setThreadMediaUrl(post.contentPreview || '');
    setSelectedPublishType('thread-compose');
    setShowCreateSection(true);
  };

  const kindLabel = (t) => {
    if (t === 'video') return 'Vidéo';
    if (t === 'carousel') return 'Photo';
    return 'Thread';
  };

  const renderThreadsScheduleCalendar = () => (
    <div className="schedule-calendar-panel compact">
      <div className="schedule-calendar-header">
        <button type="button" className="schedule-calendar-nav" onClick={() => handleChangeWeek(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="schedule-calendar-range">{formatWeekRange(scheduleWeekStart)}</div>
        <button type="button" className="schedule-calendar-nav" onClick={() => handleChangeWeek(1)}>
          <ChevronRight size={18} />
        </button>
        <button type="button" className="schedule-calendar-today" onClick={() => setScheduleWeekStart(getStartOfWeek(new Date()))}>
          Aujourd&apos;hui
        </button>
      </div>

      <div className="schedule-calendar-grid">
        <div className="schedule-calendar-grid-head">
          <div className="schedule-calendar-cell time-cell">GMT+1</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="schedule-calendar-cell header-cell">
              <div>{WEEK_DAYS[day.getDay()]}</div>
              <strong>{day.getDate()}</strong>
            </div>
          ))}
        </div>

        <div className="schedule-calendar-grid-body">
          {HOURS.map((hour) => (
            <div key={hour} className="schedule-calendar-row">
              <div className="schedule-calendar-cell time-cell">{hour}</div>
              {weekDays.map((day) => {
                const hourNumber = parseInt(hour, 10);
                const cellDate = new Date(day);
                cellDate.setHours(hourNumber, 0, 0, 0);
                const key = `${cellDate.toDateString()}-${hourNumber}`;
                const events = eventsBySlot[key] || [];
                const isSelected =
                  selectedScheduleAt && selectedScheduleAt.getTime() === cellDate.getTime();
                return (
                  <button
                    key={`${day.toISOString()}-${hour}`}
                    type="button"
                    className={`schedule-calendar-cell slot-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectScheduleCell(day, hourNumber.toString())}
                  >
                    {events.length > 0 && (
                      <div className="schedule-event-pill">
                        <span className={`pill-type ${events[0].type === 'video' ? 'video' : 'image'}`}>
                          {events[0].type === 'video' ? 'Vidéo' : 'Photo'}
                        </span>
                        {events.length > 1 && <span className="pill-count">+{events.length - 1}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="schedule-selected-info">
        <div>
          <span>Choix sélectionné</span>
          <strong>{selectedScheduleAt ? selectedScheduleAt.toLocaleString('fr-FR') : 'Aucune date choisie'}</strong>
        </div>
        <button type="button" className="story-schedule-button primary" onClick={handleThreadsScheduleConfirm}>
          Planifier le thread
        </button>
      </div>
    </div>
  );

  const showStoryComposePreview =
    Boolean(threadPreview || threadMediaUrl || manualMediaFiles.length) ||
    (threadKind === 'text' && Boolean(composerText.trim()));
  const composerPreviewMedia =
    manualMediaPreviewUrls.length > 0
      ? manualMediaPreviewUrls
      : threadAiMediaUrls.length > 0
        ? threadAiMediaUrls
        : threadMediaUrl
          ? [threadMediaUrl]
          : [];
  const composerPreviewMediaKinds =
    manualMediaFiles.length > 0
      ? manualMediaFiles.map((file) => (file.type?.startsWith('video/') ? 'video' : 'image'))
      : composerPreviewMedia.length > 0
        ? composerPreviewMedia.map(() => (threadKind === 'video' ? 'video' : 'image'))
        : [];
  const composerPreviewBody = (() => {
    const main = (composerText || threadCaption || threadPreview || '').trim();
    const tags = (threadHashtags || '').trim();
    if (main && tags) return `${main}\n\n${tags}`;
    return main || tags;
  })();
  const canRegenerateWithAi = composerPrompt.trim().length >= 3 && !isAiGenerating;
  const composerPreviewPost = {
    id: 'threads-compose-preview',
    status: 'draft',
    type: threadKind,
    author: '@vous',
    body: composerPreviewBody,
    caption: threadCaption || composerText || threadPreview,
    hashtags: threadHashtags,
    contentPreview: composerPreviewMedia[0] || '',
    contentPreviews: composerPreviewMedia,
    contentMediaKinds: composerPreviewMediaKinds,
    likes: 0,
    replies: 0,
    reposts: 0,
    shares: 0,
    generationSource: composerPrompt.trim() ? 'ai' : 'manual',
    createdAt: new Date().toISOString()
  };

  return (
    <>
      {strategyNotice ? (
        <div className="threads-banner-notice" role="status">
          {strategyNotice}
        </div>
      ) : null}

      {publishStatus ? (
        <div className="threads-publish-toast" role="status">
          {publishStatus}
        </div>
      ) : null}

      {showCreateSection && (
        <section
          className={`dashboard-card dashboard-publish-card threads-dashboard ${
            selectedPublishType === 'thread-compose' ? 'story-full-width-layout' : ''
          }`}
        >
          {selectedPublishType !== null && (
            <div className="publish-section-header">
              <h3>Création de contenu</h3>
            </div>
          )}

          {selectedPublishType === null && (
            <div className="create-content-modal">
              <div className="create-modal-header">
                <div className="create-modal-logo">
                  <div className="logo-circle">
                    <span className="logo-text">U</span>
                  </div>
                  <span className="create-modal-title">
                    <span className="create-modal-title-line1">Que souhaitez-vous</span>{' '}
                    <span className="create-modal-title-line2">publier ?</span>
                  </span>
                </div>
                <button type="button" className="create-modal-close" onClick={closeCreateFlow} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>

              <div className="create-modal-buttons tiktok-create-type-grid">
                <button type="button" className="create-modal-button" onClick={() => openComposeFromPicker('video')}>
                  <div className="modal-button-icon">
                    <Video size={26} strokeWidth={1.5} />
                  </div>
                  <span className="modal-button-text">Vidéo</span>
                </button>
                <button type="button" className="create-modal-button" onClick={() => openComposeFromPicker('carousel')}>
                  <div className="modal-button-icon">
                    <Image size={26} strokeWidth={1.5} />
                  </div>
                  <span className="modal-button-text">Photo</span>
                </button>
                <button type="button" className="create-modal-button" onClick={() => openComposeFromPicker('text')}>
                  <div className="modal-button-icon threads-thread-choice-icon">
                    <ThreadsChoiceLogo size={26} />
                  </div>
                  <span className="modal-button-text">Thread</span>
                </button>
              </div>
            </div>
          )}

          {selectedPublishType === 'thread-compose' && (
            <div className="story-creation-panel threads-compose-panel">
              <button
                type="button"
                className="story-creation-close"
                aria-label="Retour"
                onClick={() => {
                  setSelectedPublishType(null);
                  resetComposerLocal();
                }}
              >
                <X size={20} />
              </button>

              <div className="ai-interface-exact threads-compose-top">
                <div className="publish-ai-form threads-inline-ai">
                  <div className="publish-ai-input-wrapper">
                    <Sparkles size={16} color="#6b7280" />
                    <input
                      type="text"
                      className="publish-ai-input"
                      value={composerPrompt}
                      onChange={(e) => setComposerPrompt(e.target.value)}
                      placeholder={`Décrivez votre ${threadKind === 'video' ? 'vidéo' : threadKind === 'carousel' ? 'photo' : 'thread'}, l'IA génère tout...`}
                      maxLength={500}
                    />
                  </div>
                  <button
                    type="button"
                    className="publish-ai-submit"
                    onClick={handleAiSubmitThreads}
                    disabled={!composerPrompt.trim() || composerPrompt.length < 3}
                  >
                    <Sparkles size={16} />
                    <span>Générer</span>
                  </button>
                </div>
              </div>

              {threadKind === 'text' && (
                <div style={{ marginTop: 16 }}>
                  <textarea
                    className="threads-compose-textarea threads-compose-textarea-plain"
                    rows={viewMode === 'mobile' ? 5 : 6}
                    placeholder="Écris ton thread (sans IA)…"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    maxLength={2000}
                  />
                  <div className="threads-composer-meta">{composerText.length} / 2000</div>
                </div>
              )}



              {showStoryComposePreview && (
                <div style={{ marginTop: 18 }}>
                  <div className="threads-compose-meta-tools">
                    <div className="publish-ai-form">
                      <div className="publish-ai-input-wrapper">
                        <Edit3 size={16} color="#6b7280" />
                        <input
                          type="text"
                          className="publish-ai-input"
                          value={threadCaption}
                          onChange={(e) => setThreadCaption(e.target.value)}
                          placeholder="Écris la caption"
                        />
                        <button
                          type="button"
                          className="threads-input-ai-inline"
                          onClick={handleAiSubmitThreads}
                          disabled={!canRegenerateWithAi}
                          aria-label="Régénérer avec l’IA"
                          title="Régénérer avec l’IA"
                        >
                          <Sparkles size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="publish-ai-form">
                      <div className="publish-ai-input-wrapper">
                        <Hash size={16} color="#6b7280" />
                        <input
                          type="text"
                          className="publish-ai-input"
                          value={threadHashtags}
                          onChange={(e) => setThreadHashtags(e.target.value)}
                          placeholder={
                            threadKind === 'video' ? '#threads #video' : threadKind === 'carousel' ? '#threads #photo' : '#threads #discussion'
                          }
                        />
                        <button
                          type="button"
                          className="threads-input-ai-inline"
                          onClick={handleAiSubmitThreads}
                          disabled={!canRegenerateWithAi}
                          aria-label="Régénérer avec l’IA"
                          title="Régénérer avec l’IA"
                        >
                          <Sparkles size={12} />
                        </button>
                      </div>
                    </div>
                  </div>


                  <div className="threads-compose-post-shell">
                    <div className={`tiktok-post-preview ${viewMode} threads-post-preview threads-post-preview-${threadKind || 'text'}`}>
                      <div className="tiktok-video-container threads-thread-surface">
                        <ThreadsSingleVideoPost
                          post={composerPreviewPost}
                          viewMode={viewMode}
                          className="threads-dashboard-social-post threads-compose-live-post"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(threadKind === 'video' || threadKind === 'carousel') && (
                <div className="story-media-grid" style={{ marginTop: 18 }}>
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="story-media-slot">
                      {manualMediaFiles[index] ? (
                        <div className="story-media-preview">
                          {manualMediaFiles[index].type?.startsWith('video/') ? (
                            <video className="story-media-video" autoPlay muted loop playsInline>
                              <source src={URL.createObjectURL(manualMediaFiles[index])} />
                            </video>
                          ) : (
                            <img
                              className="story-media-image"
                              src={URL.createObjectURL(manualMediaFiles[index])}
                              alt={`Media ${index + 1}`}
                            />
                          )}
                          <button type="button" className="story-media-remove" onClick={() => handleRemoveManualMediaFile(index)}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : threadAiMediaUrls[index] ? (
                        <div className="story-media-preview">
                          {threadKind === 'video' ? (
                            <video className="story-media-video" autoPlay muted loop playsInline>
                              <source src={threadAiMediaUrls[index]} />
                            </video>
                          ) : (
                            <img
                              className="story-media-image"
                              src={threadAiMediaUrls[index]}
                              alt={`Media IA ${index + 1}`}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="story-media-empty" onClick={handleOpenManualMediaPicker} role="presentation">
                          <div className="story-media-icon">
                            <Image size={32} />
                          </div>
                          <span className="story-media-text">Ajouter un média</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="story-media-slot">
                    {manualMediaFiles[3] ? (
                      <div className="story-media-preview">
                        {manualMediaFiles[3].type?.startsWith('video/') ? (
                          <video className="story-media-video" autoPlay muted loop playsInline>
                            <source src={URL.createObjectURL(manualMediaFiles[3])} />
                          </video>
                        ) : (
                          <img className="story-media-image" src={URL.createObjectURL(manualMediaFiles[3])} alt="Media 4" />
                        )}
                        <button type="button" className="story-media-remove" onClick={() => handleRemoveManualMediaFile(3)}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="story-media-add" onClick={handleOpenManualMediaPicker} role="presentation">
                        <button
                          type="button"
                          className="threads-media-ai-badge"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAiSubmitThreads();
                          }}
                          disabled={!canRegenerateWithAi}
                          aria-label="Générer un média avec l’IA"
                          title="Générer un média avec l’IA"
                        >
                          <Sparkles size={12} />
                        </button>
                        <Plus size={32} />
                        <span>Ajouter</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={manualMediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleManualMediaFileChange}
                style={{ display: 'none' }}
              />

              {(threadKind === 'video' || threadKind === 'carousel') && manualMediaFiles.length > 0 ? (
                <div className="threads-compose-meta-tools threads-compose-meta-tools-under-media">
                  <div className="publish-ai-form">
                    <div className="publish-ai-input-wrapper">
                      <Edit3 size={16} color="#6b7280" />
                      <input
                        type="text"
                        className="publish-ai-input"
                        value={threadCaption}
                        onChange={(e) => setThreadCaption(e.target.value)}
                        placeholder="Écris la caption"
                      />
                      <button
                        type="button"
                        className="threads-input-ai-inline"
                        onClick={handleAiSubmitThreads}
                        disabled={!canRegenerateWithAi}
                        aria-label="Régénérer avec l’IA"
                        title="Régénérer avec l’IA"
                      >
                        <Sparkles size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="publish-ai-form">
                    <div className="publish-ai-input-wrapper">
                      <Hash size={16} color="#6b7280" />
                      <input
                        type="text"
                        className="publish-ai-input"
                        value={threadHashtags}
                        onChange={(e) => setThreadHashtags(e.target.value)}
                        placeholder={threadKind === 'video' ? '#threads #video' : '#threads #photo'}
                      />
                      <button
                        type="button"
                        className="threads-input-ai-inline"
                        onClick={handleAiSubmitThreads}
                        disabled={!canRegenerateWithAi}
                        aria-label="Régénérer avec l’IA"
                        title="Régénérer avec l’IA"
                      >
                        <Sparkles size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {scheduleMessage ? <div className="story-schedule-message">{scheduleMessage}</div> : null}

              <div className="tiktok-publish-actions" style={{ marginTop: 18 }}>
                <button type="button" className="tiktok-publish-primary" onClick={() => commitThread('published')}>
                  <Send size={20} />
                  <span>Publier maintenant</span>
                </button>

                <div className="tiktok-schedule-block">
                  <div className="tiktok-schedule-title">
                    <Calendar size={18} />
                    <span>PLANIFIER POUR PLUS TARD</span>
                  </div>
                  <div className="tiktok-schedule-input">
                    <input
                      type="text"
                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}
                      readOnly
                      onClick={openThreadsSchedulePicker}
                    />
                    <button type="button" onClick={openThreadsSchedulePicker} aria-label="Ouvrir le calendrier">
                      <Calendar size={18} />
                    </button>
                  </div>
                  <div className="tiktok-publish-secondary-row">
                    <button type="button" className="tiktok-publish-secondary" onClick={openThreadsSchedulePicker}>
                      <Calendar size={18} />
                      <span>Planifier</span>
                    </button>
                    <button type="button" className="tiktok-publish-tertiary" onClick={() => commitThread('draft')}>
                      <span>Garder en réserve</span>
                    </button>
                  </div>
                </div>
              </div>

              {showThreadsSchedulePicker && renderThreadsScheduleCalendar()}
            </div>
          )}
        </section>
      )}

      <section className="dashboard-card dashboard-posts-card threads-dashboard-posts">
        <div className="dashboard-posts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>
              {activeTab === 'draft' ? 'Brouillons' : activeTab === 'scheduled' ? 'Planifiés' : 'Fil d\'actualité'}
            </h3>
          </div>

          <div className="dashboard-posts-controls" style={{ marginLeft: 'auto' }}>
            <div className="tab-group">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
                  onClick={() => {
                    setShowThreadMoreOptions(null);
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="view-group">
              <button type="button" className={viewMode === 'desktop' ? 'view-button active' : 'view-button'} onClick={() => setViewMode('desktop')} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}>
                <Monitor size={16} />
                Desktop
              </button>
              <button type="button" className={viewMode === 'mobile' ? 'view-button active' : 'view-button'} onClick={() => setViewMode('mobile')} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}>
                <Smartphone size={16} />
                Mobile
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-posts-content">
          {filteredThreads.length === 0 ? (
            <div className="no-posts-message">
              <div className="no-posts-icon">
                {activeTab === 'scheduled' ? <Calendar size={48} color="#666" /> : <MessageCircle size={48} color="#666" />}
              </div>
              <p>
                {activeTab === 'scheduled'
                  ? 'Planifiez votre premier contenu en utilisant le bouton de création'
                  : 'Publiez votre premier contenu pour le voir ici'}
              </p>
            </div>
          ) : (
            <div className={`posts-grid posts-grid-${viewMode}`}>
              {filteredThreads.map((post) => (
                <div key={post.id} className={`tiktok-post-preview ${viewMode} threads-post-preview threads-post-preview-${post.type || 'text'}`}>
                  <div className="tiktok-video-container threads-thread-surface">
                    {activeTab === 'scheduled' && (
                      <div className="scheduled-badge threads-scheduled-badge">
                        <Calendar size={14} />
                        <span>Planifié</span>
                      </div>
                    )}

                    {isThreadsSocialPost(post) ? (
                      <ThreadsSingleVideoPost
                        post={post}
                        viewMode={viewMode}
                        className="threads-dashboard-social-post"
                        headerAction={
                          <div className="more-options threads-more-options threads-inline-more-options">
                            <button
                              type="button"
                              className="more-btn threads-more-btn"
                              title="Plus d’options"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowThreadMoreOptions(showThreadMoreOptions === post.id ? null : post.id);
                              }}
                            >
                              <MoreHorizontal size={18} className="threads-more-icon" />
                            </button>
                            {showThreadMoreOptions === post.id && (
                              <div className="published-edit-dropdown threads-post-dropdown">
                                <button type="button" onClick={() => handleEditThread(post)}>
                                  Modifier
                                </button>
                                {activeTab === 'draft' && (
                                  <button type="button" onClick={() => handlePublishDraftThread(post)}>
                                    Publier
                                  </button>
                                )}
                                <button type="button" onClick={() => handleRequestDeleteThread(post.id)}>
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        }
                      />
                    ) : (
                      <>
                        <div className="threads-thread-inner">
                          <div className="threads-thread-head">
                            <div className="threads-thread-avatar-lg">{post.author.replace('@', '').charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="threads-thread-handle">{post.author}</div>
                              <div className="threads-thread-kind">{kindLabel(post.type)}</div>
                            </div>
                          </div>

                          {post.contentPreviews?.length > 1 && (post.type === 'video' || post.type === 'carousel') ? (
                            <div className="threads-feed-multi-strip">
                              {post.contentPreviews.map((url, idx) => (
                                <div key={`${post.id}-m-${idx}`} className="threads-feed-multi-item">
                                  {String(url).includes('.mp4') || String(url).includes('video') ? (
                                    <video className="threads-feed-multi-media" src={url} muted loop playsInline />
                                  ) : (
                                    <img className="threads-feed-multi-media" src={url} alt="" />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : post.contentPreview && (post.type === 'video' || post.type === 'carousel') ? (
                            post.contentPreview.includes('.mp4') || String(post.contentPreview).includes('video') ? (
                              <video className="threads-inline-media" src={post.contentPreview} muted loop playsInline controls />
                            ) : (
                              <img className="threads-inline-media" src={post.contentPreview} alt="" />
                            )
                          ) : null}

                          <div className="threads-thread-copy">{post.body}</div>

                          <div className="threads-thread-toolbar">
                            <span>
                              <Heart size={18} /> {post.likes}
                            </span>
                            <span>
                              <MessageCircle size={18} /> {post.replies}
                            </span>
                            <span>
                              <Repeat2 size={18} /> {post.reposts}
                            </span>
                          </div>
                        </div>

                        <div className="more-options threads-more-options">
                          <button
                            type="button"
                            className="more-btn threads-more-btn"
                            title="Plus d’options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowThreadMoreOptions(showThreadMoreOptions === post.id ? null : post.id);
                            }}
                          >
                            <MoreHorizontal size={18} className="threads-more-icon" />
                          </button>
                          {showThreadMoreOptions === post.id && (
                            <div className="published-edit-dropdown threads-post-dropdown">
                              <button type="button" onClick={() => handleEditThread(post)}>
                                Modifier
                              </button>
                              {activeTab === 'draft' && (
                                <button type="button" onClick={() => handlePublishDraftThread(post)}>
                                  Publier
                                </button>
                              )}
                              <button type="button" onClick={() => handleRequestDeleteThread(post.id)}>
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {pendingDeleteThreadId ? (
        <div className="threads-delete-modal-overlay" role="presentation" onClick={() => setPendingDeleteThreadId(null)}>
          <div
            className="threads-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="threads-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="threads-delete-modal-icon">
              <AlertTriangle size={18} />
            </div>
            <h4 id="threads-delete-title">Supprimer ce post Threads ?</h4>
            <p>Cette action est definitive. Voulez-vous vraiment supprimer ce contenu, ou annuler pour le conserver ?</p>
            <div className="threads-delete-modal-actions">
              <button type="button" className="threads-delete-cancel" onClick={() => setPendingDeleteThreadId(null)}>
                Annuler
              </button>
              <button type="button" className="threads-delete-confirm" onClick={handleConfirmDeleteThread}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
