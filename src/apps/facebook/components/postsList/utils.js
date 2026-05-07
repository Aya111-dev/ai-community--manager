import { FB_TEXT } from './constants'
import { STORY_BACKGROUND_OPTIONS } from '../postForm/constants'

export function formatRelative(date) {
  if (!date) return 'À l\'instant'
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return new Date(date).toLocaleDateString('fr-FR')
}

export function getPostStyle(post, compact, isMobile, expanded = false) {
  const style = post.style ?? {}
  const maxWidthPercent = Math.max(60, Math.min(100, style.cardWidth ?? 100))
  return {
    container: {
      background: '#fff',
      borderRadius: expanded ? 0 : compact ? 0 : 0,
      border: 'none',
      width: '100%',
      maxWidth: expanded ? 860 : '100%',
      margin: '0 auto',
      overflow: 'hidden',
    },
    text: {
      fontFamily: style.fontFamily ?? '-apple-system, Helvetica, Arial, sans-serif',
      fontSize: 15,
      textAlign: 'left',
      color: FB_TEXT,
    },
    mediaHeight: expanded ? Math.max(320, style.mediaHeight ?? 320) : style.mediaHeight ?? 320,
    maxWidthPercent,
  }
}

export function getMediaPresentation(source, fallbackStyle = {}) {
  const style = source?.presentation ?? source?.style ?? fallbackStyle ?? {}
  const mediaScale = Math.max(1, Math.min(2, style.mediaScale ?? 1))
  const mediaRotation = style.mediaRotation ?? 0
  const mediaOffsetX = Math.max(0, Math.min(100, style.mediaOffsetX ?? 50))
  const mediaOffsetY = Math.max(0, Math.min(100, style.mediaOffsetY ?? 50))
  const frame = style.mediaFrame ?? {}
  const viewport = style.mediaViewport ?? {}
  const viewportLeft = viewport.x ?? frame.left ?? 0
  const viewportTop = viewport.y ?? frame.top ?? 0
  const viewportWidth = viewport.width ?? (100 - (frame.left ?? 0) - (frame.right ?? 0))
  const viewportHeight = viewport.height ?? (100 - (frame.top ?? 0) - (frame.bottom ?? 0))

  return {
    objectFit: style.mediaFit ?? 'cover',
    objectPosition: `${mediaOffsetX}% ${mediaOffsetY}%`,
    transform: `scale(${mediaScale}) rotate(${mediaRotation}deg)`,
    frame: {
      left: Math.max(0, Math.min(40, frame.left ?? 0)),
      right: Math.max(0, Math.min(40, frame.right ?? 0)),
      top: Math.max(0, Math.min(40, frame.top ?? 0)),
      bottom: Math.max(0, Math.min(40, frame.bottom ?? 0)),
    },
    viewport: {
      x: Math.max(0, Math.min(100, viewportLeft)),
      y: Math.max(0, Math.min(100, viewportTop)),
      width: Math.max(8, Math.min(100, viewportWidth)),
      height: Math.max(8, Math.min(100, viewportHeight)),
      aspectRatio: viewport.aspectRatio ?? 'free',
    },
    textLayers: Array.isArray(style.textLayers)
      ? style.textLayers
        .map((layer, index) => ({
          id: layer.id ?? `layer-${index}`,
          content: typeof layer.content === 'string' ? layer.content : '',
          x: Math.max(0, Math.min(100, layer.x ?? 50)),
          y: Math.max(0, Math.min(100, layer.y ?? 50)),
          fontSize: Math.max(12, Math.min(72, layer.fontSize ?? 24)),
          color: layer.color ?? '#ffffff',
          zIndex: Number.isFinite(layer.zIndex) ? layer.zIndex : index + 1,
        }))
        .filter(layer => layer.content.trim())
      : [],
  }
}

export function getMediaOverlayData(post) {
  const style = post.style ?? {}
  const useCanvas = style.textCanvasEnabled && style.textCanvasText?.trim()
  return {
    overlayText: useCanvas
      ? style.textCanvasText.trim()
      : (typeof style.overlayText === 'string' ? style.overlayText.trim()
        : (typeof post.text === 'string' ? post.text.trim() : '')),
    overlayTextX: useCanvas ? (style.textCanvasX ?? 50) : Math.max(0, Math.min(100, style.overlayTextX ?? post.textPosition?.x ?? 50)),
    overlayTextY: useCanvas ? (style.textCanvasY ?? 50) : Math.max(0, Math.min(100, style.overlayTextY ?? post.textPosition?.y ?? 84)),
    overlayTextFontFamily: useCanvas ? (style.textCanvasFontFamily ?? '-apple-system, Helvetica, Arial, sans-serif') : (style.overlayTextFontFamily ?? style.fontFamily ?? '-apple-system, Helvetica, Arial, sans-serif'),
    overlayTextColor: useCanvas ? (style.textCanvasColor ?? '#ffffff') : (style.overlayTextColor ?? '#ffffff'),
    overlayTextFontSize: useCanvas ? Math.max(10, Math.min(56, style.textCanvasFontSize ?? 20)) : (style.overlayTextFontSize ?? 20),
    overlayTextBold: useCanvas ? Boolean(style.textCanvasBold) : Boolean(style.overlayTextBold),
    overlayTextAlign: useCanvas ? (style.textCanvasAlign ?? 'center') : (style.overlayTextAlign ?? 'center'),
  }
}

export function getPrimaryMedia(post) {
  const firstMedia = Array.isArray(post.media) ? post.media[0] : null
  const src = firstMedia?.url ?? post.mediaUrl ?? (typeof post.media === 'string' ? post.media : '')
  const rawType = firstMedia?.type ?? post.mediaType ?? ''
  const type = rawType === 'video' || /\.(mp4|mov|webm|ogg|m4v)(\?|#|$)/i.test(src) ? 'video' : 'image'
  const presentationSource = firstMedia ?? post

  return {
    src,
    type,
    presentation: getMediaPresentation(presentationSource, post.style),
  }
}

export function getStoryBackground(style = {}) {
  const selected = style.storyBackground
  if (typeof selected === 'string' && selected.trim()) {
    return selected
  }

  return STORY_BACKGROUND_OPTIONS[0].value
}

export function getNumericValue(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function getMetricSeed(post, offset = 0) {
  const source = String(post.id ?? `${post.type ?? 'post'}-${post.caption ?? ''}`)
  return source.split('').reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1 + offset), 0)
}

export function getPostComments(post) {
  if (!Array.isArray(post.comments)) return []

  return post.comments
    .map((comment, index) => {
      const authorName =
        comment.author ??
        comment.authorName ??
        comment.user?.name ??
        comment.username ??
        'Facebook User'

      const message = comment.text ?? comment.content ?? comment.message ?? ''
      const rawTime = comment.time ?? comment.createdAt ?? comment.updatedAt ?? null

      return {
        id: comment.id ?? `${post.id}-comment-${index + 1}`,
        author: authorName,
        time: typeof rawTime === 'string' && !rawTime.includes('T') ? rawTime : formatRelative(rawTime),
        text: message,
      }
    })
    .filter(comment => comment.text)
}

export function getPostEngagement(post, comments = getPostComments(post)) {
  const engagement = post.engagement ?? {}
  const likes = getNumericValue(engagement.likes) ?? getNumericValue(post.likes) ?? ((getMetricSeed(post, 3) % 900) + 120)
  const shares = getNumericValue(engagement.shares) ?? getNumericValue(post.shares) ?? ((getMetricSeed(post, 7) % 18) + 1)
  const commentsCount = getNumericValue(engagement.comments) ?? getNumericValue(post.commentsCount) ?? comments.length

  return { likes, comments: commentsCount, shares }
}

export function formatCount(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
  return `${value}`
}

export function formatMetricLabel(value, singular, plural = `${singular}s`) {
  return `${formatCount(value)} ${value === 1 ? singular : plural}`
}

export function formatMobileDetailDate(date) {
  if (!date) return 'Just now'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}