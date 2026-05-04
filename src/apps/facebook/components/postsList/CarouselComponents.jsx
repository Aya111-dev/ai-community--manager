import { useState } from 'react'
import { ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { FB_BLUE, FB_BG, FB_BORDER, FB_SECONDARY } from './constants'
import { getMediaOverlayData, getMediaPresentation, getPostComments, getPostEngagement, formatMetricLabel } from './utils'

function renderViewportMedia(item, mediaStyle, options = {}) {
  const { immersive = false, detailMode = false } = options
  const viewport = mediaStyle.viewport
  const overlayLayers = mediaStyle.textLayers ?? []
  const widthFactor = 100 / Math.max(viewport.width, 1)
  const heightFactor = 100 / Math.max(viewport.height, 1)
  const mediaNode = item.type === 'video'
    ? (
      <video
        src={item.url}
        style={{
          position: 'absolute',
          width: `${widthFactor}%`,
          height: `${heightFactor}%`,
          left: `${-(viewport.x / viewport.width) * 100}%`,
          top: `${-(viewport.y / viewport.height) * 100}%`,
          objectFit: immersive ? (detailMode ? mediaStyle.objectFit : 'contain') : mediaStyle.objectFit,
          objectPosition: mediaStyle.objectPosition,
          transform: mediaStyle.transform,
        }}
        controls={immersive}
        autoPlay={immersive}
        muted
        loop
        playsInline
      />
    )
    : (
      <img
        src={item.url}
        alt=""
        style={{
          position: 'absolute',
          width: `${widthFactor}%`,
          height: `${heightFactor}%`,
          left: `${-(viewport.x / viewport.width) * 100}%`,
          top: `${-(viewport.y / viewport.height) * 100}%`,
          objectFit: immersive ? (detailMode ? mediaStyle.objectFit : 'contain') : mediaStyle.objectFit,
          objectPosition: mediaStyle.objectPosition,
          transform: mediaStyle.transform,
        }}
      />
    )

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${viewport.x}%`,
          top: `${viewport.y}%`,
          width: `${viewport.width}%`,
          height: `${viewport.height}%`,
          overflow: 'hidden',
        }}
      >
        {mediaNode}
      </div>
      {overlayLayers.map(layer => (
        <div
          key={layer.id}
          style={{
            position: 'absolute',
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: layer.zIndex,
            color: layer.color,
            fontSize: immersive ? Math.max(layer.fontSize, 18) : Math.max(layer.fontSize * 0.72, 12),
            fontWeight: 800,
            lineHeight: 1.2,
            textShadow: '0 2px 10px rgba(0,0,0,0.45)',
            textAlign: 'center',
            maxWidth: '85%',
            whiteSpace: 'pre-wrap',
          }}
        >
          {layer.content}
        </div>
      ))}
    </>
  )
}

export function CarouselSlides({ post, immersive = false, detailMode = false }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const media = post.media ?? []
  // useEffect is not needed here as it was in the original - keeping as-is
  // Original used useEffect(() => { setActiveIndex(0) }, [post.id])
  // Keeping that import
  const canNavigate = media.length > 1
  const frameHeight = immersive ? (detailMode ? 'min(42vh, 360px)' : 'min(56vh, 520px)') : 280
  const goPrev = (e) => { e?.stopPropagation(); setActiveIndex(c => (c === 0 ? media.length - 1 : c - 1)) }
  const goNext = (e) => { e?.stopPropagation(); setActiveIndex(c => (c === media.length - 1 ? 0 : c + 1)) }

  if (media.length === 0) return null
  const currentMedia = media[activeIndex]
  const mediaStyle = getMediaPresentation(currentMedia, post.style)
  const overlay = getMediaOverlayData(post)

  return (
    <div style={{ background: immersive ? (detailMode ? '#f3f4f6' : '#18191a') : '#f3f4f6', padding: 0 }}>
      <div style={{ position: 'relative', height: frameHeight, background: immersive ? (detailMode ? '#f3f4f6' : '#18191a') : '#e5e7eb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentMedia?.url ? renderViewportMedia(currentMedia, mediaStyle, { immersive, detailMode }) : null}
        {overlay.overlayText && (
          <div style={{ position: 'absolute', left: `${overlay.overlayTextX}%`, top: `${overlay.overlayTextY}%`, transform: 'translate(-50%, -50%)', zIndex: 2, color: '#fff', fontSize: immersive ? 18 : 14, fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.45)', textAlign: 'center', maxWidth: '85%' }}>
            {overlay.overlayText}
          </div>
        )}
        {canNavigate && (
          <>
            <button type="button" onClick={goPrev} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Précédent"><ChevronLeft size={18} /></button>
            <button type="button" onClick={goNext} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Suivant"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
      {canNavigate && !immersive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
            {media.map((item, index) => (
              <button key={`${post.id}-${index}`} type="button" onClick={e => { e.stopPropagation(); setActiveIndex(index) }} style={{ width: 44, height: 44, minWidth: 44, borderRadius: 8, overflow: 'hidden', background: '#e5e7eb', border: index === activeIndex ? `2px solid ${FB_BLUE}` : '2px solid transparent', cursor: 'pointer', padding: 0 }}>
                {item?.url ? (
                  <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: FB_SECONDARY, flexShrink: 0 }}>{activeIndex + 1} / {media.length}</div>
        </div>
      )}
    </div>
  )
}

export function CarouselPreviewGrid({ post, styles, deviceView = 'Desktop' }) {
  const media = post.media ?? []
  if (media.length === 0) return null
  const comments = getPostComments(post)
  const engagement = getPostEngagement(post, comments)
  const isMobile = deviceView === 'Mobile'

  if (isMobile) {
    return (
      <div style={{ background: '#fff' }}>
        {media.map((item, index) => (
          <div key={`${post.id}-mobile-preview-${index}`} style={{ borderTop: index === 0 ? 'none' : `6px solid ${FB_BG}` }}>
            <div style={{ position: 'relative', background: '#eef2f7' }}>
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, background: 'rgba(17,24,39,0.58)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                {index + 1}/{media.length}
              </div>
              <div style={{ height: Math.max(260, styles.mediaHeight + 40), background: '#dfe3e8', overflow: 'hidden' }}>
                {item?.url ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div style={{ position: 'absolute', left: `${getMediaPresentation(item, post.style).viewport.x}%`, top: `${getMediaPresentation(item, post.style).viewport.y}%`, width: `${getMediaPresentation(item, post.style).viewport.width}%`, height: `${getMediaPresentation(item, post.style).viewport.height}%`, overflow: 'hidden' }}>
                      <img src={item.url} alt="" style={{ position: 'absolute', width: `${100 / Math.max(getMediaPresentation(item, post.style).viewport.width, 1)}%`, height: `${100 / Math.max(getMediaPresentation(item, post.style).viewport.height, 1)}%`, left: `${-(getMediaPresentation(item, post.style).viewport.x / getMediaPresentation(item, post.style).viewport.width) * 100}%`, top: `${-(getMediaPresentation(item, post.style).viewport.y / getMediaPresentation(item, post.style).viewport.height) * 100}%`, objectFit: getMediaPresentation(item, post.style).objectFit, objectPosition: getMediaPresentation(item, post.style).objectPosition, transform: getMediaPresentation(item, post.style).transform }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div style={{ padding: '8px 12px 6px', fontSize: 13, color: FB_SECONDARY, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 18, height: 18, background: FB_BLUE, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThumbsUp size={10} color="#fff" />
                </span>
                <span>{Math.max(1, Math.round(engagement.likes / media.length))}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>{formatMetricLabel(Math.max(1, Math.round(engagement.comments / media.length)), 'comment')}</span>
                <span>{formatMetricLabel(Math.max(1, Math.round(engagement.shares / media.length)), 'share')}</span>
              </div>
            </div>
            <div style={{ height: 1, background: FB_BORDER, margin: '0 12px' }} />
            <div style={{ display: 'flex', padding: '2px 4px 6px' }}>
              {[
                { icon: <ThumbsUp size={18} />, label: 'Like' },
                { icon: <MessageCircle size={18} />, label: 'Comment' },
                { icon: <Share2 size={18} />, label: 'Share' },
              ].map(({ icon, label }) => (
                <button key={`${post.id}-${index}-${label}`} type="button"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: FB_SECONDARY, fontSize: 13, fontWeight: 600, padding: '10px 4px', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: '#f0f2f5' }}>
      {media.slice(0, 4).map((item, index) => {
        const showMore = media.length > 4 && index === 3
        return (
          <div key={`${post.id}-preview-${index}`} style={{ position: 'relative', height: Math.max(120, styles.mediaHeight / 2), background: '#dfe3e8', overflow: 'hidden' }}>
            {item?.url ? (
              <img src={item.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: getMediaPresentation(item, post.style).objectFit || 'cover', objectPosition: getMediaPresentation(item, post.style).objectPosition }} />
            ) : null}
            {showMore && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>+{media.length - 3}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function renderFeedMedia(post, styles, options = {}) {
  const { immersive = false, detailMode = false } = options
  if (!post.media || post.media.length === 0) return null
  const mediaStyle = getMediaPresentation(post.media[0], post.style)
  const overlay = getMediaOverlayData(post)
  if (post.type === 'carousel' || post.media.length > 1) {
    return immersive ? <CarouselSlides post={post} immersive detailMode={detailMode} /> : <CarouselPreviewGrid post={post} styles={styles} deviceView={options.deviceView ?? 'Desktop'} />
  }
  return (
    <div style={{ position: 'relative', background: immersive ? (detailMode ? '#f3f4f6' : '#18191a') : '#e4e6eb', height: immersive ? (detailMode ? 'min(42vh, 360px)' : '100%') : styles.mediaHeight, minHeight: immersive ? (detailMode ? 260 : 360) : undefined, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {post.media[0]?.url && (
        <div style={{ position: 'absolute', left: `${mediaStyle.frame.left}%`, right: `${mediaStyle.frame.right}%`, top: `${mediaStyle.frame.top}%`, bottom: `${mediaStyle.frame.bottom}%`, overflow: 'hidden' }}>
          {post.type === 'video'
            ? <video src={post.media[0].url} style={{ width: '100%', height: '100%', objectFit: immersive ? (detailMode ? mediaStyle.objectFit : 'contain') : mediaStyle.objectFit, objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform }} controls autoPlay muted loop playsInline />
            : <img src={post.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: immersive ? (detailMode ? mediaStyle.objectFit : 'contain') : mediaStyle.objectFit, objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform }} />}
        </div>
      )}
      {overlay.overlayText && (
        <div style={{ position: 'absolute', left: `${overlay.overlayTextX}%`, top: `${overlay.overlayTextY}%`, transform: 'translate(-50%, -50%)', zIndex: 2, color: '#fff', fontSize: immersive ? 18 : 14, fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.45)', textAlign: 'center', maxWidth: '85%' }}>
          {overlay.overlayText}
        </div>
      )}
    </div>
  )
}