import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Hash, Link2, Sparkles, X } from 'lucide-react'
import DateTimePicker from '../../facebook/components/DateTimePicker'

import { TYPE_CONFIG, DEFAULT_STYLE } from './postForm/constants'
import { StyleSlider, LinkedinStylePanel } from './postForm/StyleComponents'

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
  const [styleSettings, setStyleSettings] = useState({
    ...DEFAULT_STYLE,
    ...(initialData?.style ?? {}),
  })
  const fileRef = useRef(null)
  const Icon = cfg.icon

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

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 900))
    setCaption(`✨ ${aiPrompt}\n\nPerspective, valeur concrète et appel à l'action pour votre réseau LinkedIn.`)
    setHashtags(prev => prev || '#LinkedIn #professionnel #networking #carriere')
    setIsGenerating(false)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* AI bar */}
      <div style={{
        background: '#eff6ff',
        border: '1.5px solid #dbeafe',
        borderRadius: '18px 18px 0 0',
        padding: '14px 20px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      }}>
        <Sparkles size={18} color="#0a66c2" />
        <input
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="Décrivez votre post, l'IA génère tout..."
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: 14,
            color: '#374151',
            outline: 'none',
          }}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: isGenerating ? '#93c5fd' : '#0a66c2',
            color: '#fff',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 14,
            fontWeight: 700,
            transition: 'background 0.15s',
          }}
        >
          <Sparkles size={15} />
          {isGenerating ? 'Génération...' : 'Générer'}
        </button>
      </div>

      {/* ✅ No blue top bar, white background */}
      <div style={{
        background: '#fff',
        borderRadius: '0 0 18px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'visible',
      }}>

        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#eff6ff', color: '#0a66c2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
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
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: '#dbeafe', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#0a66c2', fontWeight: 800,
            }}>U</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Votre profil</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                <span>Publication {cfg.label.toLowerCase()}</span>
                <span>-</span>
                <span>{formatDateTime(scheduledDate)}</span>
              </div>
            </div>
          </div>

          {/* 2-col grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)',
            gap: 20,
            alignItems: 'start',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* ✅ CONTENU with Sparkles */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>CONTENU</span>
                  <button
                    onClick={() => caption && setCaption(caption)}
                    style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    title="Générer avec l'IA"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder={cfg.placeholder}
                  rows={6}
                  style={{
                    width: '100%', border: '1.5px solid #dbe2ea', borderRadius: 14,
                    padding: '14px 16px', fontSize: 14, color: '#334155',
                    resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0a66c2' }}
                  onBlur={e => { e.target.style.borderColor = '#dbe2ea' }}
                />
              </div>

              {/* ✅ HASHTAGS with Sparkles */}
              {cfg.hasHashtags && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>HASHTAGS</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setHashtags(prev => prev || '#LinkedIn #professionnel #networking #carriere')}
                        style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Suggérer des hashtags"
                      >
                        <Sparkles size={16} />
                      </button>
                      <button
                        style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <Hash size={16} />
                      </button>
                    </div>
                  </div>
                  <input
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    placeholder="#LinkedIn #professionnel #networking"
                    style={{
                      width: '100%', border: '1.5px solid #dbe2ea', borderRadius: 14,
                      padding: '12px 14px', fontSize: 14, color: '#334155', outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0a66c2' }}
                    onBlur={e => { e.target.style.borderColor = '#dbe2ea' }}
                  />
                </div>
              )}

              {/* Link */}
              {cfg.hasLink && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {postType === 'article' ? "LIEN DE L'ARTICLE" : 'URL (OPTIONNEL)'}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={16} color="#94a3b8" style={{ position: 'absolute', top: 14, left: 14 }} />
                    <input
                      value={articleLink}
                      onChange={e => setArticleLink(e.target.value)}
                      placeholder="https://..."
                      style={{
                        width: '100%', border: '1.5px solid #dbe2ea', borderRadius: 14,
                        padding: '12px 14px 12px 40px', fontSize: 14, color: '#334155', outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#0a66c2' }}
                      onBlur={e => { e.target.style.borderColor = '#dbe2ea' }}
                    />
                  </div>
                </div>
              )}

              {/* ✅ MEDIA with Sparkles */}
              {cfg.hasMedia && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>MEDIA</span>
                    <button
                      style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      title="Générer un visuel avec l'IA"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                  <div
                    onClick={() => !media && fileRef.current?.click()}
                    style={{
                      aspectRatio: cfg.isVideo ? '16/9' : '4/3',
                      width: '100%', maxWidth: 460,
                      background: '#f8fafc', border: '1.5px dashed #cbd5e1',
                      borderRadius: 18, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexDirection: 'column', gap: 10,
                      overflow: 'hidden', position: 'relative', cursor: 'pointer',
                    }}
                  >
                    {media ? (
                      <>
                        {media.type === 'video'
                          ? <video key={media.url} src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls playsInline preload="metadata" />
                          : <img src={media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <button
                          onClick={(e) => { e.stopPropagation(); setMedia(null) }}
                          style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(15,23,42,0.65)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Icon size={34} color="#94a3b8" />
                        <span style={{ color: '#64748b', fontSize: 14 }}>{cfg.mediaLabel}</span>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept={cfg.isVideo ? 'video/*' : 'image/*'}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <LinkedinStylePanel
              cfg={cfg}
              styleSettings={styleSettings}
              updateStyle={updateStyle}
              caption={caption}
              articleLink={articleLink}
              hashtags={hashtags}
              media={media}
            />
          </div>

          {/* Publish */}
          <button
            onClick={() => onPublish(buildPost())}
            style={{
              width: '100%', background: '#0a66c2', color: '#fff',
              borderRadius: 16, padding: '16px 20px', fontWeight: 700,
              fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#084fa0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0a66c2' }}
          >
            {initialData?.createdAt ? 'Mettre à jour et publier' : 'Publier sur LinkedIn'}
          </button>

          {/* Schedule / Draft */}
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 22, padding: '18px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
              <CalendarDays size={18} />
              Planifier pour plus tard
            </div>

            <div style={{
              width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb',
              borderRadius: 16, display: 'flex', flexDirection: 'column',
              gap: 12, padding: '14px 16px', position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateTime(scheduledDate)}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Choisissez une date et une heure pour programmer votre post LinkedIn.
                  </span>
                </div>
                <button
                  onClick={() => setShowDatePicker(v => !v)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12,
                    background: showDatePicker ? '#dbeafe' : '#fff',
                    border: `1px solid ${showDatePicker ? '#93c5fd' : '#d1d5db'}`,
                    color: showDatePicker ? '#0a66c2' : '#475569',
                    padding: '10px 14px', minWidth: 120, minHeight: 44,
                    fontWeight: 700, gap: 8, cursor: 'pointer',
                  }}
                >
                  <span>{showDatePicker ? 'Masquer' : 'Modifier'}</span>
                  <CalendarDays size={18} />
                </button>
              </div>

              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  zIndex: 40, width: 'min(100%, 360px)',
                }}>
                  <DateTimePicker
                    value={scheduledDate}
                    onChange={(d) => { setScheduledDate(d); setShowDatePicker(false) }}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => onSchedule(buildPost())}
                style={{
                  flex: 1, minWidth: 220, borderRadius: 14,
                  background: '#dbeafe', color: '#0a66c2',
                  border: '1px solid #bfdbfe', padding: '14px 20px',
                  fontWeight: 700, fontSize: 14,
                }}
              >
                {initialData?.createdAt ? 'Mettre à jour et planifier' : 'Planifier'}
              </button>
              <button
                onClick={() => onDraft(buildPost())}
                style={{
                  flex: 1, minWidth: 160, borderRadius: 14,
                  background: '#f8fafc', color: '#475569',
                  border: '1px solid #e2e8f0', padding: '14px 20px',
                  fontWeight: 700, fontSize: 14,
                }}
              >
                {initialData?.createdAt ? 'Mettre à jour le brouillon' : 'Enregistrer en brouillon'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}