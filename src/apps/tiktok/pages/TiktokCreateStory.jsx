import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const covers = [
  { id: 'story-cover-1', label: 'Motion', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
  { id: 'story-cover-2', label: 'Lifestyle', url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=80' },
  { id: 'story-cover-3', label: 'Minimal', url: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80' }
];

export default function TiktokCreateStory() {
  const navigate = useNavigate();
  const {
    createDraft,
    createPublished,
    createScheduled,
    generateAiCaption,
    generateMediaPlaceholder
  } = useOutletContext();

  const [mediaType, setMediaType] = useState('photo');
  const [mode, setMode] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(generateMediaPlaceholder('story', 'photo'));
  const [cover, setCover] = useState(covers[0].url);
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    if (mode === 'ai' && prompt.trim()) {
      setCaption(generateAiCaption(prompt, 'story', mediaType));
      setPreview(generateMediaPlaceholder('story', mediaType));
      setCover(generateMediaPlaceholder('story', mediaType));
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
    type: 'story',
    mediaType,
    title: `${mediaType === 'photo' ? 'Story photo' : 'Story vidéo'}`,
    caption,
    prompt,
    mode,
    visibility: 'public',
    scheduledAt: scheduledAt || null,
    mediaPreview: preview,
    mediaName: `${mediaType === 'photo' ? 'Image Story' : 'Vidéo Story'}`
  };

  return (
    <section className="tiktok-page">
      <article className="create-card">
        <div className="create-card-top">
          <div>
            <p className="eyebrow">Aperçu du post — Story</p>
            <h2>Créer une story</h2>
          </div>
          <button className="action-btn-secondary outline" onClick={() => navigate('/tiktok')}>
            ← Retour
          </button>
        </div>

        <div className="create-toolbar">
          <div className="field-row">
            <button
              type="button"
              className={`tab-pill ${mediaType === 'photo' ? 'active' : ''}`}
              onClick={() => setMediaType('photo')}
            >
              Photo
            </button>
            <button
              type="button"
              className={`tab-pill ${mediaType === 'video' ? 'active' : ''}`}
              onClick={() => setMediaType('video')}
            >
              Vidéo
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
          <div className="story-preview-card">
            <div className="preview-label-row">
              <span className="preview-label">Aperçu</span>
              <span className="preview-chip">{mediaType === 'photo' ? 'Photo' : 'Vidéo'}</span>
            </div>

            <div className="story-preview-media">
              <img src={cover} alt="Couverture story" />
            </div>

            <div className="story-preview-body">
              <div className="story-meta">
                <span className="avatar-circle">U</span>
                <div>
                  <strong>Utilisateur</strong>
                  <span>{new Date().toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <p>{caption || 'Rédige ta légende ou génère en IA.'}</p>
              <div className="story-stats">
                <span>💬 0</span>
                <span>❤ 0</span>
                <span>↗ 0</span>
              </div>
            </div>
          </div>

          <div className="create-form">
            <div className="field-row">
              <div className="field-group">
                <label>Prompt</label>
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Décris ta story"
                />
              </div>
              <div className="field-group">
                <label>Caption</label>
                <textarea
                  rows="4"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Écris ta légende"
                />
              </div>
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
                Publier
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
                Brouillon
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}