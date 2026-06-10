import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function TiktokArchived() {
  const navigate = useNavigate();
  const { posts, restorePost, publishNow, moveToTrash } = useOutletContext();
  const archivedPosts = posts.filter((item) => item.status === 'archived');

  return (
    <section className="tiktok-page">
      <div className="tiktok-page-header">
        <div>
          <p className="eyebrow">Archivés</p>
          <h2>Contenus archivés</h2>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/tiktok/create')}>
          Créer un contenu
        </button>
      </div>

      {archivedPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>Aucun contenu archivé</h3>
          <p>Les publications archivées apparaîtront ici pour restauration ou réédition.</p>
        </div>
      ) : (
        <div className="tiktok-list">
          {archivedPosts.map((item) => (
            <article key={item.id} className="card tiktok-item-card">
              <div className="item-meta">
                <strong>{item.title}</strong>
                <span>Archivage : {new Date(item.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <img className="item-preview" src={item.contentPreview} alt={item.title} />
              <p>{item.caption}</p>
              <div className="tag-row">
                <span className="tag">{item.mediaType}</span>
              </div>
              <div className="item-actions">
                <button type="button" className="btn-primary" onClick={() => restorePost(item.id)}>
                  Restaurer en brouillon
                </button>
                <button type="button" className="action-btn-secondary outline" onClick={() => publishNow(item.id)}>
                  Republier
                </button>
                <button type="button" className="action-btn-secondary" onClick={() => moveToTrash(item.id)}>
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