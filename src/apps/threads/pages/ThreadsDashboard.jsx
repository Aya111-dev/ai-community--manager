import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Hash,
  Heart,
  Image,
  MessageCircle,
  Monitor,
  MoreVertical,
  Plus,
  Repeat2,
  Send,
  Smartphone,
  Sparkles,
  Video,
  X
} from 'lucide-react';

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

const modalBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '10px',
  textAlign: 'left',
  width: '100%',
  padding: '8px 12px',
  minHeight: '48px'
};

const THREADS_LOGO_URL = 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/threads.svg';

function ThreadsChoiceLogo() {
  return <img src={THREADS_LOGO_URL} alt="" className="threads-modal-choice-logo" width={24} height={24} />;
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

  const handleAiSubmitThreads = (e) => {
    e?.preventDefault?.();
    const prompt = composerPrompt.trim();
    if (!prompt || prompt.length < 3) return;
    const mediaKind = threadKind === 'video' ? 'video' : threadKind === 'carousel' ? 'image' : 'story';
    const { caption, hashtags } = generateMetadataFromPromptThreads(prompt, mediaKind);
    const generatedPreview =
      threadKind === 'video'
        ? 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4'
        : threadKind === 'carousel'
          ? 'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=900&q=80'
          : '';
    setThreadPreview(prompt);
    setThreadCaption(caption);
    setThreadHashtags(hashtags);
    setComposerText(caption);
    setThreadMediaUrl(generatedPreview);
    setSelectedScheduleAt(null);
    setScheduleMessage('');
    setScheduleWeekStart(getStartOfWeek(new Date()));
  };

  const handleApplyThreadMetadata = () => {
    if (threadCaption.trim()) {
      setThreadPreview(threadCaption.trim());
      setComposerText(threadCaption.trim());
    }
    setPublishStatus('Caption et hashtags ajoutés à l’aperçu.');
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

  const commitThread = (status) => {
    let body = buildThreadBody();
    if (!body && (manualMediaFiles.length > 0 || threadMediaUrl)) {
      body = [threadCaption, threadHashtags, threadPreview, composerText].map((s) => (s || '').trim()).find(Boolean) || '—';
    }
    if (!body) return;
    if (status === 'scheduled' && !selectedScheduleAt) {
      setScheduleMessage('Choisis d’abord une date et une heure dans le calendrier.');
      return;
    }

    const contentPreviews =
      manualMediaFiles.length > 0
        ? manualMediaPreviewUrls.length === manualMediaFiles.length
          ? manualMediaPreviewUrls
          : manualMediaFiles.map((f) => URL.createObjectURL(f))
        : threadMediaUrl
          ? [threadMediaUrl]
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
      likes: 0,
      replies: 0,
      reposts: 0,
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

  const handleDeleteThread = (id) => {
    if (!window.confirm('Supprimer ce thread ?')) return;
    setThreadItems((prev) => prev.filter((t) => t.id !== id));
    setShowThreadMoreOptions(null);
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
  const showCaptionBarsAfterAi =
    ((threadKind === 'carousel' || threadKind === 'video') && Boolean(threadPreview || threadMediaUrl)) ||
    (threadKind === 'text' && Boolean((threadPreview || '').trim()));
  const showCaptionBarsUnderGrid =
    (threadKind === 'carousel' || threadKind === 'video') && manualMediaFiles.length > 0;
  const showCaptionBarsTextManual =
    threadKind === 'text' && Boolean(composerText.trim()) && !(threadPreview || '').trim();

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
                  <span className="create-modal-title">Que souhaitez-vous publier ?</span>
                </div>
                <button type="button" className="create-modal-close" onClick={closeCreateFlow} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>

              <div className="create-modal-buttons">
                <button type="button" className="create-modal-button" style={modalBtnStyle} onClick={() => openComposeFromPicker('video')}>
                  <div className="modal-button-icon" style={{ flexShrink: 0 }}>
                    <Video size={24} />
                  </div>
                  <span className="modal-button-text">Vidéo</span>
                </button>
                <button type="button" className="create-modal-button" style={modalBtnStyle} onClick={() => openComposeFromPicker('carousel')}>
                  <div className="modal-button-icon" style={{ flexShrink: 0 }}>
                    <Image size={24} />
                  </div>
                  <span className="modal-button-text">Photo</span>
                </button>
                <button type="button" className="create-modal-button" style={modalBtnStyle} onClick={() => openComposeFromPicker('text')}>
                  <div className="modal-button-icon threads-thread-choice-icon" style={{ flexShrink: 0 }}>
                    <ThreadsChoiceLogo />
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

                    <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        </div>
                      </div>
                      <button type="button" className="tiktok-publish-primary tiktok-add-metadata-btn" onClick={handleApplyThreadMetadata}>
                        Ajouter
                      </button>
                    </div>


                  <div className="ai-story-preview" style={{ marginTop: 0 }}>
                    <div className="ai-tiktok-preview">
                      <div className="tiktok-phone-frame">
                        <div className="tiktok-story-container">
                          <div className="story-media-container">
                            {manualMediaFiles.length > 0 && (threadKind === 'video' || threadKind === 'carousel') ? (
                              <div className="threads-phone-multi-strip">
                                {manualMediaPreviewUrls.map((url, index) => (
                                  <div key={`${url}-${index}`} className="threads-phone-multi-strip-item">
                                    {manualMediaFiles[index]?.type?.startsWith('video/') ? (
                                      <video
                                        className="threads-phone-multi-strip-media"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        src={url}
                                      />
                                    ) : (
                                      <img className="threads-phone-multi-strip-media" src={url} alt="" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : threadKind === 'video' ? (
                              <video className="story-preview-video" autoPlay muted loop playsInline key={threadMediaUrl}>
                                <source src={threadMediaUrl || 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4'} />
                              </video>
                            ) : threadKind === 'carousel' ? (
                              <img
                                className="story-preview-image"
                                src={threadMediaUrl || 'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=900&q=80'}
                                alt="Aperçu"
                              />
                            ) : (
                              <div className="ai-generated-story">
                                <div className="ai-story-content">
                                  <div className="ai-story-text">
                                    {(threadPreview || composerText).trim() || 'Ton texte apparaîtra ici'}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="story-overlay">
                              <div className="story-header">
                                <div className="story-user-info">
                                  <div className="story-avatar">
                                    <span>U</span>
                                  </div>
                                  <div className="story-user-details">
                                    <div className="story-username">@vous</div>
                                    <div className="story-time">il y a 1s</div>
                                  </div>
                                </div>
                              </div>
                              <div className="story-footer">
                                <div className="story-progress">
                                  <div className="story-progress-bar" />
                                </div>
                              </div>
                              <div className="story-caption">
                                {threadKind === 'text' ? (
                                  <>
                                    <p>{threadCaption || threadPreview || composerText}</p>
                                    {threadHashtags ? <div className="story-hashtags">{threadHashtags}</div> : null}
                                  </>
                                ) : (
                                  <>
                                    <p>{threadCaption || threadPreview}</p>
                                    {threadHashtags ? <div className="story-hashtags">{threadHashtags}</div> : null}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
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

              {showCaptionBarsUnderGrid && (
                <div style={{ marginTop: 14, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    </div>
                  </div>
                  <button type="button" className="tiktok-publish-primary tiktok-add-metadata-btn" onClick={handleApplyThreadMetadata}>
                    Ajouter
                  </button>
                </div>
              )}

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
        <div className="dashboard-posts-header">
          <div>
            <h3>
              {activeTab === 'draft' ? 'Contenu en brouillons' : activeTab === 'scheduled' ? 'Contenu planifié' : 'Contenu publié'}
            </h3>
          </div>

          <div className="dashboard-posts-controls">
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
              <button type="button" className={viewMode === 'desktop' ? 'view-button active' : 'view-button'} onClick={() => setViewMode('desktop')}>
                <Monitor size={16} />
                Desktop
              </button>
              <button type="button" className={viewMode === 'mobile' ? 'view-button active' : 'view-button'} onClick={() => setViewMode('mobile')}>
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
                <div key={post.id} className={`tiktok-post-preview ${viewMode} threads-post-preview`}>
                  <div className="tiktok-video-container threads-thread-surface">
                    {activeTab === 'scheduled' && (
                      <div className="scheduled-badge threads-scheduled-badge">
                        <Calendar size={14} />
                        <span>Planifié</span>
                      </div>
                    )}

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
                        <MoreVertical size={20} className="threads-more-icon" />
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
                          <button type="button" onClick={() => handleDeleteThread(post.id)}>
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
