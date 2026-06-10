const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erreur API (${response.status})`);
  }

  return data;
}

/** Génère le contenu (caption) à partir d'une thématique / mot-clé */
export async function generateContent({ description, platform, postType, regenerate = false, previousContent = '' }) {
  return request('/ai/generate', {
    method: 'POST',
    body: JSON.stringify({
      description,
      platform,
      postType,
      field: 'contenu',
      regenerate,
      previousContent,
      seed: Date.now(),
    }),
  });
}

/** Génère des hashtags à partir d'une thématique */
export async function generateHashtags({ description, platform, postType, regenerate = false, previousContent = '' }) {
  return request('/ai/generate-hashtags', {
    method: 'POST',
    body: JSON.stringify({
      description,
      platform,
      postType,
      regenerate,
      previousContent,
      seed: Date.now(),
    }),
  });
}

/** Génère des médias (images/vidéos) à partir d'une thématique */
export async function generateMedia({ description, platform, postType, count, regenerate = false }) {
  return request('/ai/generate-media', {
    method: 'POST',
    body: JSON.stringify({
      description,
      platform,
      postType,
      count,
      regenerate,
      seed: Date.now(),
    }),
  });
}

/** Régénère uniquement le contenu d'un post existant (icône IA à côté de caption) */
export async function regeneratePostContent(postId, description) {
  return request(`/posts/${postId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export async function getPosts({ platform, status } = {}) {
  const params = new URLSearchParams();
  if (platform) params.set('platform', platform);
  if (status) params.set('status', status);
  const query = params.toString();
  return request(`/posts${query ? `?${query}` : ''}`);
}

export async function createPost(payload) {
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePost(id, payload) {
  return request(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePost(id) {
  return request(`/posts/${id}`, { method: 'DELETE' });
}
