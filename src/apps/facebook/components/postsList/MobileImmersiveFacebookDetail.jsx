import { ChevronLeft, Globe, Pencil, Trash2, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { FB_BLUE, FB_BORDER, FB_TEXT, FB_SECONDARY } from './constants'
import { formatMobileDetailDate, formatCount, formatMetricLabel, getMediaOverlayData, getMediaPresentation, getPostComments, getPostEngagement, getPrimaryMedia, getStoryBackground } from './utils'

export function MobileImmersiveFacebookDetail({ post, onBack, onEditPost, onDeletePost }) {
  const comments = getPostComments(post)
  const engagement = getPostEngagement(post, comments)
  const profileInitial = (post.user?.name || 'Vous').slice(0, 1).toUpperCase()
  const profileName = post.user?.name || 'Vous'
  const profileDate = post.updatedAt || post.createdAt
  const profileLink = post.link || ''
  const isStory = post.type === 'story'
  const isReel = post.type === 'reel'
  const primaryMedia = getPrimaryMedia(post)
  const isVideo = post.type === 'video' || isReel || primaryMedia.type === 'video'
  const mediaHeight = isStory || isReel ? '100vh' : 'min(72vh, 680px)'
  const mediaStyle = isStory ? primaryMedia.presentation : getMediaPresentation(post)
  const overlay = getMediaOverlayData(post)
  const storyBackground = getStoryBackground(post.style)

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#000', minHeight: '100vh', color: '#fff', position: 'relative' }}>
      <div style={{ position: 'relative', minHeight: '100vh', background: '#000' }}>
        <div style={{ height: mediaHeight, minHeight: isStory || isReel ? '100vh' : 420, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
          {primaryMedia.src ? (
            isVideo ? (
              <video
                src={primaryMedia.src}
                style={{ width: '100%', height: '100%', objectFit: isStory || isReel ? mediaStyle.objectFit : 'contain', objectPosition: mediaStyle.objectPosition, transform: mediaStyle.transform }}
                controls={!isStory && !isReel}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : renderEditedImage(primaryMedia, mediaStyle, isStory, isReel)
          ) : isStory ? <div style={{ position: 'absolute', inset: 0, background: storyBackground }} /> : null}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: isStory || isReel ? 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.14) 18%, rgba(0,0,0,0.08) 54%, rgba(0,0,0,0.72) 80%, rgba(0,0,0,0.96) 100%)' : 'linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.82) 100%)', pointerEvents: 'none' }} />
        {overlay.overlayText && (
          <div style={{ position: 'absolute', left: `${overlay.overlayTextX}%`, top: `${overlay.overlayTextY}%`, transform: 'translate(-50%, -50%)', zIndex: 4, color: overlay.overlayTextColor, fontFamily: overlay.overlayTextFontFamily, fontSize: 20, fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.45)', textAlign: 'center', maxWidth: '82%' }}>
            {overlay.overlayText}
          </div>
        )}

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4, padding: '14px 14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <button
              type="button"
              onClick={onBack}
              style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.46)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
              aria-label="Back"
            >
              <ChevronLeft size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => onEditPost?.(post)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.46)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }} aria-label="Modifier">
                <Pencil size={18} />
              </button>
              <button type="button" onClick={() => onDeletePost?.(post.id)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.46)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }} aria-label="Supprimer">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          {isStory && (
            <div style={{ marginTop: 14, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', borderRadius: 999, background: '#fff' }} />
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4, padding: isStory || isReel ? '0 14px 18px' : '0 18px 22px', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0, border: '1px solid rgba(255,255,255,0.24)' }}>{profileInitial}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{profileName}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>{formatMobileDetailDate(profileDate)}</span>
                  <Globe size={12} color="rgba(255,255,255,0.82)" />
                </div>
              </div>
              {isReel && (
                <button type="button" style={{ borderRadius: 999, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.72)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                  Follow
                </button>
              )}
            </div>

            {(post.caption || post.hashtags || profileLink || isStory || isReel) && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {(post.caption || post.hashtags || profileLink) && (
                    <>
                      {post.caption && (
                        <div style={{ fontSize: 16, lineHeight: 1.55, color: '#fff', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          {post.caption}
                        </div>
                      )}
                      {post.hashtags && (
                        <div style={{ marginTop: post.caption ? 8 : 0, fontSize: 15, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          {post.hashtags}
                        </div>
                      )}
                      {profileLink && (
                        <div style={{ marginTop: 10, fontSize: 17, color: '#60a5fa', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {profileLink}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {(isReel || isStory) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', flexShrink: 0, paddingBottom: 2 }}>
                    {[
                      { icon: <ThumbsUp size={22} />, count: formatCount(engagement.likes) },
                      { icon: <MessageCircle size={22} />, count: formatCount(engagement.comments) },
                      { icon: <Share2 size={22} />, count: formatCount(engagement.shares) },
                    ].map(({ icon, count }, index) => (
                      <div key={`${count}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <button type="button" style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.34)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                          {icon}
                        </button>
                        <span style={{ fontSize: 11, fontWeight: 700, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isStory && !isReel && (
              <>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.82)', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: FB_BLUE, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ThumbsUp size={11} color="#fff" />
                    </span>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatCount(engagement.likes)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatMetricLabel(engagement.comments, 'comment')}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatMetricLabel(engagement.shares, 'share')}</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  {[{ icon: <ThumbsUp size={18} />, label: 'Like' }, { icon: <MessageCircle size={18} />, label: 'Comment' }, { icon: <Share2 size={18} />, label: 'Share' }].map(({ icon, label }) => (
                    <button key={label} type="button" style={{ flex: 1, minHeight: 48, borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                      {icon}
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}