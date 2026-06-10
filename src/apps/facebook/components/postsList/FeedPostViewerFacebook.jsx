import { ThumbsUp, MessageCircle, Share2, Globe, X } from 'lucide-react'
import { FB_BLUE, FB_BORDER, FB_TEXT, FB_SECONDARY } from './constants'
import { formatRelative, formatCount, formatMetricLabel, getPostStyle, getPostComments, getPostEngagement } from './utils'
import { PostActions } from './PostActions'
import { renderFeedMedia } from './CarouselComponents'
import { FeedPostCard } from './FeedPostCard'

export function TopNavBar() {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${FB_BORDER}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: FB_BLUE }}>facebook</span>
    </div>
  )
}

export function FeedPostViewerFacebook({ post, onClose, onEditPost, onDeletePost, stacked = false, pageMode = false, showCloseButton = true, deviceView = 'Desktop' }) {
  const comments = getPostComments(post)
  const engagement = getPostEngagement(post, comments)
  const styles = getPostStyle(post, false, false, true)
  const handleEdit = (v) => { onClose(); onEditPost(v) }
  const handleDelete = (id) => { onDeletePost(id); onClose() }
  const forceMobileView = deviceView === 'Mobile'
  const viewerMaxWidth = forceMobileView ? 'min(100%, 320px)' : 'min(100%, 640px)'
  const viewerHeight = forceMobileView ? 'auto' : 'min(56vh, 500px)'
  const mediaColumn = forceMobileView ? '1fr' : 'minmax(0, 0.82fr) minmax(220px, 280px)'
  return (
    <div onClick={e => e.stopPropagation()}
      style={{ width: '100%', maxWidth: stacked ? '100%' : viewerMaxWidth, height: pageMode ? 'auto' : (stacked ? 'auto' : viewerHeight), maxHeight: pageMode ? 'none' : (stacked ? 'calc(100vh - 24px)' : 'calc(100vh - 40px)'), background: '#000', borderRadius: pageMode ? 16 : (stacked ? 16 : 20), overflow: 'hidden', display: 'grid', gridTemplateColumns: post.media?.length ? (stacked ? '1fr' : mediaColumn) : '1fr', boxShadow: pageMode ? '0 12px 24px rgba(15,23,42,0.12)' : '0 32px 100px rgba(0,0,0,0.46)' }}>
      {post.media?.length > 0 && (
        <div style={{ position: 'relative', background: pageMode ? '#f3f4f6' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, minHeight: 0, padding: stacked ? '12px 0 0' : '10px 10px 8px' }}>
          {showCloseButton && (
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
              <button type="button" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }} aria-label="Fermer"><X size={20} /></button>
            </div>
          )}
          {renderFeedMedia(post, styles, { immersive: true, detailMode: pageMode })}
        </div>
      )}
      <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: post.media?.length && !stacked ? `1px solid ${FB_BORDER}` : 'none', maxHeight: stacked ? 'min(40vh, 320px)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: stacked ? '12px 12px 10px' : '14px 14px 12px', borderBottom: `1px solid ${FB_BORDER}` }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>V</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: FB_TEXT }}>Vous</div>
            <div style={{ fontSize: 12, color: FB_SECONDARY, lineHeight: 1.5 }}>{formatRelative(post.updatedAt || post.createdAt)}<br />· Public</div>
          </div>
          <PostActions post={post} onEditPost={handleEdit} onDeletePost={handleDelete} />
          {showCloseButton && (
            <button type="button" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0f2f5', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} aria-label="Fermer"><X size={18} /></button>
          )}
        </div>
        <div style={{ padding: stacked ? '12px 12px 8px' : '14px 14px 10px', overflowY: 'auto', flex: 1 }}>
          {post.caption && <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, color: FB_TEXT, fontSize: 15, fontFamily: post.style?.fontFamily ?? '-apple-system, Helvetica, Arial, sans-serif' }}>{post.caption}</div>}
          {post.hashtags && <div style={{ marginTop: 10, color: FB_BLUE, fontSize: 14, lineHeight: 1.5 }}>{post.hashtags}</div>}
          <div style={{ marginTop: 18, paddingBottom: 14, borderBottom: `1px solid ${FB_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: FB_SECONDARY, gap: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}><ThumbsUp size={12} /></span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatCount(engagement.likes)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <span style={{ whiteSpace: 'nowrap' }}>{formatMetricLabel(engagement.comments, 'comment')}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatMetricLabel(engagement.shares, 'share')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '10px 0', borderBottom: `1px solid ${FB_BORDER}` }}>
            {[{ icon: <ThumbsUp size={18} />, label: 'Like' }, { icon: <MessageCircle size={18} />, label: 'Comment' }, { icon: <Share2 size={18} />, label: 'Share' }].map(({ icon, label }) => (
              <button key={label} type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', color: FB_SECONDARY, padding: '10px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{icon}{label}</button>
            ))}
          </div>
          <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{comment.author.slice(0, 1)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ background: '#f0f2f5', borderRadius: 18, padding: '10px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: FB_TEXT }}>{comment.author}</div>
                    <div style={{ marginTop: 4, fontSize: 14, color: FB_TEXT, lineHeight: 1.45 }}>{comment.text}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, padding: '4px 12px 0', fontSize: 12, color: FB_SECONDARY }}><span>Like</span><span>Reply</span><span>{comment.time}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: stacked ? '10px 12px 12px' : '12px 14px 14px', borderTop: `1px solid ${FB_BORDER}`, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>V</div>
          <div style={{ flex: 1, borderRadius: 999, background: '#f0f2f5', padding: '12px 14px', color: '#8a8d91', fontSize: 14 }}>Write a comment...</div>
        </div>
      </div>
    </div>
  )
}

export function MobilePostDetailFacebook({ post, onBack, onEditPost, onDeletePost }) {
  const comments = getPostComments(post)

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '12px 0 24px' }}>
      <div style={{ borderRadius: 28, overflow: 'hidden', border: `1px solid ${FB_BORDER}`, boxShadow: '0 18px 42px rgba(15,23,42,0.14)', background: '#fff' }}>
        <TopNavBar />
        <div style={{ padding: '10px 0 0', background: '#f0f2f5' }}>
          <FeedPostCard post={post} deviceView="Mobile" expanded onEditPost={onEditPost} onDeletePost={onDeletePost} />
          <div style={{ background: '#fff', borderTop: `6px solid ${'#f0f2f5'}`, padding: '14px 14px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {comment.author.slice(0, 1)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ background: '#f0f2f5', borderRadius: 18, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: FB_TEXT }}>{comment.author}</div>
                      <div style={{ marginTop: 4, fontSize: 14, color: FB_TEXT, lineHeight: 1.45 }}>{comment.text}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '4px 12px 0', fontSize: 12, color: FB_SECONDARY }}>
                      <span>Like</span>
                      <span>Reply</span>
                      <span>{comment.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: FB_BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>V</div>
              <div style={{ flex: 1, borderRadius: 999, background: '#f0f2f5', padding: '12px 14px', color: '#8a8d91', fontSize: 14 }}>Write a comment...</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: FB_TEXT, border: `1px solid ${FB_BORDER}`, borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>
          ← Retour aux posts
        </button>
      </div>
    </div>
  )
}
