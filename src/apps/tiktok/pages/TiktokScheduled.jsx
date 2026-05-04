import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function TiktokScheduled() {
  const navigate = useNavigate();
  const { posts, publishNow, archivePost, moveToTrash } = useOutletContext();
  const scheduledPosts = posts.filter((item) => item.status === 'scheduled');

  return (
    <section className="tiktok-page">
      <div className="tiktok-page-header">
        <div>
          <p className="eyebrow">Planifiés</p>
          <h2>Contenus programmés</h2>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/tiktok/create')}>
          Créer un nouveau
        </button>
      </div>

      {scheduledPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <h3>Aucun contenu planifié</h3>
          <p>Planifiez un post ou une story pour le diffuser à un moment précis.</p>
        </div>
      ) : (
        <div className="tiktok-list">
          {scheduledPosts.map((item) => (
            <article key={item.id} className="card tiktok-item-card">
              <div className="item-meta">
                <strong>{item.title}</strong>
                <span>Planifié le {new Date(item.scheduledAt).toLocaleString('fr-FR')}</span>
              </div>
              <img className="item-preview" src={item.contentPreview} alt={item.title} />
              <p>{item.caption}</p>
              <div className="tag-row">
                <span className="tag">{item.mediaType}</span>
                <span className="tag">{item.visibility}</span>
              </div>
              <div className="item-actions">
                <button type="button" className="btn-primary" onClick={() => publishNow(item.id)}>
                  Publier maintenant
                </button>
                <button type="button" className="action-btn-secondary outline" onClick={() => archivePost(item.id)}>
                  Archiver
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