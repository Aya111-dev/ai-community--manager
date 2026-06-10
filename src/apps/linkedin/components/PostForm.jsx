import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Hash, Link2, Sparkles, X } from 'lucide-react'
import { generateContent, generateHashtags, generateMedia } from '../../../services/api.js'
import { bustMediaUrl } from '../../../services/aiMediaHelpers.js'
import DateTimePicker from '../../facebook/components/DateTimePicker'

import { TYPE_CONFIG, DEFAULT_STYLE } from './postForm/constants'
import { LinkedinStylePanel } from './postForm/StyleComponents'
import { LI_PHONE_INSPECTOR_MAX } from './postsList/constants'
import { useViewportWidth } from './postsList/utils'

function formatDateTime(date) {
  const d = date || new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function LinkedinPostForm({ postType, onPublish, onSchedule, onDraft, onClose, initialData }) {
  const cfg = TYPE_CONFIG[postType]
  const [caption, setCaption] = useState(initialData?.content || initialData?.caption || '')
  const [articleLink, setArticleLink] = useState(initialData?.link || '')
  const [hashtags, setHashtags] = useState(initialData?.hashtags || '')
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [media, setMedia] = useState(initialData?.media?.[0] || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [lastAiTheme, setLastAiTheme] = useState('')
  const [styleSettings, setStyleSettings] = useState({
    ...DEFAULT_STYLE,
    ...(initialData?.style ?? {}),
  })
  const fileRef = useRef(null)
  const Icon = cfg.icon
  const viewportWidth = useViewportWidth()
  const liPhoneInspector = viewportWidth <= LI_PHONE_INSPECTOR_MAX
  const showDesktopDesignAside = !liPhoneInspector

  const editorMediaFrameDimensions = cfg.hasMedia
    ? {
        aspectRatio: cfg.isVideo ? '16 / 9' : '4 / 3',
        ...(liPhoneInspector
          ? {
              maxHeight: 'min(420px, 52vh)',
              minHeight: 200,
              width: '100%',
              maxWidth: '100%',
              alignSelf: 'stretch',
            }
          : { maxWidth: 460, width: '100%' }),
      }
    : {}

  useEffect(() => {
    setCaption(initialData?.content || initialData?.caption || '')
    setArticleLink(initialData?.link || '')
    setHashtags(initialData?.hashtags || '')
    setScheduledDate(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date())
    setShowDatePicker(false)
    setMedia(initialData?.media?.[0] || null)
    setAiPrompt('')
    setStyleSettings({
      ...DEFAULT_STYLE,
      ...(initialData?.style ?? {}),
    })
  }, [initialData, postType])

  const buildPost = () => ({
    type: postType,
    caption,
    link: articleLink,
    hashtags,
    media: media ? [media] : [],
    scheduledDate,
    strategyPlanId: initialData?.strategyPlanId || initialData?.id || null,
    style: styleSettings,
  })

  const getRegenerateTheme = () => aiPrompt.trim() || lastAiTheme

  const handleGenerateCaption = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA.')
      return
    }
    setIsGenerating(true)
    try {
      const result = await generateContent({
        description: theme,
        platform: 'linkedin',
        postType,
        regenerate: true,
        previousContent: caption,
      })
      setCaption(result.contenu)
    } catch (error) {
      alert(error.message || 'Erreur de génération caption')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateHashtags = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA.')
      return
    }
    setIsGenerating(true)
    try {
      const result = await generateHashtags({
        description: theme,
        platform: 'linkedin',
        postType,
        regenerate: true,
        previousContent: hashtags,
      })
      setHashtags(result.hashtags)
    } catch (error) {
      alert(error.message || 'Erreur de génération hashtags')
    } finally {
      setIsGenerating(false)
    }
  }

  const applyGeneratedMedia = (items = []) => {
    const item = items[0]
    if (!item?.url) return
    const type = item.type === 'video' || cfg.isVideo ? 'video' : 'image'
    setMedia({ url: bustMediaUrl(item.url), type, file: null })
  }

  const handleGenerateMedia = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA.')
      return
    }
    setIsGenerating(true)
    try {
      const result = await generateMedia({
        description: theme,
        platform: 'linkedin',
        postType,
        count: 1,
        regenerate: true,
      })
      applyGeneratedMedia(result.media)
    } catch (error) {
      alert(error.message || 'Erreur de génération média')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    const theme = aiPrompt.trim()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA.')
      return
    }
    setIsGenerating(true)
    try {
      setLastAiTheme(theme)
      const isNewSubject = caption.trim() || hashtags.trim() || media
      const results = await Promise.allSettled([
        generateContent({ description: theme, platform: 'linkedin', postType, regenerate: isNewSubject }),
        generateHashtags({ description: theme, platform: 'linkedin', postType, regenerate: isNewSubject }),
        cfg.hasMedia
          ? generateMedia({ description: theme, platform: 'linkedin', postType, count: 1, regenerate: isNewSubject })
          : Promise.resolve(null),
      ])
      if (results[0].status === 'fulfilled') setCaption(results[0].value.contenu)
      if (results[1].status === 'fulfilled') setHashtags(results[1].value.hashtags)
      if (results[2].status === 'fulfilled' && results[2].value?.media) {
        applyGeneratedMedia(results[2].value.media)
      } else if (results[2].status === 'rejected') {
        alert(results[2].reason?.message || 'La génération des médias a échoué')
      }
      if (results[0].status === 'rejected') throw results[0].reason
      if (results[1].status === 'rejected') alert(results[1].reason?.message || 'La génération des hashtags a échoué')
    } catch (error) {
      alert(error.message || 'Erreur de génération IA')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    setMedia({ file, url: URL.createObjectURL(file), type })
  }

  const updateStyle = (key, value) => {
    setStyleSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <style>{`
        @keyframes li-gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes li-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes li-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes li-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .li-bar-wrap {
          position: relative;
          border-radius: 999px;
          padding: 2px;
          background: linear-gradient(135deg, #60a5fa, #0a66c2, #2563eb, #38bdf8, #60a5fa);
          background-size: 300% 300%;
          animation: li-gradient-shift 4s ease infinite;
          box-shadow: 0 4px 24px rgba(10,102,194,0.22), 0 1px 4px rgba(10,102,194,0.10);
        }
        .li-bar-inner {
          background: #f0f7ff;
          border-radius: 999px;
          padding: 10px 10px 10px 22px;
          display: flex;
          gap: 12px;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .li-bar-inner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(96,165,250,0.12) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: li-shimmer 3.5s ease infinite;
          pointer-events: none;
        }
        .li-bar-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          outline: none;
          letter-spacing: 0.01em;
        }
        .li-bar-input::placeholder {
          color: #60a5fa;
          font-weight: 400;
        }
        .li-icon-wrap {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .li-icon-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(10,102,194,0.18);
          animation: li-pulse-ring 2s ease-out infinite;
        }
        .li-gen-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #0a66c2, #2563eb);
          color: #fff;
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          border: none;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 2px 12px rgba(10,102,194,0.30);
          flex-shrink: 0;
        }
        .li-gen-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(10,102,194,0.40);
        }
        .li-gen-btn:active:not(:disabled) { transform: translateY(0); }
        .li-gen-btn:disabled {
          background: linear-gradient(135deg, #93c5fd, #60a5fa);
          box-shadow: none;
          cursor: not-allowed;
        }
        .li-gen-btn-full {
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 1;
          justify-content: center;
          padding: 12px 20px;
          border-radius: 14px;
        }
        .li-gen-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: li-shimmer 2s ease infinite;
        }
        .li-spinner { animation: li-spin 0.8s linear infinite; }
      `}</style>

      {/* Single white card containing AI bar + form */}
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'visible' }}>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Barre IA + Générer en pleine largeur sous la pilule (comme Facebook) */}
          <div style={{ display: 'flex', flexDirection: liPhoneInspector ? 'column' : 'row', alignItems: 'stretch', gap: 12, width: '100%', minWidth: 0 }}>
            <div className="li-bar-wrap" style={{ flex: liPhoneInspector ? undefined : 1, minWidth: 0 }}>
              <div className="li-bar-inner">
                <div className="li-icon-wrap">
                  <div className="li-icon-ring" />
                  <Sparkles size={18} color="#0a66c2" />
                </div>
                <input
                  className="li-bar-input"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Décrivez votre post, l'IA génère tout…"
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                />
              </div>
            </div>
            <button
              type="button"
              className={liPhoneInspector ? 'li-gen-btn li-gen-btn-full' : 'li-gen-btn'}
              onClick={handleGenerate}
              disabled={isGenerating}
              style={liPhoneInspector ? undefined : { minWidth: 152, justifyContent: 'center', alignSelf: 'stretch' }}
            >
              {isGenerating
                ? <Sparkles size={14} className="li-spinner" />
                : <Sparkles size={14} />}
              {isGenerating ? 'Génération…' : 'Générer'}
            </button>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                  {initialData?.createdAt ? 'Modifier le post LinkedIn' : 'Création LinkedIn'}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{cfg.label}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ color: '#94a3b8', borderRadius: 8, padding: 4, display: 'flex' }}>
              <X size={18} />
            </button>
          </div>

          {/* Profile row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a66c2', fontWeight: 800 }}>U</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Votre profil</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                <span>Publication {cfg.label.toLowerCase()}</span>
                <span>-</span>
                <span>{formatDateTime(scheduledDate)}</span>
              </div>
            </div>
          </div>

          {/* Desktop: contenu a gauche, design flexible a droite */}
          <div
            style={{
              width: '100%',
              minWidth: 0,
              display: 'grid',
              gridTemplateColumns: showDesktopDesignAside ? 'minmax(0,1fr) minmax(320px, 360px)' : '1fr',
              gap: showDesktopDesignAside ? 24 : 0,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>

              {/* CONTENU */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>CONTENU</span>
                  <button type="button" onClick={handleGenerateCaption} disabled={isGenerating}
                    style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    title="Régénérer la caption avec l'IA">
                    <Sparkles size={16} />
                  </button>
                </div>
                <textarea value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder={cfg.placeholder} rows={6}
                  style={{ width: '100%', border: '1.5px solid #dbe2ea', borderRadius: 14, padding: '14px 16px', fontSize: 14, color: '#334155', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
                  onFocus={e => { e.target.style.borderColor = '#0a66c2' }}
                  onBlur={e => { e.target.style.borderColor = '#dbe2ea' }} />
              </div>

              {/* HASHTAGS */}
              {cfg.hasHashtags && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>HASHTAGS</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={handleGenerateHashtags} disabled={isGenerating}
                        style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Régénérer les hashtags avec l'IA">
                        <Sparkles size={16} />
                      </button>
                      <button style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <Hash size={16} />
                      </button>
                    </div>
                  </div>
                  <input value={hashtags} onChange={e => setHashtags(e.target.value)}
                    placeholder="#LinkedIn #professionnel #networking"
                    style={{ width: '100%', border: '1.5px solid #dbe2ea', borderRadius: 14, padding: '12px 14px', fontSize: 14, color: '#334155', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#0a66c2' }}
                    onBlur={e => { e.target.style.borderColor = '#dbe2ea' }} />
                </div>
              )}

              {/* MEDIA */}
              {cfg.hasMedia && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>MEDIA</span>
                    <button type="button" onClick={handleGenerateMedia} disabled={isGenerating}
                      style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      title="Générer un visuel avec l'IA">
                      <Sparkles size={16} />
                    </button>
                  </div>
                  <div
                    onClick={() => !media && fileRef.current?.click()}
                    style={{
                      background: '#f8fafc',
                      border: '1.5px dashed #cbd5e1',
                      borderRadius: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 10,
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      ...editorMediaFrameDimensions,
                    }}
                    onMouseEnter={(e) => {
                      if (!media) {
                        e.currentTarget.style.borderColor = '#93c5fd'
                        e.currentTarget.style.background = '#eff6ff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!media) {
                        e.currentTarget.style.borderColor = '#cbd5e1'
                        e.currentTarget.style.background = '#f8fafc'
                      }
                    }}
                  >
                    {media ? (
                      <>
                        {media.type === 'video'
                          ? <video key={media.url} src={media.url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} controls playsInline preload="metadata" />
                          : <img src={media.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setMedia(null) }}
                          style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.65)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Icon size={34} color="#94a3b8" />
                        <span style={{ color: '#64748b', fontSize: 14 }}>{cfg.mediaLabel}</span>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept={cfg.isVideo ? 'video/*' : 'image/*'} style={{ display: 'none' }} onChange={handleFileChange} />
                  </div>
                </div>
              )}

              {!showDesktopDesignAside && (
                <LinkedinStylePanel
                  stacked
                  cfg={cfg}
                  styleSettings={styleSettings}
                  updateStyle={updateStyle}
                  caption={caption}
                  articleLink={articleLink}
                  hashtags={hashtags}
                  media={media}
                />
              )}

              {/* LINK — sous design flexible, comme Facebook */}
              {cfg.hasLink && (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
                      {postType === 'article' ? "LIEN DE L'ARTICLE" : 'URL (OPTIONNEL)'}
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={16} color="#94a3b8" style={{ position: 'absolute', top: 14, left: 14 }} />
                    <input
                      value={articleLink}
                      onChange={e => setArticleLink(e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', border: '1.5px solid #dbe2ea', borderRadius: 14, padding: '12px 14px 12px 40px', fontSize: 14, color: '#334155', outline: 'none' }}
                      onFocus={e => { e.target.style.borderColor = '#0a66c2' }}
                      onBlur={e => { e.target.style.borderColor = '#dbe2ea' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {showDesktopDesignAside ? (
              <LinkedinStylePanel
                stacked={false}
                cfg={cfg}
                styleSettings={styleSettings}
                updateStyle={updateStyle}
                caption={caption}
                articleLink={articleLink}
                hashtags={hashtags}
                media={media}
              />
            ) : null}
          </div>

          {/* Publish */}
          <button onClick={() => onPublish(buildPost())}
            style={{ width: '100%', background: '#0a66c2', color: '#fff', borderRadius: 16, padding: '16px 20px', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#084fa0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0a66c2' }}>
            {initialData?.createdAt ? 'Mettre à jour et publier' : 'Publier sur LinkedIn'}
          </button>

          {/* Schedule / Draft */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
              <CalendarDays size={18} />
              Planifier pour plus tard
            </div>

            <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateTime(scheduledDate)}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Choisissez une date et une heure pour programmer votre post LinkedIn.</span>
                </div>
                <button onClick={() => setShowDatePicker(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: showDatePicker ? '#dbeafe' : '#fff', border: `1px solid ${showDatePicker ? '#93c5fd' : '#d1d5db'}`, color: showDatePicker ? '#0a66c2' : '#475569', padding: '10px 14px', minWidth: 120, minHeight: 44, fontWeight: 700, gap: 8, cursor: 'pointer' }}>
                  <span>{showDatePicker ? 'Masquer' : 'Modifier'}</span>
                  <CalendarDays size={18} />
                </button>
              </div>
              {showDatePicker && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 40, width: 'min(100%, 360px)' }}>
                  <DateTimePicker value={scheduledDate} onChange={(d) => { setScheduledDate(d); setShowDatePicker(false) }} onClose={() => setShowDatePicker(false)} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => onSchedule(buildPost())}
                style={{ flex: 1, minWidth: 220, borderRadius: 14, background: '#dbeafe', color: '#0a66c2', border: '1px solid #bfdbfe', padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>
                {initialData?.createdAt ? 'Mettre à jour et planifier' : 'Planifier'}
              </button>
              <button onClick={() => onDraft(buildPost())}
                style={{ flex: 1, minWidth: 160, borderRadius: 14, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>
                {initialData?.createdAt ? 'Mettre à jour le brouillon' : 'Enregistrer en brouillon'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}