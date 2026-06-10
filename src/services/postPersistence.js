export async function resolveMediaUrl(item) {
  if (!item) return item
  const url = item.url || ''
  if (!url.startsWith('blob:')) return item
  if (item.file instanceof File) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ ...item, url: reader.result, file: null })
      reader.onerror = () => resolve({ ...item, file: null })
      reader.readAsDataURL(item.file)
    })
  }
  return { ...item, file: null }
}

export async function resolvePostMedia(postData) {
  if (!Array.isArray(postData.media) || postData.media.length === 0) return postData
  const resolvedMedia = await Promise.all(postData.media.map(resolveMediaUrl))
  return { ...postData, media: resolvedMedia }
}

export function tiktokItemToApiPayload(item, status = 'published') {
  const mediaUrl = item.contentPreview || item.media?.[0]?.url || ''
  const isVideo =
    item.type === 'video' ||
    item.contentType === 'video' ||
    item.mediaType === 'video' ||
    /\.(mp4|webm|ogg)(\?|#|$)/i.test(String(mediaUrl))

  return {
    platform: 'tiktok',
    type: item.type || 'story',
    caption: item.caption || item.title || '',
    description: item.description || item.aiPrompt || '',
    hashtags: item.hashtags || '',
    status,
    scheduledDate: item.scheduledAt || null,
    media: mediaUrl ? [{ url: mediaUrl, type: isVideo ? 'video' : 'image' }] : [],
    meta: {
      title: item.title,
      username: item.username,
      sound: item.sound,
      visibility: item.visibility,
      allowComments: item.allowComments,
      allowDuet: item.allowDuet,
      allowStitch: item.allowStitch,
      isAI: item.isAI,
      aiPrompt: item.aiPrompt,
      contentType: item.contentType,
      likes: item.likes ?? 0,
      comments: item.comments ?? 0,
      shares: item.shares ?? 0,
    },
  }
}

export function apiPostToTiktokItem(post) {
  const media = post.media?.[0]
  const meta = post.meta || {}
  return {
    id: post.id || post._id,
    _id: post._id || post.id,
    type: post.type || 'story',
    contentType: meta.contentType || (media?.type === 'video' ? 'video' : 'story'),
    title: meta.title || post.caption,
    caption: post.caption,
    description: post.description,
    hashtags: post.hashtags,
    contentPreview: media?.url || '',
    status: post.status,
    createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
    username: meta.username || '@vous',
    sound: meta.sound,
    visibility: meta.visibility,
    allowComments: meta.allowComments,
    allowDuet: meta.allowDuet,
    allowStitch: meta.allowStitch,
    isAI: meta.isAI,
    aiPrompt: meta.aiPrompt,
    likes: meta.likes ?? 0,
    comments: meta.comments ?? 0,
    shares: meta.shares ?? 0,
    mediaType: media?.type === 'video' ? 'video' : 'photo',
  }
}

export function pinToApiPayload(pin) {
  const imageUrl = pin.imageUrl || pin.media?.[0]?.url || ''
  const isVideo = pin.mediaType === 'video' || /\.(mp4|webm)(\?|#|$)/i.test(String(imageUrl))
  return {
    platform: 'pinterest',
    type: isVideo ? 'video' : 'image',
    caption: pin.title || '',
    description: pin.description || '',
    hashtags: pin.hashtags || '',
    status: pin.status || 'published',
    scheduledDate: pin.scheduled || null,
    media: imageUrl ? [{ url: imageUrl, type: isVideo ? 'video' : 'image' }] : [],
    meta: {
      board: pin.board,
      link: pin.link,
      author: pin.author,
      likes: pin.likes ?? 0,
      comments: pin.comments ?? 0,
      saves: pin.saves ?? 0,
      views: pin.views ?? 0,
    },
  }
}

export function apiPostToPin(post) {
  const media = post.media?.[0]
  const meta = post.meta || {}
  return {
    id: post.id || post._id,
    _id: post._id || post.id,
    title: post.caption || '',
    description: post.description || '',
    imageUrl: media?.url || '',
    board: meta.board || 'Sans tableau',
    link: meta.link || '',
    author: meta.author || 'Vous',
    likes: meta.likes ?? 0,
    comments: meta.comments ?? 0,
    saves: meta.saves ?? 0,
    views: meta.views ?? 0,
    status: post.status || 'published',
    scheduled: post.scheduledDate || null,
    mediaType: media?.type === 'video' ? 'video' : 'image',
  }
}
