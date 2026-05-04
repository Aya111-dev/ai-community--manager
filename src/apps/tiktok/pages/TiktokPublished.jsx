import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function TiktokPublished() {
  const navigate = useNavigate();
  const { posts, archivePost, moveToTrash, updatePost } = useOutletContext();
  const publishedPosts = posts.filter((item) => item.status === 'published');

  const [editingId, setEditingId] = useState(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [visibilityDraft, setVisibilityDraft] = useState('public');

  const startEdit = (post) => {
    setEditingId(post.id);
    setCaptionDraft(post.caption);
    setVisibilityDraft(post.visibility);
  };

  const saveEdit = () => {
    updatePost(editingId, {
      caption: captionDraft,
      visibility: visibilityDraft
    });
    setEditingId(null);
  };

  return (
    <section className="tiktok-page">
      <div className="tiktok-page-header">
        <div>
          <p className="eyebrow">Publiés</p>
          <h2>Contenus publiés</h2>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/tiktok/create')}>
          Nouvelle publication
        </button>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <h3>Aucun contenu publié</h3>
          <p>Publiez un post ou une story pour voir les performances en temps réel.</p>
        </div>
      ) : (
        <div className="tiktok-list">
          {publishedPosts.map((post) => (
            <article key={post.id} className="card tiktok-item-card">
              <div className="item-meta">
                <strong>{post.title}</strong>
                <span>Publié le {new Date(post.publishedAt).toLocaleString('fr-FR')}</span>
              </div>
              <img className="item-preview" src={post.contentPreview} alt={post.title} />
              <p>{post.caption}</p>
              <div className="tag-row">
                <span className="tag">{post.mediaType}</span>
                <span className="tag">{post.visibility}</span>
              </div>

              {editingId === post.id ? (
                <div className="edit-panel">
                  <label className="field-group">
                    <span>Modifier la légende</span>
                    <textarea
                      rows="3"
                      value={captionDraft}
                      onChange={(event) => setCaptionDraft(event.target.value)}
                    />
                  </label>
                  <label className="field-group">
                    <span>Visibilité</span>
                    <select value={visibilityDraft} onChange={(event) => setVisibilityDraft(event.target.value)}>
                      <option value="public">Public</option>
                      <option value="private">Privé</option>
                    </select>
                  </label>
                  <div className="button-row">
                    <button type="button" className="btn-primary" onClick={saveEdit}>
                      Sauvegarder
                    </button>
                    <button type="button" className="action-btn-secondary outline" onClick={() => setEditingId(null)}>
                      Fermer
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="item-actions">
                <button type="button" className="btn-primary" onClick={() => startEdit(post)}>
                  Modifier
                </button>
                <button type="button" className="action-btn-secondary outline" onClick={() => archivePost(post.id)}>
                  Archiver
                </button>
                <button type="button" className="action-btn-secondary" onClick={() => moveToTrash(post.id)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}