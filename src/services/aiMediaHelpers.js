import { generateContent, generateHashtags, generateMedia } from './api.js';

export function bustMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith('data:')) return `${url}#${Date.now()}`;
  return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
}

export function mapPostTypeForApi(kind) {
  const map = {
    photo: 'image',
    image: 'image',
    video: 'video',
    story: 'story',
    reel: 'reel',
    carousel: 'carousel',
    shorts: 'reel',
    text: 'image',
    article: 'image',
  };
  return map[kind] || kind;
}

export function toMediaItem(item, index = 0) {
  const isVideo = item.type === 'video';
  return {
    id: `ai-${Date.now()}-${index}`,
    url: bustMediaUrl(item.url),
    type: isVideo ? 'video' : 'image',
    kind: isVideo ? 'video' : 'image',
  };
}

export async function generateThemedPostMedia({
  description,
  platform,
  postType,
  count = 1,
  regenerate = false,
  withCaption = true,
  withHashtags = true,
  withMedia = true,
}) {
  const result = { caption: '', hashtags: '', mediaItems: [], mediaUrl: '' };

  if (withCaption) {
    const contentRes = await generateContent({
      description,
      platform,
      postType,
      regenerate,
    });
    result.caption = contentRes.contenu;
  }

  if (withHashtags) {
    try {
      const hashtagsRes = await generateHashtags({
        description,
        platform,
        postType,
        regenerate,
      });
      result.hashtags = hashtagsRes.hashtags;
    } catch {
      /* hashtags optionnels */
    }
  }

  if (withMedia) {
    const mediaRes = await generateMedia({
      description,
      platform,
      postType,
      count,
      regenerate,
    });
    result.mediaItems = (mediaRes.media || []).map(toMediaItem);
    result.mediaUrl = result.mediaItems[0]?.url || '';
  }

  return result;
}
