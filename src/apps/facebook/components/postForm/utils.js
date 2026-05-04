export function formatDateTime(date) {
  const d = date || new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function getMediaType(item) {
  const rawType = item?.type ?? item?.file?.type
  if (typeof rawType === 'string' && (rawType.toLowerCase() === 'video' || rawType.toLowerCase().startsWith('video/'))) {
    return 'video'
  }

  const url = item?.url ?? ''
  if (typeof url === 'string' && /\.(mp4|mov|webm|ogg|m4v)(\?|#|$)/i.test(url)) {
    return 'video'
  }

  return 'image'
}

export function buildInitialMedia(cfg, initialMedia) {
  const baseSlots = Array(cfg.mediaCount).fill(null)
  if (!initialMedia?.length) return { mediaFiles: baseSlots, extraMedia: [] }

  const normalized = initialMedia.map((item, index) => ({
    id: item.id ?? `${Date.now()}-${index}`,
    url: item.url,
    previewUrl: item.previewUrl ?? item.url,
    file: item.file ?? null,
    type: getMediaType(item),
    presentation: item.presentation ?? null,
  }))

  return {
    mediaFiles: baseSlots.map((_, index) => normalized[index] ?? null),
    extraMedia: normalized.slice(cfg.mediaCount),
  }
}

export const isVertical = (postType) => postType === 'story' || postType === 'reel'
