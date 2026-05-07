import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { FB_BLUE, FB_BORDER, FB_TEXT, STORY_CARD_WIDTH, STORY_CARD_HEIGHT } from './constants'
import { getMediaOverlayData, getPostEngagement, getPrimaryMedia, getStoryBackground } from './utils'
import { PostActions } from './PostActions'

export function StoryCard({ post, onEditPost, onDeletePost, onOpen, expanded = false }) {
  const canOpen = typeof onOpen === 'function' && !expanded
  const primaryMedia = getPrimaryMedia(post)
  const mediaUrl = primaryMedia.src
  const isVideo = primaryMedia.type === 'video'
  const [mediaFailed, setMediaFailed] = useState(false)
  const [mediaReady, setMediaReady] = useState(!isVideo)
  const showFallback = !mediaUrl || mediaFailed
  const mediaStyle = primaryMedia.presentation
  const overlay = getMediaOverlayData(post)
  const storyBackground = getStoryBackground(post.style)

  useEffect(() => {
    setMediaFailed(false)
    setMediaReady(!isVideo)
  }, [isVideo, mediaUrl])

  return (
    <div onClick={canOpen ? e => onOpen(post, e) : undefined}
      style={{ width: expanded ? 360 : STORY_CARD_WIDTH, height: expanded ? 640 : STORY_CARD_HEIGHT, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: canOpen ? 'pointer' : 'default', background: '#000', boxShadow: expanded ? '0 20px 50px rgba(0,0,0,0.35)' : '0 4px 14px rgba(15,23,42,0.12)', border: expanded ? 'none' : '1px solid rgba(228,230,235,0.95)' }}>
      <div style={{ position: 'absolute', inset: 0, background: storyBackground, zIndex: 0, opacity: showFallback ? 1 : 0, transition: 'opacity 0.2s ease' }} />
      {!showFallback
        ? isVideo
          ? <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: mediaStyle.objectFit, objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform, position: 'relative', zIndex: 1, opacity: mediaReady ? 1 : 0.01, transition: 'opacity 0.2s ease' }} muted autoPlay loop playsInline preload="metadata" onLoadedData={() => setMediaReady(true)} onCanPlay={() => setMediaReady(true)} onError={() => setMediaFailed(true)} />
          : <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: mediaStyle.objectFit, objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform }} onError={() => setMediaFailed(true)} />
        : null}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 55%)' }} />
      {!expanded && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 12 }}>
          <PostActions post={post} onEditPost={onEditPost} onDeletePost={onDeletePost} light />
        </div>
      )}
      {overlay.overlayText && (
        <div style={{ position: 'absolute', left: `${overlay.overlayTextX}%`, top: `${overlay.overlayTextY}%`, transform: 'translate(-50%, -50%)', zIndex: 10, fontSize: 11, fontWeight: 800, color: overlay.overlayTextColor, fontFamily: overlay.overlayTextFontFamily, lineHeight: 1.2, textShadow: '0 2px 6px rgba(0,0,0,0.35)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'center', maxWidth: '78%' }}>
          {overlay.overlayText}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 6px rgba(0,0,0,0.35)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.user?.name || 'Vous'}
        </div>
      </div>
    </div>
  )
}

export function CreateStoryCard({ isMobile = true }) {
  const w = isMobile ? 112 : 120
  const h = isMobile ? 198 : 208
  return (
    <div style={{ width: w, height: h, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#fff', border: `1px solid ${FB_BORDER}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: FB_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26 }}>+</div>
      </div>
      <div style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: FB_TEXT, lineHeight: 1.3 }}>Créer une story</span>
      </div>
    </div>
  )
}

// ✅ Updated StoryCreateCard — full photo card with + button and label, matching Facebook
export function StoryCreateCard({ isMobile = true, onCreateStory, userAvatarUrl }) {
  return (
    <button
      type="button"
      onClick={onCreateStory}
      style={{
        width: STORY_CARD_WIDTH,
        height: STORY_CARD_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        background: '#c4c4c4',
        border: `1px solid ${FB_BORDER}`,
        boxShadow: '0 4px 14px rgba(15,23,42,0.08)',
        padding: 0,
        cursor: 'pointer',
        display: 'block',
      }}
    >
      {/* Full-card photo — real avatar when available, gradient fallback */}
      {userAvatarUrl
        ? <img src={userAvatarUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #a8b8cc 0%, #7a90a8 100%)' }} />
      }

      {/* White label strip at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 52,
        background: '#fff',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 8px 10px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: FB_TEXT, lineHeight: 1.25 }}>
          Créer une<br />story
        </span>
      </div>

      {/* Blue + button overlapping the photo and the white strip */}
      <div style={{
        position: 'absolute',
        bottom: 42,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: FB_BLUE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 26,
        fontWeight: 400,
        lineHeight: 1,
        border: '3px solid #fff',
        boxShadow: '0 4px 12px rgba(24,119,242,0.35)',
        zIndex: 2,
      }}>+</div>
    </button>
  )
}

export function ReelCard({ post, onEditPost, onDeletePost, onOpen }) {
  const videoRef = useRef(null)
  const [thumbReady, setThumbReady] = useState(false)
  const engagement = getPostEngagement(post)
  const canOpen    = typeof onOpen === 'function'

  const isVideo =
    post.type === 'video' ||
    post.type === 'reel'  ||
    post.media?.[0]?.type === 'video'

  const mediaUrl = post.media?.[0]?.url

  useEffect(() => {
    const v = videoRef.current
    if (!v || !mediaUrl) return
    const onLoaded = () => {
      v.currentTime = 0.1
    }
    const onSeeked = () => {
      setThumbReady(true)
    }
    v.addEventListener('loadeddata', onLoaded)
    v.addEventListener('seeked', onSeeked)
    return () => {
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('seeked', onSeeked)
    }
  }, [mediaUrl])

  const W = 110, H = 196

  return (
    <div
      onClick={canOpen ? () => onOpen(post) : undefined}
      style={{
        width: W, height: H,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        cursor: canOpen ? 'pointer' : 'default',
        background: '#111',
        boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
      }}
    >
      {isVideo && mediaUrl && (
        <video
          ref={videoRef}
          src={mediaUrl}
          muted
          playsInline
          preload="auto"
          controls={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: thumbReady ? 1 : 0,
            transition: 'opacity 0.3s',
            background: '#000',
          }}
        />
      )}

      {!isVideo && mediaUrl && (
        <img
          src={mediaUrl} alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }}
        />
      )}

      {(!thumbReady || !mediaUrl) && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mediaUrl && !thumbReady && (
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.6)',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
          {!mediaUrl && (
            <span style={{ fontSize: 24, opacity: 0.4 }}>▶</span>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
      }} />

      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 2,
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(0,0,0,0.52)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: 10, marginLeft: 2 }}>▶</span>
      </div>

      <div style={{ position: 'absolute', top: 6, right: 4, zIndex: 4, display: 'flex', gap: 2 }}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onEditPost(post) }}
          style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', backdropFilter: 'blur(6px)' }}
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDeletePost(post.id) }}
          style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', backdropFilter: 'blur(6px)' }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}