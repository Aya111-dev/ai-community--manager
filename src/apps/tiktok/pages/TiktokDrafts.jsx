import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function TiktokDrafts() {
  const navigate = useNavigate();
  const {
    posts,
    publishNow,
    archivePost,
    moveToTrash,
    updatePost,
    schedulePost
  } = useOutletContext();

  const drafts = useMemo(() => posts.filter((item) => item.status === 'draft'), [posts]);
  const [editingId, setEditingId] = useState(null);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftVisibility, setDraftVisibility] = useState('public');
  const [draftSchedule, setDraftSchedule] = useState('');

  const startEditing = (draft) => {
    setEditingId(draft.id);
    setDraftCaption(draft.caption);
    setDraftVisibility(draft.visibility);
    setDraftSchedule(draft.scheduledAt || '');
  };

  const saveDraft = () => {
    if (!editingId) return;
    updatePost(editingId, {
      caption: draftCaption,
      visibility: draftVisibility
    });
    setEditingId(null);
  };

  return (
    <section className="tiktok-page">
      <div className="tiktok-page-header">
        <div>
          <p className="eyebrow">Brouillons</p>
          <h2>Contenus en préparation</h2>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/tiktok/create')}>
          Ajouter un brouillon
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">+</div>
          <h3>Aucun brouillon</h3>
          <p>Créez un post ou une story et sauvegardez-la pour revenir plus tard.</p>
        </div>
      ) : (
        <div className="tiktok-list">
          {drafts.map((draft) => (
            <article key={draft.id} className="card tiktok-item-card">
              <div className="item-meta">
                <strong>{draft.title}</strong>
                <span>{draft.mediaType} • {draft.type}</span>
              </div>
              <img className="item-preview" src={draft.contentPreview} alt={draft.title} />
              <p>{draft.caption}</p>
              <div className="tag-row">
                <span className="tag">{draft.visibility}</span>
                <span className="tag">{draft.mode === 'ai' ? 'IA' : 'Manuel'}</span>
              </div>

              {editingId === draft.id ? (
                <div className="edit-panel">
                  <label className="field-group">
                    <span>Modifier la légende</span>
                    <textarea
                      rows="3"
                      value={draftCaption}
                      onChange={(event) => setDraftCaption(event.target.value)}
                    />
                  </label>
                  <label className="field-group">
                    <span>Visibilité</span>
                    <select value={draftVisibility} onChange={(event) => setDraftVisibility(event.target.value)}>
                      <option value="public">Public</option>
                      <option value="private">Privé</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span>Planifier</span>
                    <input
                      type="datetime-local"
                      value={draftSchedule}
                      onChange={(event) => setDraftSchedule(event.target.value)}
                    />
                  </label>
                  <div className="button-row">
                    <button type="button" className="btn-primary" onClick={saveDraft}>
                      Enregistrer
                    </button>
                    <button type="button" className="action-btn-secondary outline" onClick={() => setEditingId(null)}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="item-actions">
                <button type="button" className="btn-primary" onClick={() => publishNow(draft.id)}>
                  Publier
                </button>
                <button type="button" className="action-btn-secondary outline" onClick={() => startEditing(draft)}>
                  Modifier
                </button>
                <button type="button" className="action-btn-secondary outline" onClick={() => archivePost(draft.id)}>
                  Archiver
                </button>
                <button type="button" className="action-btn-secondary" onClick={() => moveToTrash(draft.id)}>
                  Supprimer
                </button>
              </div>

              {editingId === draft.id && draftSchedule ? (
                <button
                  type="button"
                  className="action-btn-secondary outline"
                  onClick={() => {
                    schedulePost(draft.id, draftSchedule);
                    setEditingId(null);
                  }}
                >
                  Planifier cette publication
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}