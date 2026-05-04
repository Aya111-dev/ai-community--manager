import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Sparkles, Wand2, Hash, Plus, CalendarDays, Image as ImageIcon, Video, Type, Palette, StretchHorizontal } from 'lucide-react'
import DateTimePicker from './DateTimePicker'

import { TYPE_CONFIG, FONT_OPTIONS, DEFAULT_STYLE } from './postForm/constants'
import { buildInitialMedia, formatDateTime, isVertical } from './postForm/utils'
import { StyleSlider } from './postForm/StyleSlider'

export default function PostForm({ postType, onPublish, onSchedule, onDraft, onClose, initialData = null }) {
  const cfg = TYPE_CONFIG[postType]
  const initialMediaState = useMemo(() => buildInitialMedia(cfg, initialData?.media), [cfg, initialData])

  const [caption, setCaption] = useState(initialData?.caption ?? '')
  const [hashtags, setHashtags] = useState(initialData?.hashtags ?? '')
  const [link, setLink] = useState(initialData?.link ?? '')
  const [aiPrompt, setAiPrompt] = useState('')
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mediaFiles, setMediaFiles] = useState(initialMediaState.mediaFiles)
  const [extraMedia, setExtraMedia] = useState(initialMediaState.extraMedia)
  const [isGenerating, setIsGenerating] = useState(false)
  const [styleSettings, setStyleSettings] = useState({
    ...DEFAULT_STYLE,
    ...(initialData?.style ?? {}),
  })
  const fileRefs = useRef([])

  useEffect(() => {
    const nextMediaState = buildInitialMedia(cfg, initialData?.media)
    setCaption(initialData?.caption ?? '')
    setHashtags(initialData?.hashtags ?? '')
    setLink(initialData?.link ?? '')
    setAiPrompt('')
    setScheduledDate(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date())
    setShowDatePicker(false)
    setMediaFiles(nextMediaState.mediaFiles)
    setExtraMedia(nextMediaState.extraMedia)
    setStyleSettings({
      ...DEFAULT_STYLE,
      ...(initialData?.style ?? {}),
    })
  }, [cfg, initialData, postType])

  const allMedia = [...mediaFiles, ...extraMedia]

  const handleFileChange = (idx, e) => {
    const file = e.target.files[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target.result
      const item = { url, type }
      if (idx < mediaFiles.length) {
        setMediaFiles(prev => { const next = [...prev]; next[idx] = item; return next })
        return
      }
      const extraIdx = idx - mediaFiles.length
      setExtraMedia(prev => { const next = [...prev]; next[extraIdx] = item; return next })
    }
    reader.readAsDataURL(file)
  }

  const addExtraSlot = () => setExtraMedia(prev => [...prev, null])

  const removeMedia = (idx) => {
    if (idx < mediaFiles.length) {
      setMediaFiles(prev => { const next = [...prev]; next[idx] = null; return next })
      return
    }
    const extraIdx = idx - mediaFiles.length
    setExtraMedia(prev => prev.filter((_, index) => index !== extraIdx))
  }

  const updateStyle = (key, value) => setStyleSettings(prev => ({ ...prev, [key]: value }))

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setCaption(`✨ ${aiPrompt}\n\nDécouvrez notre dernière publication. Partagez votre avis en commentaires !`)
    setHashtags('#facebook #marketing #socialmedia #contenu')
    setIsGenerating(false)
  }

  const buildPost = () => ({
    type: postType,
    caption,
    hashtags,
    link,
    media: allMedia.filter(Boolean),
    scheduledDate,
    style: styleSettings,
    comments: initialData?.comments ?? [],
    engagement: initialData?.engagement ?? {
      likes: Math.floor(Math.random() * 800) + 120,
      comments: initialData?.comments?.length ?? 2,
      shares: Math.floor(Math.random() * 18) + 1,
    },
  })

  const previewTextStyle = { fontFamily: styleSettings.fontFamily }
  const vertical = isVertical(postType)

  const mediaSlotStyle = (aspect) => ({
    aspectRatio: aspect,
    background: '#f3f4f6',
    border: '1.5px dashed #d1d5db',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: 12,
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.15s, background 0.15s',
  })

  // Helper: detect if a media item is a video (by type field or cfg flag)
  const isVideoMedia = (mediaItem) => {
    if (!mediaItem) return false
    return mediaItem.type === 'video' || cfg.isVideo
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* AI bar */}
      <div style={{ background: '#faf5ff', border: '1.5px solid #ede9fe', borderRadius: '16px 16px 0 0', padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Sparkles size={18} color="#8b5cf6" />
        <input
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="Décrivez votre post, l'IA génère tout..."
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#374151', outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <button onClick={handleGenerate} disabled={isGenerating}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: isGenerating ? '#c4b5fd' : '#8b5cf6', color: '#fff', borderRadius: 999, padding: '8px 18px', fontSize: 14, fontWeight: 600, transition: 'background 0.15s' }}>
          <Sparkles size={15} />
          {isGenerating ? 'Génération...' : 'Générer'}
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'visible' }}>
        <div style={{ background: '#1877F2', height: 6 }} />

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="#8b5cf6" />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                {initialData ? 'Modifier le post' : 'Créer un post'} - <span style={{ color: '#7c3aed' }}>{cfg.label}</span>
              </span>
            </div>
            <button onClick={onClose} style={{ color: '#9ca3af', borderRadius: 6, padding: 4, display: 'flex' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <X size={18} />
            </button>
          </div>

          {/* Profile row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>U</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Utilisateur</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 12, padding: '2px 0' }}>
                <span style={{ fontSize: 12 }}>🕐</span>
                {formatDateTime(scheduledDate)}
                <CalendarDays size={13} color="#9ca3af" />
              </div>
            </div>
          </div>

          {/* Main 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)', gap: 20, alignItems: 'start' }}>

            {/* Left: fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {cfg.hasCaption && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>CAPTION</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Générer avec l'IA"><Sparkles size={16} /></button>
                      <button style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Réécrire"><Wand2 size={16} /></button>
                    </div>
                  </div>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="Cliquez pour rédiger ou générez avec l'IA" rows={5}
                    style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#374151', resize: 'vertical', outline: 'none', lineHeight: 1.6, transition: 'border-color 0.15s' }}
                    onFocus={e => { e.target.style.borderColor = '#8b5cf6' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb' }} />
                </div>
              )}

              {/* ✅ HASHTAGS moved ABOVE media */}
              {cfg.hasHashtags && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>HASHTAGS</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}><Sparkles size={16} /></button>
                      <button style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}><Hash size={16} /></button>
                    </div>
                  </div>
                  <input value={hashtags} onChange={e => setHashtags(e.target.value)}
                    placeholder="Cliquez pour ajouter ou générez avec l'IA"
                    style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#374151', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#8b5cf6' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb' }} />
                </div>
              )}

              {cfg.hasMedia && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>MEDIA</span>
                    <button style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                      title="Générer avec l'IA"
                      onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                      <Sparkles size={16} />
                    </button>
                  </div>

                  {postType === 'carousel' ? (
                    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {allMedia.map((m, idx) => (
                        <div key={idx}
                          style={{ ...mediaSlotStyle('1/1'), width: 'calc(25% - 8px)', flexShrink: 0 }}
                          onClick={() => !m && fileRefs.current[idx]?.click()}>
                          {m ? (
                            <>
                              {/* ✅ Fixed: check m.type for video in carousel too */}
                              {m.type === 'video'
                                ? <video
                                    key={m.url}
                                    src={m.url}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, background: '#0f172a' }}
                                    muted playsInline autoPlay loop preload="metadata"
                                  />
                                : <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
                              <button onClick={(e) => { e.stopPropagation(); removeMedia(idx) }}
                                style={{ position: 'absolute', top: 4, right: 4, zIndex: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>×</button>
                            </>
                          ) : (
                            <>
                              <ImageIcon size={22} color="#d1d5db" />
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>Ajouter un média</span>
                            </>
                          )}
                          <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                            ref={el => { fileRefs.current[idx] = el }}
                            onChange={e => handleFileChange(idx, e)} />
                        </div>
                      ))}
                      <div onClick={addExtraSlot}
                        style={{ ...mediaSlotStyle('1/1'), width: 'calc(25% - 8px)', flexShrink: 0, background: '#f5f3ff', border: '1.5px dashed #c4b5fd', color: '#7c3aed', cursor: 'pointer' }}>
                        <Plus size={22} />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>Ajouter</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ ...mediaSlotStyle(cfg.mediaAspect), maxHeight: vertical ? 340 : 260, width: vertical ? 180 : '100%' }}
                      onClick={() => !mediaFiles[0] && fileRefs.current[0]?.click()}
                      onMouseEnter={e => { if (!mediaFiles[0]) { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.background = '#f5f3ff' } }}
                      onMouseLeave={e => { if (!mediaFiles[0]) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f3f4f6' } }}>
                      {mediaFiles[0] ? (
                        <>
                          {/* ✅ Fixed: use isVideoMedia() to properly detect video for stories/reels/videos */}
                          {isVideoMedia(mediaFiles[0])
                            ? <video
                                key={mediaFiles[0].url}
                                src={mediaFiles[0].url}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                controls
                                playsInline
                                preload="metadata"
                              />
                            : <img src={mediaFiles[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
                          <button onClick={(e) => { e.stopPropagation(); removeMedia(0) }}
                            style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>×</button>
                        </>
                      ) : (
                        <>
                          {postType === 'video' || postType === 'reel' || postType === 'story' ? <Video size={32} color="#d1d5db" /> : <ImageIcon size={32} color="#d1d5db" />}
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>{cfg.mediaLabel}</span>
                        </>
                      )}
                      <input type="file" accept={cfg.isVideo ? 'video/*' : 'image/*,video/*'} style={{ display: 'none' }}
                        ref={el => { fileRefs.current[0] = el }}
                        onChange={e => handleFileChange(0, e)} />
                    </div>
                  )}
                </div>
              )}

              {cfg.hasLink && (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>LIEN</span>
                  </div>
                  <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..."
                    style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#374151', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#8b5cf6' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb' }} />
                </div>
              )}

            </div>

            {/* Right: style panel */}
            <aside style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Palette size={18} color="#7c3aed" />
                <div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Design flexible</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Changez le style du post avant de l'enregistrer.</div>
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police</span>
                <div style={{ position: 'relative' }}>
                  <Type size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <select value={styleSettings.fontFamily} onChange={e => updateStyle('fontFamily', e.target.value)}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 14px 10px 36px', background: '#fff', color: '#111827' }}>
                    {FONT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </label>

              <StyleSlider label="Largeur du post" value={styleSettings.cardWidth} min={60} max={100} suffix="%" onChange={e => updateStyle('cardWidth', Number(e.target.value))} />
              <StyleSlider label="Hauteur du média" value={styleSettings.mediaHeight} min={180} max={520} suffix=" px" onChange={e => updateStyle('mediaHeight', Number(e.target.value))} />

              <div style={{ padding: 16, borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Aperçu en direct</div>
                  <StretchHorizontal size={16} color="#94a3b8" />
                </div>

                <div style={{ width: vertical ? 160 : `${styleSettings.cardWidth}%`, height: vertical ? 284 : 'auto', minWidth: vertical ? 'unset' : 220, maxWidth: '100%', margin: '0 auto', background: '#ffffff', borderRadius: 18, border: '1px solid #e5e7eb', overflow: 'hidden', position: 'relative' }}>
                  {!vertical && (
                    <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>U</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Vous</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{cfg.label}</div>
                      </div>
                    </div>
                  )}
                  {!vertical && caption && (
                    <div style={{ padding: '0 16px 4px', ...previewTextStyle, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{caption}</div>
                  )}
                  {!vertical && hashtags && (
                    <div style={{ padding: '0 16px 12px', color: '#2563eb', fontSize: 14, fontWeight: 600 }}>{hashtags}</div>
                  )}
                  {allMedia.filter(Boolean).length > 0 && (
                    postType === 'carousel' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: '#e5e7eb' }}>
                        {allMedia.filter(Boolean).slice(0, 4).map((media, index) => (
                          <div key={index} style={{ height: Math.max(110, styleSettings.mediaHeight / 2), overflow: 'hidden', background: '#cbd5e1', position: 'relative' }}>
                            {/* ✅ Fixed: check media.type in preview too */}
                            {media.type === 'video'
                              ? <video key={media.url} src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop playsInline />
                              : <img src={media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ ...(vertical ? { position: 'absolute', inset: 0 } : { height: styleSettings.mediaHeight }), background: '#cbd5e1' }}>
                        {/* ✅ Fixed: use isVideoMedia() in the live preview too */}
                        {isVideoMedia(allMedia.filter(Boolean)[0])
                          ? <video
                              key={allMedia.filter(Boolean)[0].url}
                              src={allMedia.filter(Boolean)[0].url}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              muted
                              controls={!vertical}
                              autoPlay={vertical}
                              loop={vertical}
                              playsInline
                            />
                          : <img src={allMedia.filter(Boolean)[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                    )
                  )}
                  {vertical && (
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ede9fe', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>U</div>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Vous</span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* Publish + Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
            <button onClick={() => onPublish(buildPost())}
              style={{ width: '100%', background: '#6159ff', color: '#fff', borderRadius: 16, padding: '16px 20px', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#6159ff' }}>
              {initialData ? 'Mettre à jour et publier' : 'Publier maintenant'}
            </button>

            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 22, padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
                <CalendarDays size={18} />
                Planifier pour plus tard
              </div>

              <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateTime(scheduledDate)}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Choisissez une date et une heure pour planifier le post.</span>
                  </div>
                  <button onClick={() => setShowDatePicker(v => !v)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: showDatePicker ? '#ede9fe' : '#fff', border: `1px solid ${showDatePicker ? '#c4b5fd' : '#d1d5db'}`, color: showDatePicker ? '#6d28d9' : '#475569', padding: '10px 14px', minWidth: 120, minHeight: 44, fontWeight: 700, gap: 8, cursor: 'pointer' }}>
                    <span>{showDatePicker ? 'Masquer' : 'Modifier'}</span>
                    <CalendarDays size={18} />
                  </button>
                </div>
                {showDatePicker && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 40, width: 'min(100%, 360px)' }}>
                    <DateTimePicker value={scheduledDate} onChange={(date) => { setScheduledDate(date); setShowDatePicker(false) }} onClose={() => setShowDatePicker(false)} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => onSchedule(buildPost())}
                  style={{ flex: 1, minWidth: 220, borderRadius: 14, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>
                  {initialData ? 'Mettre à jour et planifier' : 'Planifier'}
                </button>
                <button onClick={() => onDraft(buildPost())}
                  style={{ flex: 1, minWidth: 160, borderRadius: 14, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>
                  {initialData ? 'Mettre à jour le brouillon' : 'Garder en réserve'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}