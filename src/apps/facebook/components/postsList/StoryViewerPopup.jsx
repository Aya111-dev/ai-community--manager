import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import { EMOJIS, navArrowBtn, storyCtrlBtn } from './constants'
import { formatRelative, getMediaOverlayData, getPrimaryMedia, getStoryBackground } from './utils'

export function StoryViewerPopup({ post, allStories, onClose, onEditPost, onDeletePost }) {
  const startIdx = allStories.findIndex(s => s.id === post.id)
  const [currentIndex, setCurrentIndex] = useState(startIdx < 0 ? 0 : startIdx)
  const [progress, setProgress]         = useState(0)
  const [paused, setPaused]             = useState(false)
  const [muted, setMuted]               = useState(false)
  const current = allStories[currentIndex] || post

  const primaryMedia = getPrimaryMedia(current)
  const mediaUrl = primaryMedia.src
  const isVideo = primaryMedia.type === 'video'
  const [mediaFailed, setMediaFailed] = useState(false)
  const [mediaReady, setMediaReady] = useState(!isVideo)
  const mediaStyle = primaryMedia.presentation
  const overlay = getMediaOverlayData(current)
  const storyBackground = getStoryBackground(current.style)

  useEffect(() => {
    setMediaFailed(false)
    setMediaReady(!isVideo)
  }, [current.id, isVideo, mediaUrl])

  useEffect(() => {
    setProgress(0)
    if (paused) return
    const id = setInterval(() => setProgress(p => (p >= 100 ? 100 : p + 1.2)), 80)
    return () => clearInterval(id)
  }, [currentIndex, paused])

  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < allStories.length - 1) setCurrentIndex(i => i + 1)
      else onClose()
    }
  }, [progress])

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') currentIndex < allStories.length - 1 ? setCurrentIndex(i => i + 1) : onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1)
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [currentIndex])

  const goNext = (e) => {
    e?.stopPropagation()
    currentIndex < allStories.length - 1 ? setCurrentIndex(i => i + 1) : onClose()
  }
  const goPrev = (e) => {
    e?.stopPropagation()
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  const cardHeight = 'min(calc(100vh - 48px), 720px)'
  const cardWidth  = 'min(calc((100vh - 48px) * 9 / 16), 405px)'

  const displayName = current.user?.name || 'Vous'
  const avatarInitial = displayName.slice(0, 1).toUpperCase()

  return (
    <div style={{
      position: 'fixed', inset: 0,
      width: '100vw', height: '100vh',
      zIndex: 9999,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        minHeight: 0,
        gap: 0,
      }}>

        <div style={{ width: 80, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          {currentIndex > 0 && (
            <button type="button" onClick={goPrev} style={navArrowBtn}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)' }}>
              <ChevronLeft size={24} />
            </button>
          )}
        </div>

        <div style={{
          position: 'relative',
          width: cardWidth,
          height: cardHeight,
          borderRadius: 10,
          overflow: 'hidden',
          background: '#222',
          flexShrink: 0,
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
        }}>

          {/* Background gradient */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: storyBackground,
            opacity: mediaUrl && !mediaFailed ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }} />

          {/* Media */}
          {mediaUrl && !mediaFailed ? (
            isVideo ? (
              <video key={current.id} src={mediaUrl}
                muted={muted} autoPlay loop playsInline preload="metadata"
                onLoadedData={() => setMediaReady(true)}
                onCanPlay={() => setMediaReady(true)}
                onError={() => setMediaFailed(true)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: mediaStyle.objectFit, objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform, zIndex: 0, opacity: mediaReady ? 1 : 0.01, transition: 'opacity 0.2s ease' }}
              />
            ) : (
              <img key={current.id} src={mediaUrl} alt=""
                onError={() => setMediaFailed(true)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: mediaStyle.objectFit, objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform, zIndex: 0 }}
              />
            )
          ) : null}

          {/* ── Text overlay — uses ALL saved style properties ── */}
          {overlay.overlayText && (
            <div style={{
              position: 'absolute',
              left: `${overlay.overlayTextX}%`,
              top: `${overlay.overlayTextY}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              color: overlay.overlayTextColor,
              fontFamily: overlay.overlayTextFontFamily,
              fontSize: overlay.overlayTextFontSize ?? 20,
              fontWeight: overlay.overlayTextBold ? 800 : 500,
              textAlign: overlay.overlayTextAlign ?? 'center',
              lineHeight: 1.3,
              textShadow: '0 2px 10px rgba(0,0,0,0.45)',
              maxWidth: '82%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              pointerEvents: 'none',
            }}>
              {overlay.overlayText}
            </div>
          )}

          {/* Top gradient for readability */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />

          {/* Header: progress + avatar + controls */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '10px 12px 0' }}>

            <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
              {allStories.map((s, i) => (
                <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.32)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, background: '#fff',
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: '#1877f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 15,
                border: '2px solid rgba(255,255,255,0.9)',
              }}>
                {avatarInitial}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  {displayName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', flexShrink: 0 }}>
                    {formatRelative(current.updatedAt || current.createdAt)}
                  </span>
                  {current.music && (
                    <>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>·</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🎵 {current.music}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <button type="button" onClick={e => { e.stopPropagation(); setPaused(p => !p) }} style={storyCtrlBtn}>
                  <span style={{ fontSize: 12, color: '#fff' }}>{paused ? '▶' : '⏸'}</span>
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); onEditPost(current) }} style={storyCtrlBtn}>
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); onDeletePost(current.id); onClose() }} style={storyCtrlBtn}>
                  <Trash2 size={13} />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); onClose() }} style={storyCtrlBtn}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Message + emojis — dans le cadre, toujours visibles */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 15,
              padding: '8px 10px 12px',
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.72) 100%)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.55)',
                background: 'rgba(0,0,0,0.22)',
                padding: '9px 14px',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 14,
                cursor: 'text',
                boxSizing: 'border-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                Envoyer un message...
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, flexShrink: 0, flexWrap: 'wrap', maxWidth: '100%' }}>
                {EMOJIS.map((emoji, i) => (
                  <button key={i} type="button" onClick={e => e.stopPropagation()}
                    style={{ fontSize: 22, background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '5px', borderRadius: '50%', transition: 'transform 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Click zones — s’arrêtent au-dessus de la barre du bas */}
          <button type="button" onClick={goPrev} aria-label="Précédent"
            style={{ position: 'absolute', left: 0, top: 70, width: '40%', bottom: 96, zIndex: 5, background: 'transparent', border: 'none', cursor: currentIndex > 0 ? 'w-resize' : 'default' }} />
          <button type="button" onClick={goNext} aria-label="Suivant"
            style={{ position: 'absolute', right: 0, top: 70, width: '60%', bottom: 96, zIndex: 5, background: 'transparent', border: 'none', cursor: 'e-resize' }} />

        </div>

        <div style={{ width: 80, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          {currentIndex < allStories.length - 1 && (
            <button type="button" onClick={goNext} style={navArrowBtn}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)' }}>
              <ChevronRight size={24} />
            </button>
          )}
        </div>

      </div>

    </div>
  )
}