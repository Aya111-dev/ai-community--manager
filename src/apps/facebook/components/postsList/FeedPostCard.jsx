import { useState } from 'react'
import { Globe, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { FB_BLUE, FB_BG, FB_BORDER, FB_TEXT, FB_SECONDARY } from './constants'
import { formatRelative, formatCount, formatMetricLabel, getPostStyle, getPostComments, getPostEngagement } from './utils'
import { PostActions } from './PostActions'
import { renderFeedMedia } from './CarouselComponents'

export function FeedPostCard({ post, deviceView, compact = false, expanded = false, onEditPost, onDeletePost, onOpen }) {
  const isMobile = deviceView === 'Mobile'
  const styles = getPostStyle(post, compact, isMobile, expanded)
  const [expanded_text, setExpandedText] = useState(false)
  const caption = post.caption || ''
  const isLong = caption.length > 180
  const displayCaption = (!isLong || expanded_text) ? caption : caption.slice(0, 180) + '...'
  const comments = getPostComments(post)
  const engagement = getPostEngagement(post, comments)
  const canOpen = typeof onOpen === 'function' && !expanded

  return (
    <div onClick={canOpen ? e => onOpen(post, e) : undefined} style={{ ...styles.container, cursor: canOpen ? 'pointer' : 'default', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 8px', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>V</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: FB_TEXT, lineHeight: 1.2 }}>Vous</div>
          <div style={{ fontSize: 11, color: FB_SECONDARY, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span>{formatRelative(post.updatedAt || post.createdAt)}</span>
            <span>·</span>
            <Globe size={11} color={FB_SECONDARY} />
          </div>
        </div>
        <PostActions post={post} onEditPost={onEditPost} onDeletePost={onDeletePost} />
      </div>

      {/* Caption */}
      {caption && (
        <div style={{ padding: '0 12px 8px', fontFamily: '-apple-system, Helvetica, Arial, sans-serif', fontSize: 15, color: FB_TEXT, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {displayCaption}
          {isLong && !expanded_text && (
            <span onClick={e => { e.stopPropagation(); setExpandedText(true) }} style={{ color: FB_SECONDARY, fontWeight: 600, cursor: 'pointer' }}> Voir plus</span>
          )}
        </div>
      )}

      {post.hashtags && (
        <div style={{ padding: '0 12px 8px', fontSize: 14, color: FB_BLUE, fontFamily: '-apple-system, Helvetica, Arial, sans-serif' }}>{post.hashtags}</div>
      )}

      {/* Media */}
      {renderFeedMedia(post, styles)}

      {/* Reaction count bar */}
      {post.status !== 'draft' && (
        <div style={{ padding: '8px 12px', fontSize: 13, color: FB_SECONDARY, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ width: 18, height: 18, background: FB_BLUE, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ThumbsUp size={10} color="#fff" />
            </span>
            <span style={{ fontSize: 13, color: FB_SECONDARY, whiteSpace: 'nowrap' }}>{formatCount(engagement.likes)}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 13, color: FB_SECONDARY, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{formatMetricLabel(engagement.comments, 'comment')}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{formatMetricLabel(engagement.shares, 'share')}</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: FB_BORDER, margin: '0 12px' }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', padding: '2px 4px' }}>
        {[
          { icon: <ThumbsUp size={18} />, label: 'Like' },
          { icon: <MessageCircle size={18} />, label: 'Comment' },
          { icon: <Share2 size={18} />, label: 'Share' },
        ].map(({ icon, label }, index) => (
          <button key={label} onClick={e => e.stopPropagation()}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: FB_SECONDARY, fontSize: 13, fontWeight: 600, padding: '10px 4px', background: 'transparent', cursor: 'pointer', borderRadius: 4, transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = FB_BG }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  )
}
