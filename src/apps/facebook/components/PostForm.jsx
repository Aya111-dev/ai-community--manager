import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Sparkles, Wand2, Hash, Plus, CalendarDays, Image as ImageIcon, Video, Type, Palette, StretchHorizontal, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { generateContent, generateHashtags, generateMedia, regeneratePostContent } from '../../../services/api.js'
import DateTimePicker from './DateTimePicker'

import { TYPE_CONFIG, FONT_OPTIONS, DEFAULT_STYLE } from './postForm/constants'
import { FB_PHONE_INSPECTOR_MAX } from './postsList/constants'
import { useViewportWidth } from './postsList/useViewportWidth'
import { buildInitialMedia, formatDateTime, isVertical } from './postForm/utils'
import { StyleSlider } from './postForm/StyleSlider'
import { TextCanvasEditor } from './postForm/TextCanvasEditor'
import { useImageEdits, ImageEditButtons, EditedImage } from '../../../components/ImageEditor'
import PreviewVideo from '../../../components/PreviewVideo'

export default function PostForm({ postType, platform = 'facebook', onPublish, onSchedule, onDraft, onClose, initialData = null }) {
  const cfg = TYPE_CONFIG[postType]
  const initialMediaState = useMemo(() => buildInitialMedia(cfg, initialData?.media), [cfg, initialData])

  const [caption, setCaption] = useState(initialData?.caption ?? '')
  const [hashtags, setHashtags] = useState(initialData?.hashtags ?? '')
  const [link, setLink] = useState(initialData?.link ?? '')
  const [aiPrompt, setAiPrompt] = useState('')
  const [lastAiTheme, setLastAiTheme] = useState('')
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mediaFiles, setMediaFiles] = useState(initialMediaState.mediaFiles)
  const [extraMedia, setExtraMedia] = useState(initialMediaState.extraMedia)
  const [isGenerating, setIsGenerating] = useState(false)
  const [mediaRenderKey, setMediaRenderKey] = useState(0)
  const [styleSettings, setStyleSettings] = useState({
    ...DEFAULT_STYLE,
    ...(initialData?.style ?? {}),
  })
  const { edits: mediaEdits, getEdit, setEdit } = useImageEdits(10)
  const [storyEditing, setStoryEditing] = useState(false)
  const [storyMediaKind, setStoryMediaKind] = useState('image')
  const [storyDescription, setStoryDescription] = useState(initialData?.caption ?? '')
  const [storyDescPanelOpen, setStoryDescPanelOpen] = useState(false)
  const storyTextDivRef = useRef(null)
  const fileRefs = useRef([])
  const viewportWidth = useViewportWidth()
  const fbPhoneInspector = viewportWidth <= FB_PHONE_INSPECTOR_MAX
  const showDesktopDesignAside = !fbPhoneInspector

  const initialPostKey = initialData?.id || initialData?._id || 'new'

  useEffect(() => {
    const nextMediaState = buildInitialMedia(cfg, initialData?.media)
    setCaption(initialData?.caption ?? '')
    setHashtags(initialData?.hashtags ?? '')
    setLink(initialData?.link ?? '')
    setAiPrompt('')
    setLastAiTheme('')
    setScheduledDate(initialData?.scheduledDate ? new Date(initialData.scheduledDate) : new Date())
    setShowDatePicker(false)
    setMediaFiles(nextMediaState.mediaFiles)
    setExtraMedia(nextMediaState.extraMedia)
    setMediaRenderKey(0)
    setStyleSettings({ ...DEFAULT_STYLE, ...(initialData?.style ?? {}) })
    setStoryMediaKind(initialData?.media?.[0]?.type === 'video' ? 'video' : 'image')
    setStoryDescription(initialData?.caption ?? initialData?.style?.textCanvasText ?? '')
    setStoryDescPanelOpen(false)
  // Reset uniquement au changement de type ou de post édité — pas à chaque re-render parent
  }, [postType, initialPostKey])

  const allMedia = [...mediaFiles, ...extraMedia]

  const handleFileChange = (idx, e) => {
    const file = e.target.files[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    const url = URL.createObjectURL(file)
    const item = { file, url, type }
    if (idx < mediaFiles.length) {
      setMediaFiles(prev => { const next = [...prev]; next[idx] = item; return next })
    } else {
      const extraIdx = idx - mediaFiles.length
      setExtraMedia(prev => { const next = [...prev]; next[extraIdx] = item; return next })
    }
    e.target.value = ''
  }

  const addExtraSlot = () => setExtraMedia(prev => [...prev, null])

  const removeMedia = (idx) => {
    if (idx < mediaFiles.length) {
      setMediaFiles(prev => { const next = [...prev]; next[idx] = null; return next })
    } else {
      const extraIdx = idx - mediaFiles.length
      setExtraMedia(prev => prev.filter((_, i) => i !== extraIdx))
    }
  }

  const updateStyle = (keyOrObj, value) => {
    if (typeof keyOrObj === 'object') {
      setStyleSettings(prev => ({ ...prev, ...keyOrObj }))
    } else {
      setStyleSettings(prev => ({ ...prev, [keyOrObj]: value }))
    }
  }

  const getActiveTheme = () => aiPrompt.trim()

  const getRegenerateTheme = () => aiPrompt.trim() || lastAiTheme || initialData?.description || ''

  const getTheme = () => getRegenerateTheme() || caption.trim()

  const bustMediaUrl = (url) => {
    if (!url) return url
    if (url.startsWith('data:')) return `${url}#${Date.now()}`
    return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`
  }

  const splitMediaToState = (combined) => {
    const baseCount = cfg.mediaCount || 1
    const files = Array.from({ length: baseCount }, (_, i) => combined[i] || null)
    setMediaFiles(files)
    setExtraMedia(combined.slice(baseCount))
  }

  const getMediaGenerationCount = () => {
    const baseCount = cfg.mediaCount || 1
    if (postType === 'carousel') return Math.max(allMedia.length, baseCount)
    return 1
  }

  const getMediaRegenerationMeta = () => {
    const baseCount = cfg.mediaCount || 1
    if (postType === 'carousel') {
      const totalSlots = allMedia.length
      const emptySlots = allMedia.filter((m) => !m).length
      const filledSlots = totalSlots - emptySlots
      if (emptySlots > 0 && filledSlots > 0) {
        return { count: emptySlots, merge: true }
      }
      return { count: Math.max(totalSlots, baseCount), merge: false }
    }
    return { count: 1, merge: false }
  }

  const applyGeneratedMedia = (items = [], { merge = false } = {}) => {
    if (!items.length || !cfg.hasMedia) return
    setMediaRenderKey((prev) => prev + 1)
    const batchId = Date.now()
    const mapped = items.map((item, index) => ({
      id: `ai-${batchId}-${index}`,
      url: bustMediaUrl(item.url),
      type: (item.type === 'video' || cfg.isVideo) ? 'video' : 'image',
      file: null,
    }))

    if (cfg.isVideo || postType === 'video' || postType === 'reel' || (postType === 'story' && storyMediaKind === 'video')) {
      const videoItem = mapped.find((m) => m.type === 'video') || { ...mapped[0], type: 'video' }
      setMediaFiles([videoItem])
      setExtraMedia([])
      return
    }

    if (postType === 'carousel') {
      const current = [...allMedia]
      let itemIdx = 0
      let combined
      if (merge) {
        combined = current.map((slot) => {
          if (slot || itemIdx >= mapped.length) return slot
          return mapped[itemIdx++]
        })
        while (itemIdx < mapped.length) combined.push(mapped[itemIdx++])
      } else {
        combined = [...mapped]
        const minLen = Math.max(current.length, cfg.mediaCount || 3)
        while (combined.length < minLen) combined.push(null)
      }
      splitMediaToState(combined)
      return
    }

    setMediaFiles([mapped[0]])
    setExtraMedia([])
  }

  const handleGenerateMedia = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA ou générez d\'abord le contenu.')
      return
    }
    setIsGenerating(true)
    try {
      const { count, merge } = getMediaRegenerationMeta()
      const mediaPostType = postType === 'story'
        ? (storyMediaKind === 'video' ? 'video' : 'image')
        : postType
      const result = await generateMedia({
        description: theme,
        platform,
        postType: mediaPostType,
        count,
        regenerate: true,
      })
      applyGeneratedMedia(result.media, { merge })
    } catch (error) {
      alert(error.message || 'Erreur de génération média')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    const theme = getActiveTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA avant de générer.')
      return
    }
    setIsGenerating(true)
    try {
      setLastAiTheme(theme)
      const isNewSubject = caption.trim() || hashtags.trim() || allMedia.some(Boolean)
      const contentRes = await generateContent({
        description: theme,
        platform,
        postType,
        regenerate: isNewSubject,
      })
      setCaption(contentRes.contenu)

      if (postType === 'story') {
        setStoryDescription(contentRes.contenu)
        setStoryDescPanelOpen(true)
        setStyleSettings((prev) => ({
          ...prev,
          textCanvasEnabled: true,
          textCanvasText: contentRes.contenu,
          textCanvasX: 50,
          textCanvasY: 82,
          textCanvasFontSize: 18,
          textCanvasAlign: 'center',
        }))
      }

      if (cfg.hasHashtags) {
        try {
          const hashtagsRes = await generateHashtags({
            description: theme,
            platform,
            postType,
            regenerate: isNewSubject,
          })
          setHashtags(hashtagsRes.hashtags)
        } catch (hashtagsError) {
          alert(hashtagsError.message || 'La génération des hashtags a échoué')
        }
      }

      if (cfg.hasMedia) {
        try {
          const mediaPostType = postType === 'story'
            ? (storyMediaKind === 'video' ? 'video' : 'image')
            : postType
          const mediaRes = await generateMedia({
            description: theme,
            platform,
            postType: mediaPostType,
            count: getMediaGenerationCount(),
            regenerate: isNewSubject,
          })
          applyGeneratedMedia(mediaRes.media)
        } catch (mediaError) {
          alert(mediaError.message || 'La génération des médias a échoué')
        }
      }
    } catch (error) {
      alert(error.message || 'Erreur de génération IA')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateCaption = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA pour régénérer la caption.')
      return
    }
    setIsGenerating(true)
    try {
      if (initialData?._id || initialData?.id) {
        const result = await regeneratePostContent(initialData._id || initialData.id, theme)
        setCaption(result.contenu || result.caption)
      } else {
        const result = await generateContent({
          description: theme,
          platform,
          postType,
          regenerate: true,
          previousContent: caption,
        })
        setCaption(result.contenu)
      }
    } catch (error) {
      alert(error.message || 'Erreur de génération caption')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateHashtags = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA pour régénérer les hashtags.')
      return
    }
    setIsGenerating(true)
    try {
      const result = await generateHashtags({
        description: theme,
        platform,
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

  const handleStoryDescriptionChange = (value) => {
    setStoryDescription(value)
    setStyleSettings((prev) => ({
      ...prev,
      textCanvasEnabled: Boolean(value.trim()),
      textCanvasText: value,
    }))
  }

  const handleGenerateStoryDescription = async () => {
    const theme = getRegenerateTheme()
    if (!theme) {
      alert('Entrez une thématique dans la barre IA.')
      return
    }
    setIsGenerating(true)
    try {
      const result = await generateContent({
        description: theme,
        platform,
        postType: 'story',
        regenerate: true,
        previousContent: storyDescription,
      })
      handleStoryDescriptionChange(result.contenu)
      setStoryDescPanelOpen(true)
      setTimeout(() => setStoryEditing(true), 50)
    } catch (error) {
      alert(error.message || 'Erreur de génération description')
    } finally {
      setIsGenerating(false)
    }
  }

  const buildPost = () => {
    const liveText = storyTextDivRef.current?.textContent?.trim() ?? ''
    let finalStyle = styleSettings
    if (postType === 'story' && (liveText || storyDescription.trim())) {
      finalStyle = {
        ...styleSettings,
        textCanvasText: liveText || storyDescription,
        textCanvasEnabled: true,
      }
    }
    return {
      type: postType,
      caption: postType === 'story' ? (storyDescription || liveText || caption) : caption,
      description: aiPrompt.trim() || initialData?.description || '',
      hashtags,
      link,
      media: allMedia.filter(Boolean).map((item, idx) => {
        const edit = getEdit(idx)
        if (!edit || (!edit.crop && !edit.rotation)) return item
        return { ...item, imageEdit: edit }
      }),
      scheduledDate,
      style: finalStyle,
      comments: initialData?.comments ?? [],
      engagement: initialData?.engagement ?? {
        likes: Math.floor(Math.random() * 800) + 120,
        comments: initialData?.comments?.length ?? 2,
        shares: Math.floor(Math.random() * 18) + 1,
      },
    }
  }

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

  const editorMediaFrameDimensions = {
    aspectRatio: cfg.mediaAspect,
    ...(postType === 'image' && fbPhoneInspector && !vertical
      ? {
          maxHeight: 'min(420px, 52vh)',
          minHeight: 200,
          width: '100%',
          maxWidth: '100%',
          alignSelf: 'stretch',
        }
      : { maxHeight: vertical ? 340 : 260, width: vertical ? 180 : '100%' }),
  }

  const isVideoMedia = (m) => m?.type === 'video' || cfg.isVideo

  const livePreviewSingleMediaStyle = !vertical
    ? {
        ...editorMediaFrameDimensions,
        background: '#f3f4f6',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }
    : {}

  const renderDesignFlexibleAside = (stacked) => (
    <aside
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        position: stacked ? 'static' : 'sticky',
        top: stacked ? undefined : 12,
        width: stacked ? '100%' : 360,
        minWidth: 0,
        maxWidth: '100%',
        flex: stacked ? undefined : '0 0 360px',
        boxSizing: 'border-box',
        alignSelf: stacked ? 'stretch' : 'start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Palette size={18} color="#7c3aed" />
        <div>
          <div style={{ fontWeight: 700, color: '#111827' }}>Design flexible</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Changez le style du post avant de l&apos;enregistrer.</div>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police</span>
        <div style={{ position: 'relative' }}>
          <Type size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: 12 }} />
          <select value={styleSettings.fontFamily} onChange={e => updateStyle('fontFamily', e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 14px 10px 36px', background: '#fff', color: '#111827' }}>
            {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </label>

      <StyleSlider label="Largeur du post" value={styleSettings.cardWidth} min={60} max={100} suffix="%" onChange={e => updateStyle('cardWidth', Number(e.target.value))} />
      <StyleSlider label="Hauteur du média" value={styleSettings.mediaHeight} min={180} max={520} suffix=" px" onChange={e => updateStyle('mediaHeight', Number(e.target.value))} />

      <div style={{ padding: 16, borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(15,23,42,0.05)', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#111827', minWidth: 0 }}>Aperçu en direct</div>
          <StretchHorizontal size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
        </div>
        <div
          style={{
            width: vertical ? 160 : '100%',
            maxWidth: vertical ? 160 : `${styleSettings.cardWidth}%`,
            minWidth: 0,
            boxSizing: 'border-box',
            height: vertical ? 284 : 'auto',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: 18,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {!vertical && (
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>U</div>
              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Vous</div>
                <div style={{ fontSize: 11, color: '#6b7280', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{cfg.label}</div>
              </div>
            </div>
          )}
          {!vertical && caption && <div style={{ padding: '0 16px 4px', ...previewTextStyle, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word', boxSizing: 'border-box' }}>{caption}</div>}
          {!vertical && hashtags && <div style={{ padding: '0 16px 12px', color: '#2563eb', fontSize: 14, fontWeight: 600, overflowWrap: 'break-word', wordBreak: 'break-word', boxSizing: 'border-box' }}>{hashtags}</div>}
          {allMedia.filter(Boolean).length > 0 && (
            postType === 'carousel' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: '#e5e7eb' }}>
                {allMedia.filter(Boolean).slice(0, 4).map((media, i) => (
                  <div key={i} style={{ aspectRatio: '1 / 1', width: '100%', minHeight: 0, overflow: 'hidden', background: '#f3f4f6', position: 'relative' }}>
                    {media.type === 'video'
                      ? <PreviewVideo key={`${media.id || media.url}-${mediaRenderKey}`} src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <EditedImage key={media.id || media.url} src={media.url} edit={getEdit(i)} />}
                  </div>
                ))}
              </div>
            ) : (
              <div style={vertical ? { position: 'absolute', inset: 0, background: '#f3f4f6' } : livePreviewSingleMediaStyle}>
                {isVideoMedia(allMedia.filter(Boolean)[0])
                  ? <PreviewVideo key={`${allMedia.filter(Boolean)[0].id || allMedia.filter(Boolean)[0].url}-${mediaRenderKey}`} src={allMedia.filter(Boolean)[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls={!vertical} autoPlay={vertical} loop={vertical} />
                  : <EditedImage key={allMedia.filter(Boolean)[0].id || allMedia.filter(Boolean)[0].url} src={allMedia.filter(Boolean)[0].url} edit={getEdit(0)} />}
              </div>
            )
          )}
          {vertical && (
            <>
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ede9fe', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, fontSize: 10 }}>U</div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Vous</span>
              </div>
              {(caption || hashtags) && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '24px 10px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.72))' }}>
                  {caption && (
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.95)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 3px rgba(0,0,0,0.6)', marginBottom: hashtags ? 3 : 0, ...previewTextStyle }}>
                      {caption}
                    </div>
                  )}
                  {hashtags && (
                    <div style={{ fontSize: 10, color: 'rgba(130,180,255,0.95)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                      {hashtags}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )

  const renderReelPreviewAside = () => (
    <aside style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', alignSelf: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sparkles size={18} color="#7c3aed" />
        <div>
          <div style={{ fontWeight: 700, color: '#111827' }}>Aperçu du Reel</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Prévisualisation en temps réel</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 220,
          height: 390,
          borderRadius: 18,
          overflow: 'hidden',
          position: 'relative',
          background: '#111',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          border: '2px solid #222',
          flexShrink: 0,
        }}>
          {mediaFiles[0] ? (
            mediaFiles[0].type === 'video' ? (
              <PreviewVideo
                key={`${mediaFiles[0].id || mediaFiles[0].url}-${mediaRenderKey}`}
                src={mediaFiles[0].url}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={mediaFiles[0].url}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 36, opacity: 0.25 }}>▶</span>
            </div>
          )}

          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 22%, transparent 45%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.92) 100%)',
            zIndex: 1, pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            zIndex: 2,
            padding: '0 8px 10px',
            display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 8,
            boxSizing: 'border-box',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f9a825, #e65100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 9,
                  border: '1.5px solid #fff', flexShrink: 0,
                }}>U</div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)', lineHeight: 1 }}>
                  Vous
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>·</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>Suivre</span>
              </div>

              {caption ? (
                <div style={{
                  fontSize: 9.5, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  marginBottom: hashtags ? 3 : 0,
                  overflowWrap: 'break-word', wordBreak: 'break-word',
                }}>
                  {caption}
                </div>
              ) : (
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginBottom: 3 }}>
                  Description…
                </div>
              )}

              {hashtags ? (
                <div style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
                  lineHeight: 1.35,
                  overflowWrap: 'break-word', wordBreak: 'break-word',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}>
                  {hashtags}
                </div>
              ) : (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                  #hashtags…
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, paddingBottom: 2 }}>
              {[
                ThumbsUp,
                MessageCircle,
                Share2,
              ].map((Icon, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Icon size={13} strokeWidth={2.2} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>0</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )

  // Shared publish buttons block
  const publishButtons = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
      <button onClick={() => onPublish(buildPost())}
        style={{ width: '100%', background: '#6159ff', color: '#fff', borderRadius: 16, padding: '16px 20px', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#6159ff' }}>
        {initialData ? 'Mettre à jour et publier' : 'Publier maintenant'}
      </button>

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 22, padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
          <CalendarDays size={18} />Planifier pour plus tard
        </div>
        <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateTime(scheduledDate)}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Choisissez une date et une heure pour planifier le post.</span>
            </div>
            <button onClick={() => setShowDatePicker(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: showDatePicker ? '#ede9fe' : '#fff', border: `1px solid ${showDatePicker ? '#c4b5fd' : '#d1d5db'}`, color: showDatePicker ? '#6d28d9' : '#475569', padding: '10px 14px', minWidth: 120, minHeight: 44, fontWeight: 700, gap: 8, cursor: 'pointer' }}>
              <span>{showDatePicker ? 'Masquer' : 'Modifier'}</span><CalendarDays size={18} />
            </button>
          </div>
          {showDatePicker && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 40, width: 'min(100%, 360px)' }}>
              <DateTimePicker value={scheduledDate} onChange={date => { setScheduledDate(date); setShowDatePicker(false) }} onClose={() => setShowDatePicker(false)} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={() => onSchedule(buildPost())}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              borderRadius: 14,
              background: '#dbeafe',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              padding: '14px 12px',
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.25,
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {initialData ? 'Mettre à jour et planifier' : 'Planifier'}
          </button>
          <button
            type="button"
            onClick={() => onDraft(buildPost())}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              borderRadius: 14,
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              padding: '14px 12px',
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.25,
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {initialData ? 'Mettre à jour le brouillon' : 'Garder en réserve'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <style>{`
        @keyframes ai-gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes ai-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes ai-pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.9);opacity:0} }
        @keyframes ai-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ai-bar-wrap { position:relative; border-radius:999px; padding:2px; background:linear-gradient(135deg,#a78bfa,#7c3aed,#6366f1,#a855f7,#a78bfa); background-size:300% 300%; animation:ai-gradient-shift 4s ease infinite; box-shadow:0 4px 24px rgba(139,92,246,0.28),0 1px 4px rgba(139,92,246,0.12); }
        .ai-bar-inner { background:#faf7ff; border-radius:999px; padding:10px 22px 10px 22px; display:flex; gap:12px; align-items:center; position:relative; overflow:hidden; }
        .ai-bar-inner::before { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(167,139,250,0.13) 50%,transparent 60%); background-size:200% 100%; animation:ai-shimmer 3.5s ease infinite; pointer-events:none; }
        .ai-bar-input { flex:1; border:none; background:transparent; font-size:14px; font-weight:500; color:#1e1040; outline:none; letter-spacing:0.01em; }
        .ai-bar-input::placeholder { color:#a78bfa; font-weight:400; }
        .ai-icon-wrap { position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ai-icon-ring { position:absolute; inset:0; border-radius:50%; background:rgba(139,92,246,0.2); animation:ai-pulse-ring 2s ease-out infinite; }
        .ai-gen-btn { display:flex; align-items:center; gap:8px; background:linear-gradient(135deg,#7c3aed,#6366f1); color:#fff; border-radius:999px; padding:10px 20px; font-size:13.5px; font-weight:700; letter-spacing:0.02em; cursor:pointer; border:none; position:relative; overflow:hidden; transition:transform 0.15s,box-shadow 0.15s; box-shadow:0 2px 12px rgba(99,102,241,0.35); flex-shrink:0; }
        .ai-gen-btn-full { width:100%; box-sizing:border-box; flex-shrink:1; justify-content:center; padding:12px 20px; border-radius:14px; }
        .ai-gen-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 20px rgba(99,102,241,0.45); }
        .ai-gen-btn:disabled { background:linear-gradient(135deg,#c4b5fd,#a5b4fc); box-shadow:none; cursor:not-allowed; }
        .ai-gen-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%); background-size:200% 100%; animation:ai-shimmer 2s ease infinite; }
        .ai-spinner { animation:ai-spin 0.8s linear infinite; }
      `}</style>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Barre IA + générer en pleine largeur juste en dessous */}
          <div style={{ display: 'flex', flexDirection: fbPhoneInspector ? 'column' : 'row', alignItems: 'stretch', gap: 12, width: '100%', minWidth: 0 }}>
            <div className="ai-bar-wrap" style={{ flex: fbPhoneInspector ? undefined : 1, minWidth: 0 }}>
              <div className="ai-bar-inner">
                <div className="ai-icon-wrap">
                  <div className="ai-icon-ring" />
                  <Sparkles size={18} color="#7c3aed" />
                </div>
                <input className="ai-bar-input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Décrivez votre post, l'IA génère tout…"
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()} />
              </div>
            </div>
            <button
              type="button"
              className={fbPhoneInspector ? 'ai-gen-btn ai-gen-btn-full' : 'ai-gen-btn'}
              onClick={handleGenerate}
              disabled={isGenerating}
              style={fbPhoneInspector ? undefined : { minWidth: 152, justifyContent: 'center', alignSelf: 'stretch' }}
            >
              {isGenerating ? <Sparkles size={14} className="ai-spinner" /> : <Sparkles size={14} />}
              {isGenerating ? 'Génération…' : 'Générer'}
            </button>
          </div>

          {/* Header */}
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

          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>U</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Utilisateur</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 12 }}>
                <span>🕐</span>{formatDateTime(scheduledDate)}<CalendarDays size={13} color="#9ca3af" />
              </div>
            </div>
          </div>

          {/* ── STORY layout ─────────────────────────────────────────────── */}
          {postType === 'story' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setStoryMediaKind('image')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: storyMediaKind === 'image' ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                    background: storyMediaKind === 'image' ? '#ede9fe' : '#fff',
                    color: storyMediaKind === 'image' ? '#6d28d9' : '#374151',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <ImageIcon size={15} />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setStoryMediaKind('video')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: storyMediaKind === 'video' ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                    background: storyMediaKind === 'video' ? '#ede9fe' : '#fff',
                    color: storyMediaKind === 'video' ? '#6d28d9' : '#374151',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <Video size={15} />
                  Vidéo
                </button>
              </div>
              {/* Canvas + toolbar row */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', justifyContent: 'center' }}>
                {/* Canvas */}
                <div style={{ width: 220, flexShrink: 0 }}>
                  <TextCanvasEditor
                    styleSettings={styleSettings}
                    updateStyle={updateStyle}
                    mediaUrl={mediaFiles[0]?.url ?? null}
                    mediaKind={mediaFiles[0]?.type === 'video' ? 'video' : 'image'}
                    onMediaUpload={(file, url, type) => setMediaFiles([{ file, url, type }])}
                    renderControlsOnly={false}
                    editing={storyEditing}
                    setEditing={setStoryEditing}
                    textDivRef={storyTextDivRef}
                    storyDescription={storyDescription}
                    onStoryDescriptionChange={handleStoryDescriptionChange}
                  />
                </div>
                {/* Description — à droite de la story */}
                {storyDescPanelOpen && (
                  <div style={{
                    width: 260,
                    flexShrink: 0,
                    alignSelf: 'stretch',
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Description
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateStoryDescription}
                        disabled={isGenerating}
                        title="Régénérer la description avec l'IA"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid rgba(167,139,250,0.35)',
                          background: 'rgba(167,139,250,0.15)',
                          color: '#c4b5fd',
                          cursor: isGenerating ? 'not-allowed' : 'pointer',
                          opacity: isGenerating ? 0.6 : 1,
                        }}
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                    <textarea
                      value={storyDescription}
                      onChange={(e) => handleStoryDescriptionChange(e.target.value)}
                      placeholder="Décrivez votre story…"
                      rows={8}
                      style={{
                        flex: 1,
                        width: '100%',
                        resize: 'vertical',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: 13,
                        lineHeight: 1.55,
                        padding: '12px 14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        minHeight: 160,
                      }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.4 }}>
                      Modifiable en direct — le texte se met à jour sur la story.
                    </span>
                  </div>
                )}
                {/* Vertical toolbar */}
                <div style={{ flexShrink: 0, alignSelf: 'stretch', display: 'flex' }}>
                  <TextCanvasEditor
                    styleSettings={styleSettings}
                    updateStyle={updateStyle}
                    mediaUrl={mediaFiles[0]?.url ?? null}
                    mediaKind={mediaFiles[0]?.type === 'video' ? 'video' : 'image'}
                    onMediaUpload={(file, url, type) => setMediaFiles([{ file, url, type }])}
                    renderControlsOnly={true}
                    editing={storyEditing}
                    setEditing={setStoryEditing}
                    textDivRef={storyTextDivRef}
                    storyDescription={storyDescription}
                    onStoryDescriptionChange={handleStoryDescriptionChange}
                    onRegenerateDescription={handleGenerateStoryDescription}
                    isGenerating={isGenerating}
                    descriptionPanelOpen={storyDescPanelOpen}
                    onToggleDescriptionPanel={setStoryDescPanelOpen}
                    onAddText={() => {
                      setStoryDescPanelOpen(true)
                      setStyleSettings(prev => ({
                        ...prev,
                        textCanvasEnabled: true,
                        textCanvasText: storyDescription || 'Votre description',
                        textCanvasX: 50,
                        textCanvasY: 82,
                        textCanvasFontSize: 18,
                        textCanvasAlign: 'center',
                      }))
                      setTimeout(() => setStoryEditing(true), 50)
                    }}
                    onRemoveText={() => {
                      setStoryDescription('')
                      setStoryDescPanelOpen(false)
                      setStyleSettings(prev => ({
                        ...prev,
                        textCanvasEnabled: false,
                        textCanvasText: '',
                      }))
                      setStoryEditing(false)
                    }}
                  />
                </div>
              </div>

              {/* Publish buttons (story) */}
              {publishButtons}
            </div>

          ) : (
          /* ── Non-story: original 2-col layout ──────────────────────────── */
          <>
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

              {/* Left: fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>

                {cfg.hasCaption && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>CAPTION</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" aria-label="Régénérer la caption avec l'IA" onClick={handleGenerateCaption} disabled={isGenerating}
                          style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}><Sparkles size={16} /></button>
                        <button style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}><Wand2 size={16} /></button>
                      </div>
                    </div>
                    <textarea value={caption} onChange={e => setCaption(e.target.value)}
                      placeholder="Cliquez pour rédiger ou générez avec l'IA" rows={5}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#374151', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
                      onFocus={e => { e.target.style.borderColor = '#8b5cf6' }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb' }} />
                  </div>
                )}

                {cfg.hasHashtags && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>HASHTAGS</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" aria-label="Générer les hashtags avec l'IA" onClick={handleGenerateHashtags} disabled={isGenerating}
                          style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
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
                      <button type="button" aria-label="Générer les médias avec l'IA" onClick={handleGenerateMedia} disabled={isGenerating}
                        style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}><Sparkles size={16} /></button>
                    </div>

                    {postType === 'carousel' ? (
                      <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {allMedia.map((m, idx) => (
                          <div key={idx}
                            style={{ ...mediaSlotStyle('1/1'), width: 'calc(25% - 8px)', flexShrink: 0 }}
                            onClick={() => !m && fileRefs.current[idx]?.click()}
                            onMouseEnter={e => { if (m) { const b = e.currentTarget.querySelector('.img-edit-btns'); if (b) b.style.opacity = '1' } }}
                            onMouseLeave={e => { if (m) { const b = e.currentTarget.querySelector('.img-edit-btns'); if (b) b.style.opacity = '0' } }}
                          >
                            {m ? (
                              <>
                                {m.type === 'video'
                                  ? <PreviewVideo key={`${m.id || m.url}-${mediaRenderKey}`} src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, background: '#0f172a' }} />
                                  : <EditedImage key={m.id || m.url} src={m.url} edit={getEdit(idx)} />}
                                <button onClick={e => { e.stopPropagation(); removeMedia(idx) }}
                                  style={{ position: 'absolute', top: 4, right: 4, zIndex: 3, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>×</button>
                                <div className="img-edit-btns" style={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                  <ImageEditButtons idx={idx} mediaSrc={m.url} edit={getEdit(idx)} setEdit={setEdit} isVideo={m.type === 'video'} />
                                </div>
                              </>
                            ) : (
                              <><ImageIcon size={22} color="#d1d5db" /><span style={{ fontSize: 11, color: '#9ca3af' }}>Ajouter</span></>
                            )}
                            <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                              ref={el => { fileRefs.current[idx] = el }}
                              onChange={e => handleFileChange(idx, e)} />
                          </div>
                        ))}
                        <div onClick={addExtraSlot}
                          style={{ ...mediaSlotStyle('1/1'), width: 'calc(25% - 8px)', flexShrink: 0, background: '#f5f3ff', border: '1.5px dashed #c4b5fd', color: '#7c3aed' }}>
                          <Plus size={22} /><span style={{ fontSize: 11, fontWeight: 600 }}>Ajouter</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          ...mediaSlotStyle(cfg.mediaAspect),
                          ...editorMediaFrameDimensions,
                        }}
                        onClick={() => !mediaFiles[0] && fileRefs.current[0]?.click()}
                        onMouseEnter={e => {
                          if (!mediaFiles[0]) { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.background = '#f5f3ff' }
                          else { const b = e.currentTarget.querySelector('.img-edit-btns'); if (b) b.style.opacity = '1' }
                        }}
                        onMouseLeave={e => {
                          if (!mediaFiles[0]) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f3f4f6' }
                          else { const b = e.currentTarget.querySelector('.img-edit-btns'); if (b) b.style.opacity = '0' }
                        }}>
                        {mediaFiles[0] ? (
                          <>
                            {isVideoMedia(mediaFiles[0])
                              ? <PreviewVideo key={`${mediaFiles[0].url}-${mediaRenderKey}`} src={mediaFiles[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} controls autoPlay={false} />
                              : <EditedImage src={mediaFiles[0].url} edit={getEdit(0)} />}
                            <button onClick={e => { e.stopPropagation(); removeMedia(0) }}
                              style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>×</button>
                            <div className="img-edit-btns" style={{ opacity: 0, transition: 'opacity 0.15s' }}>
                              <ImageEditButtons idx={0} mediaSrc={mediaFiles[0].url} edit={getEdit(0)} setEdit={setEdit} isVideo={isVideoMedia(mediaFiles[0])} />
                            </div>
                          </>
                        ) : (
                          <>
                            {postType === 'video' || postType === 'reel' ? <Video size={32} color="#d1d5db" /> : <ImageIcon size={32} color="#d1d5db" />}
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

                {postType === 'reel' && renderReelPreviewAside()}

                {!showDesktopDesignAside && postType !== 'reel' && renderDesignFlexibleAside(true)}

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

              {showDesktopDesignAside && postType !== 'reel' ? renderDesignFlexibleAside(false) : null}
            </div>

            {/* Publish buttons (non-story) */}
            {publishButtons}
          </>
          )}

        </div>
      </div>
    </div>
  )
}