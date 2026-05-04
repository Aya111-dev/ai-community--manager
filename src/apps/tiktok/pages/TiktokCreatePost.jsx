import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const covers = [
  { id: 'cover-1', label: 'Dynamique', url: 'https://images.unsplash.com/photo-1517263904808-5dc0fe5f9a35?auto=format&fit=crop&w=900&q=80' },
  { id: 'cover-2', label: 'Moderne', url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=900&q=80' },
  { id: 'cover-3', label: 'Minimal', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80' }
];

export default function TiktokCreatePost() {
  const navigate = useNavigate();
  const {
    createDraft,
    createPublished,
    createScheduled,
    generateAiCaption,
    generateMediaPlaceholder
  } = useOutletContext();

  const [mediaType, setMediaType] = useState('video');
  const [mode, setMode] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(generateMediaPlaceholder('post', 'video'));
  const [cover, setCover] = useState(covers[0].url);
  const [visibility, setVisibility] = useState('public');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    if (mode === 'ai' && prompt.trim()) {
      setCaption(generateAiCaption(prompt, 'post', mediaType));
      setPreview(generateMediaPlaceholder('post', mediaType));
      setCover(generateMediaPlaceholder('post', mediaType));
    }
  }, [prompt, mode, mediaType, generateAiCaption]);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setCover(url);
    setMode('manual');
  };

  const payload = {
    type: 'post',
    mediaType,
    title: `${mediaType === 'video' ? 'Post vidéo' : 'Post image'}`,
    caption,
    prompt,
    mode,
    visibility,
    scheduledAt: scheduledAt || null,
    mediaPreview: preview,
    mediaName: `${mediaType === 'video' ? 'Vidéo TikTok' : 'Image TikTok'}`
  };

  return (
    <section className="tiktok-page">
      <article className="create-card">
        <div className="create-card-top">
          <div>
            <p className="eyebrow">Aperçu du post</p>
            <h2>Créer un post TikTok</h2>
          </div>
          <button className="action-btn-secondary outline" onClick={() => navigate('/tiktok')}>
            ← Retour
          </button>
        </div>

        <div className="create-toolbar">
          <div className="field-row">
            <button
              type="button"
              className={`tab-pill ${mediaType === 'video' ? 'active' : ''}`}
              onClick={() => setMediaType('video')}
            >
              Vidéo
            </button>
            <button
              type="button"
              className={`tab-pill ${mediaType === 'photo' ? 'active' : ''}`}
              onClick={() => setMediaType('photo')}
            >
              Image
            </button>
          </div>

          <div className="field-row">
            <button
              type="button"
              className={`tab-pill ${mode === 'ai' ? 'active' : ''}`}
              onClick={() => setMode('ai')}
            >
              IA
            </button>
            <button
              type="button"
              className={`tab-pill ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => setMode('manual')}
            >
              Manuel
            </button>
          </div>
        </div>

        <div className="create-grid">
          <div className="post-preview-card">
            <div className="preview-label-row">
              <span className="preview-label">Aperçu</span>
              <span className="preview-chip">{mediaType === 'video' ? 'Vidéo' : 'Image'}</span>
            </div>

            <div className="post-preview-media">
              <img src={cover} alt="Couverture post" />
            </div>

            <div className="post-preview-content">
              <div className="post-preview-user">
                <span className="avatar-circle">U</span>
                <div>
                  <strong>Utilisateur</strong>
                  <span>{new Date().toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <p>{caption || 'Ta légende s’affiche ici.'}</p>
            </div>

            <div className="post-preview-actions">
              <span>❤ 0</span>
              <span>💬 0</span>
              <span>↗ 0</span>
            </div>
          </div>

          <div className="create-form">
            <div className="field-group">
              <label>Prompt</label>
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Décris ton post"
              />
            </div>

            <div className="field-group">
              <label>Caption</label>
              <textarea
                rows="4"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Écris la légende"
              />
            </div>

            <div className="field-group">
              <label>Visibilité</label>
              <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                <option value="public">Public</option>
                <option value="private">Privé</option>
              </select>
            </div>

            <div className="field-group">
              <label>Uploader un média</label>
              <input type="file" accept="image/*,video/*" onChange={handleUpload} />
            </div>

            <div className="field-group">
              <label>Couverture</label>
              <div className="cover-picker">
                {covers.map((coverOption) => (
                  <button
                    key={coverOption.id}
                    type="button"
                    className={`cover-option ${cover === coverOption.url ? 'selected' : ''}`}
                    onClick={() => setCover(coverOption.url)}
                  >
                    <img src={coverOption.url} alt={coverOption.label} />
                    <span>{coverOption.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label>Planifier</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>

            <div className="action-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  createPublished(payload);
                  navigate('/tiktok/published');
                }}
              >
                Publier maintenant
              </button>

              <button
                type="button"
                className="action-btn-secondary outline"
                onClick={() => {
                  if (scheduledAt) {
                    createScheduled(payload);
                    navigate('/tiktok/scheduled');
                  }
                }}
              >
                Planifier
              </button>

              <button
                type="button"
                className="action-btn-secondary outline"
                onClick={() => {
                  createDraft(payload);
                  navigate('/tiktok/drafts');
                }}
              >
                Garder en réserve
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}