import { useEffect, useRef, useState } from 'react'
import { ThumbsUp, MessageCircle, Share2, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { reelTopBtn } from './constants'
import { getPostComments, getPostEngagement, formatCount } from './utils'

export function ReelViewerPopup({ post, onClose, onEditPost, onDeletePost }) {
  const videoRef             = useRef(null)
  const [muted, setMuted]   = useState(true)
  const [paused, setPaused] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  const comments    = getPostComments(post)
  const engagement  = getPostEngagement(post, comments)
  const displayName = post.user?.name || 'Vous'

  const isVideo =
    post.type === 'video' ||
    post.type === 'reel'  ||
    post.media?.[0]?.type === 'video'

  const mediaUrl = post.media?.[0]?.url
  const caption  = post.caption || ''
  const isLongCaption = caption.length > 80

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.load()
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }, [mediaUrl])

  const togglePause = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPaused(false) }
    else          { v.pause(); setPaused(true)  }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const actions = [
    { icon: <ThumbsUp size={26} />,      label: formatCount(engagement.likes),    key: 'like'    },
    { icon: <MessageCircle size={26} />, label: formatCount(engagement.comments), key: 'comment' },
    { icon: <Share2 size={26} />,        label: formatCount(engagement.shares),   key: 'share'   },
    { icon: <MoreVertical size={26} />,  label: null,                             key: 'more'    },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        width: '100vw', height: '100vh',
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: '100vh',
          gap: 0,
        }}
      >

        <div style={{
          position: 'relative',
          width: '390px',
          height: '100vh',
          background: '#000',
          overflow: 'hidden',
          flexShrink: 0,
        }}>

          {mediaUrl && isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              muted autoPlay loop playsInline
              controls={false}
              preload="auto"
              onError={() => setVideoError(true)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                background: '#000',
                zIndex: 0,
              }}
            />
          ) : mediaUrl ? (
            <img src={mediaUrl} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              background: 'linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 56, opacity: 0.2 }}>▶</span>
            </div>
          )}

          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 18%, transparent 48%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)',
          }} />

          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            padding: '16px 14px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <button type="button" onClick={onClose} style={reelTopBtn} aria-label="Fermer">
              <X size={20} />
            </button>
            <div style={{ flex: 1 }} />
            {isVideo && (
              <button type="button" onClick={toggleMute} style={reelTopBtn}>
                <span style={{ fontSize: 18 }}>{muted ? '🔇' : '🔊'}</span>
              </button>
            )}
            <button type="button" onClick={e => { e.stopPropagation(); onEditPost(post) }} style={reelTopBtn}>
              <Pencil size={16} />
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); onDeletePost(post.id); onClose() }} style={reelTopBtn}>
              <Trash2 size={16} />
            </button>
          </div>

          {isVideo && !videoError && (
            <button type="button" onClick={togglePause}
              style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paused && (
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26 }}>▶</div>
              )}
            </button>
          )}

          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            zIndex: 10,
            padding: '0 14px 28px',
            boxSizing: 'border-box',
          }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f9a825, #e65100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 17,
                  border: '2px solid #fff',
                }}>
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#4ade80', border: '2px solid #000' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)', lineHeight: 1.2 }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>·</span>
                  <button type="button" onClick={e => e.stopPropagation()}
                    style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    Suivre
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.music || 'Son original'}
                  </span>
                </div>
              </div>
            </div>

            {caption && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.45, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  {isLongCaption && !captionExpanded
                    ? caption.slice(0, 80)
                    : caption}
                </div>
                {isLongCaption && !captionExpanded && (
                  <button type="button"
                    onClick={e => { e.stopPropagation(); setCaptionExpanded(true) }}
                    style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                    ... En voir plus
                  </button>
                )}
              </div>
            )}

            {post.hashtags && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.hashtags}
              </div>
            )}

          </div>

        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '28px',
          gap: 24,
          width: 72,
          height: '100vh',
          flexShrink: 0,
        }}>
          {actions.map(({ icon, label, key }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={e => e.stopPropagation()}
                style={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.24)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              >
                {icon}
              </button>
              {label && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
