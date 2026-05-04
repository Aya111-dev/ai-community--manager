import { useState } from 'react'
import { Globe, MessageCircle, Pencil, Repeat2, Send, ThumbsUp, Trash2, ArrowLeft } from 'lucide-react'
import { LI_BG, CARD_BG, CARD_BORDER, TEXT, SUBTLE, ACTION, LINKEDIN_BLUE, MY_NAME, MY_AVATAR_URL, REACTIONS } from './constants'
import { formatRelative, formatCount, getPostEngagement } from './utils'

export function PostActions({ post, onEditPost, onDeletePost }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEditPost(post) }}
        aria-label="Modifier" title="Modifier"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
          border: `1px solid ${CARD_BORDER}`,
          background: '#f3f2ef', color: SUBTLE, cursor: 'pointer',
        }}
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDeletePost(post.id) }}
        aria-label="Supprimer" title="Supprimer"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
          border: `1px solid ${CARD_BORDER}`,
          background: '#f3f2ef', color: '#94a3b8', cursor: 'pointer',
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export function PageAvatar({ size = 40 }) {
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: Math.round(size * 0.18),
        background: 'linear-gradient(135deg, #0a66c2 0%, #0f7ddb 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: Math.round(size * 0.36), flexShrink: 0, overflow: 'hidden',
      }}
    >
      {MY_AVATAR_URL
        ? <img src={MY_AVATAR_URL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : 'VP'}
    </div>
  )
}

export function ReactionBadge({ background, borderColor, icon }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background, border: `1px solid ${borderColor}`, marginLeft: -4, boxSizing: 'border-box',
    }}>
      {icon}
    </span>
  )
}

export function ReactionPopup({ onSelect }) {
  return (
    <div
      style={{
        position: 'absolute', bottom: '110%', left: 0,
        background: '#fff', borderRadius: 40,
        boxShadow: '0 6px 28px rgba(0,0,0,0.22)',
        border: `1px solid ${CARD_BORDER}`,
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
        zIndex: 50, whiteSpace: 'nowrap',
        animation: 'liPopup 0.18s ease',
      }}
      onClick={e => e.stopPropagation()}
    >
      <style>{`
        @keyframes liPopup { from { opacity:0; transform:scale(0.7) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .li-rb { transition: transform 0.15s; display:flex; flex-direction:column; align-items:center; gap:4px; background:none; border:none; cursor:pointer; padding:0; }
        .li-rb:hover { transform: scale(1.3) translateY(-6px); }
        .li-rb .li-rc { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:26px; line-height:1; }
        .li-rb .li-rl { font-size:10px; font-weight:600; color:#6f7780; }
      `}</style>
      {REACTIONS.map(r => (
        <button key={r.label} className="li-rb" type="button" onClick={() => onSelect(r)}>
          <div className="li-rc" style={{ background: r.bg }}>{r.emoji}</div>
          <span className="li-rl">{r.label}</span>
        </button>
      ))}
    </div>
  )
}

export function PostFooter({ engagement }) {
  const [showReactions, setShowReactions] = useState(false)
  const [activeReaction, setActiveReaction] = useState(null)
  const likeTimerRef = useState(null)

  const handleLikeMouseEnter = () => {
    likeTimerRef[0] = setTimeout(() => setShowReactions(true), 400)
  }
  const handleLikeMouseLeave = () => {
    clearTimeout(likeTimerRef[0])
  }
  const handleLikeClick = (e) => {
    e.stopPropagation()
    if (!showReactions) {
      setActiveReaction(activeReaction ? null : REACTIONS[0])
    }
    setShowReactions(false)
  }
  const handleReactionSelect = (r) => {
    setActiveReaction(r)
    setShowReactions(false)
  }

  const otherActions = [
    { icon: <MessageCircle size={18} strokeWidth={1.8} />, label: 'Comment' },
    { icon: <Repeat2 size={18} strokeWidth={1.8} />, label: 'Repost' },
    { icon: <Send size={18} strokeWidth={1.8} />, label: 'Send' },
  ]

  return (
    <>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: SUBTLE, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
            <ReactionBadge background="#378fe9" borderColor="#fff" icon={<ThumbsUp size={9} color="#fff" fill="#fff" />} />
            <ReactionBadge background="#df704d" borderColor="#fff" icon={<span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>❤</span>} />
          </div>
          <span>{formatCount(engagement.likes)}</span>
        </div>
        <span>{engagement.comments} comments</span>
      </div>

      <div style={{ height: 1, background: '#e0e5e9', margin: '0 14px' }} />

      <div style={{ display: 'flex', padding: '2px 4px' }}>
        <div
          style={{ flex: 1, position: 'relative' }}
          onMouseEnter={handleLikeMouseEnter}
          onMouseLeave={() => { handleLikeMouseLeave(); setShowReactions(false) }}
        >
          {showReactions && <ReactionPopup onSelect={handleReactionSelect} />}
          <button
            type="button"
            onClick={handleLikeClick}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5, padding: '9px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: 'transparent',
              color: activeReaction ? LINKEDIN_BLUE : ACTION,
              fontSize: 13, fontWeight: activeReaction ? 700 : 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = LI_BG }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {activeReaction
              ? <span style={{ fontSize: 18, lineHeight: 1 }}>{activeReaction.emoji}</span>
              : <ThumbsUp size={18} strokeWidth={1.8} />}
            {activeReaction ? activeReaction.label : 'Like'}
          </button>
        </div>

        {otherActions.map(({ icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5, padding: '9px 4px', border: 'none', borderRadius: 4,
              background: 'transparent', color: ACTION, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = LI_BG }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </>
  )
}

export function LinkedInText({ caption, forceExpanded }) {
  const [expanded, setExpanded] = useState(false)
  const text = caption || ''
  const open = forceExpanded || expanded
  const clamp = text.length > 180 && !open
  return (
    <div style={{ padding: '0 14px', color: TEXT, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
      {clamp ? text.slice(0, 180).trimEnd() : text}
      {clamp && (
        <span onClick={(e) => { e.stopPropagation(); setExpanded(true) }} style={{ color: SUBTLE, cursor: 'pointer' }}>
          {' '}... more
        </span>
      )}
    </div>
  )
}

export function MediaBlock({ post, isMobile }) {
  const mediaItems = post.media?.filter(item => item?.url) ?? []
  if (mediaItems.length === 0) return null
  const h = isMobile ? 200 : 260
  const isVideo = post.type === 'video'
  const main = mediaItems[0]
  return (
    <div style={{ marginTop: 10, background: '#d8dce1' }}>
      {isVideo
        ? <video src={main.url} style={{ width: '100%', height: h, objectFit: 'cover', display: 'block' }} controls />
        : <img src={main.url} alt="" style={{ width: '100%', height: h, objectFit: 'cover', display: 'block' }} />}
    </div>
  )
}

export function PostCard({ post, deviceView, onEditPost, onDeletePost, onOpen, expanded = false }) {
  const isMobile = deviceView === 'Mobile'
  const engagement = getPostEngagement(post)
  const caption = post.caption || post.content || ''
  const hashtags = post.hashtags || ''
  const link = post.link || ''

  return (
    <div
      onClick={expanded ? undefined : () => onOpen?.(post)}
      style={{
        background: CARD_BG,
        border: 'none',
        borderRadius: 0,
        overflow: 'hidden',
        cursor: expanded ? 'default' : 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px 8px', gap: 10 }}>
        <PageAvatar size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, lineHeight: 1.2 }}>{MY_NAME}</div>
          <div style={{ fontSize: 11, color: SUBTLE, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span>{formatRelative(post.updatedAt || post.createdAt)}</span>
            <span>·</span>
            <Globe size={11} color={SUBTLE} />
          </div>
        </div>
        <PostActions post={post} onEditPost={onEditPost} onDeletePost={onDeletePost} />
      </div>

      {(caption || hashtags) && (
        <div style={{ paddingBottom: 8 }}>
          <LinkedInText caption={caption} forceExpanded={expanded} />
          {hashtags && (
            <div style={{ padding: '4px 14px 0', color: '#0a66c2', fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>
              {hashtags}
            </div>
          )}
          {link && (
            <div style={{ margin: '8px 14px', border: '1px solid #dbe2ea', borderRadius: 12, padding: '10px 12px', background: '#f8fafc' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Lien</div>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', fontSize: 13, fontWeight: 600, wordBreak: 'break-all', textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}>
                {link}
              </a>
            </div>
          )}
        </div>
      )}

      <MediaBlock post={post} isMobile={isMobile} />
      <PostFooter engagement={engagement} />
    </div>
  )
}

export function MobilePostDetailLinkedin({ post, onBack, deviceView, onEditPost, onDeletePost }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: '12px 14px', background: '#fff', borderBottom: `1px solid ${CARD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* ✅ Arrow added to mobile back button */}
        <button type="button" onClick={onBack}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, color: TEXT, fontWeight: 700, fontSize: 14 }}>
          <ArrowLeft size={16} strokeWidth={2.5} />
          Retourner
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: LINKEDIN_BLUE }}>LinkedIn</span>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ background: '#fff', padding: '10px 0 0' }}>
        <PostCard post={post} deviceView={deviceView} onEditPost={onEditPost} onDeletePost={onDeletePost} expanded />
      </div>
    </div>
  )
}

export function DesktopPostDetailLinkedin({ post, onBack, deviceView, onEditPost, onDeletePost }) {
  return (
    <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '20px 16px 28px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        {/* ✅ Arrow added to desktop back button, matching Facebook style */}
        <button type="button" onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', color: TEXT,
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 999, padding: '9px 16px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          Retourner
        </button>
        <span style={{ fontSize: 13, color: SUBTLE, fontWeight: 600 }}>Publication · {deviceView}</span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${CARD_BORDER}`, background: CARD_BG }}>
        <PostCard post={post} deviceView={deviceView}
          onEditPost={(v) => { onBack(); onEditPost(v) }}
          onDeletePost={(id) => { onDeletePost(id); onBack() }}
          expanded />
      </div>
    </div>
  )
}