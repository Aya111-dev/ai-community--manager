import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Globe, Pencil, ThumbsUp, MessageCircle, Share2, Trash2, X } from 'lucide-react'
import { FB_BLUE, FB_BG, FB_BORDER, FB_TEXT, FB_SECONDARY } from './constants'
import { formatRelative, formatCount, formatMetricLabel, getPostComments, getPostEngagement } from './utils'

export function FeedPostPopup({ post, onClose, onEditPost, onDeletePost }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const media = post.media ?? []
  const isCarousel = media.length > 1
  const hasMedia = media.length > 0
  const comments = getPostComments(post)
  const engagement = getPostEngagement(post, comments)

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && activeIndex < media.length - 1) setActiveIndex(i => i + 1)
      if (e.key === 'ArrowLeft' && activeIndex > 0) setActiveIndex(i => i - 1)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [activeIndex, media.length])

  const goPrev = (e) => { e.stopPropagation(); if (activeIndex > 0) setActiveIndex(i => i - 1) }
  const goNext = (e) => { e.stopPropagation(); if (activeIndex < media.length - 1) setActiveIndex(i => i + 1) }
  const current = media[activeIndex]

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', overflow: 'hidden' }}>

      <div onClick={e => e.stopPropagation()}
        style={{ display: 'flex', width: hasMedia ? 'min(90vw, 1100px)' : 'min(90vw, 560px)', height: hasMedia ? 'min(88vh, 760px)' : 'auto', maxHeight: '90vh', borderRadius: 12, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7)', background: '#000' }}>

        {hasMedia && (
          <div style={{ flex: '0 0 60%', position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

            {current?.url && (
              current.type === 'video' || post.type === 'video'
                ? <video src={current.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay muted loop playsInline />
                : null
            )}

            {current?.url && current.type !== 'video' && (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${current.url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.2)', zIndex: 0 }} />
            )}
            {current?.url && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {current.type === 'video' || post.type === 'video'
                  ? <video src={current.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay muted loop playsInline />
                  : (() => {
                      const ec = current?.imageEdit?.crop ?? null
                      const er = current?.imageEdit?.rotation ?? 0
                      if (ec) {
                        return (
                          <div style={{ position: 'relative', overflow: 'hidden', width: `${ec.w}%`, height: `${ec.h}%`, maxWidth: '100%', maxHeight: '100%' }}>
                            <img src={current.url} alt="" style={{ position: 'absolute', width: `${(1/(ec.w/100))*100}%`, height: `${(1/(ec.h/100))*100}%`, left: `${-(ec.x/ec.w)*100}%`, top: `${-(ec.y/ec.h)*100}%`, maxWidth: 'none', transform: er ? `rotate(${er}deg)` : undefined }} />
                          </div>
                        )
                      }
                      return <img src={current.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', transform: er ? `rotate(${er}deg)` : undefined }} />
                    })()
                }
              </div>
            )}

            {isCarousel && activeIndex > 0 && (
              <button type="button" onClick={goPrev}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', border: 'none' }}>
                <ChevronLeft size={20} />
              </button>
            )}
            {isCarousel && activeIndex < media.length - 1 && (
              <button type="button" onClick={goNext}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', border: 'none' }}>
                <ChevronRight size={20} />
              </button>
            )}

            {isCarousel && (
              <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'center', gap: 6 }}>
                {media.map((_, i) => (
                  <button key={i} type="button" onClick={e => { e.stopPropagation(); setActiveIndex(i) }}
                    style={{ width: i === activeIndex ? 20 : 8, height: 8, borderRadius: 999, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', transition: 'width 0.2s, background 0.2s' }} />
                ))}
              </div>
            )}

            {isCarousel && (
              <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, backdropFilter: 'blur(6px)' }}>
                {activeIndex + 1} / {media.length}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff', height: '100%' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${FB_BORDER}`, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>V</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: FB_TEXT }}>Vous</div>
              <div style={{ fontSize: 12, color: FB_SECONDARY, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span>{formatRelative(post.updatedAt || post.createdAt)}</span>
                <span>·</span>
                <Globe size={11} />
              </div>
            </div>
            <button type="button" onClick={() => { onEditPost(post); onClose() }} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', color: FB_SECONDARY, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0 }}><Pencil size={14} /></button>
            <button type="button" onClick={() => { onDeletePost(post.id); onClose() }} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0 }}><Trash2 size={14} /></button>
            <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', color: FB_SECONDARY, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0 }}><X size={16} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', minHeight: 0 }}>

            {post.caption && (
              <div style={{ fontSize: 15, color: FB_TEXT, lineHeight: 1.55, whiteSpace: 'pre-wrap', marginBottom: 8, fontFamily: '-apple-system, Helvetica, Arial, sans-serif' }}>{post.caption}</div>
            )}
            {post.hashtags && (
              <div style={{ fontSize: 14, color: FB_BLUE, marginBottom: 14 }}>{post.hashtags}</div>
            )}

            <div style={{ padding: '10px 0', borderTop: `1px solid ${FB_BORDER}`, borderBottom: `1px solid ${FB_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: FB_SECONDARY }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ThumbsUp size={11} /></span>
                <span>{formatCount(engagement.likes)}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span>{formatMetricLabel(engagement.comments, 'comment')}</span>
                <span>{formatMetricLabel(engagement.shares, 'share')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 2, padding: '4px 0 10px', borderBottom: `1px solid ${FB_BORDER}` }}>
              {[{ icon: <ThumbsUp size={17} />, label: "J'aime" }, { icon: <MessageCircle size={17} />, label: 'Commenter' }, { icon: <Share2 size={17} />, label: 'Partager' }].map(({ icon, label }) => (
                <button key={label} type="button"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'transparent', color: FB_SECONDARY, padding: '9px 4px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = FB_BG }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  {icon}{label}
                </button>
              ))}
            </div>

            <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{comment.author.slice(0, 1)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ background: FB_BG, borderRadius: 16, padding: '8px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: FB_TEXT }}>{comment.author}</div>
                      <div style={{ marginTop: 3, fontSize: 13, color: FB_TEXT, lineHeight: 1.45 }}>{comment.text}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '3px 10px 0', fontSize: 12, color: FB_SECONDARY }}>
                      <span style={{ cursor: 'pointer', fontWeight: 600 }}>J'aime</span>
                      <span style={{ cursor: 'pointer', fontWeight: 600 }}>Répondre</span>
                      <span>{comment.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${FB_BORDER}`, display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>V</div>
            <div style={{ flex: 1, borderRadius: 999, background: FB_BG, padding: '10px 14px', color: '#8a8d91', fontSize: 14, cursor: 'text' }}>Écrire un commentaire...</div>
          </div>
        </div>
      </div>

      <button type="button" onClick={onClose}
        style={{ position: 'absolute', top: '2vh', right: '2vw', zIndex: 10000, width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}>
        <X size={20} />
      </button>
    </div>
  )
}