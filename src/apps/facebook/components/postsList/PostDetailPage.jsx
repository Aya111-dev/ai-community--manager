import { ChevronLeft } from 'lucide-react'
import { FB_BORDER, FB_TEXT, FB_SECONDARY } from './constants'
import { useViewportWidth } from './useViewportWidth'
import { FeedPostViewerFacebook } from './FeedPostViewerFacebook'
import { MobileImmersiveFacebookDetail } from './MobileImmersiveFacebookDetail'
import { MobilePostDetailFacebook } from './FeedPostViewerFacebook'
import { StoryCard } from './StoryReelCards'
import { ReelCard } from './StoryReelCards'

export function PostDetailPage({ post, deviceView, onBack, onEditPost, onDeletePost }) {
  const isReel = post.type === 'reel'
  const isStory = post.type === 'story'
  const isSingleImagePost = post.type === 'image' && (post.media?.length ?? 0) === 1
  const isSingleVideoPost = post.type === 'video' && (post.media?.length ?? 0) === 1
  const viewportWidth = useViewportWidth()
  const isPreviewMobile = deviceView === 'Mobile'
  const stacked = isPreviewMobile || viewportWidth < 980

  if (isPreviewMobile && (isStory || isReel || isSingleImagePost || isSingleVideoPost)) {
    return <MobileImmersiveFacebookDetail post={post} onBack={onBack} onEditPost={onEditPost} onDeletePost={onDeletePost} />
  }

  if (isPreviewMobile && !isStory && !isReel) {
    return <MobilePostDetailFacebook post={post} onBack={onBack} onEditPost={onEditPost} onDeletePost={onDeletePost} />
  }

  return (
    <div style={{ width: '100%', maxWidth: stacked ? '100%' : 960, margin: '0 auto', padding: stacked ? '12px' : '20px 16px 28px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: FB_TEXT, border: `1px solid ${FB_BORDER}`, borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>
          <ChevronLeft size={16} />
          Retour aux posts
        </button>
        <div style={{ fontSize: 14, color: FB_SECONDARY, fontWeight: 600 }}>
          {isStory ? 'Story' : isReel ? 'Reel' : 'Publication'} · {deviceView}
        </div>
      </div>
      {!isStory && !isReel
        ? <FeedPostViewerFacebook post={post} stacked={stacked} pageMode showCloseButton={false} deviceView={deviceView} onClose={onBack} onEditPost={v => { onBack(); onEditPost(v) }} onDeletePost={id => { onDeletePost(id); onBack() }} />
        : <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            {isStory
              ? <StoryCard post={post} onEditPost={v => { onBack(); onEditPost(v) }} onDeletePost={id => { onDeletePost(id); onBack() }} expanded />
              : <ReelCard post={post} onEditPost={v => { onBack(); onEditPost(v) }} onDeletePost={id => { onDeletePost(id); onBack() }} expanded />}
          </div>}
    </div>
  )
}
