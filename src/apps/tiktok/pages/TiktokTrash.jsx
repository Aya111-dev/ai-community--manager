import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function TiktokTrash() {
  const navigate = useNavigate();
  const { posts, restorePost, deleteForever } = useOutletContext();
  const trashPosts = posts.filter((item) => item.status === 'trash');

  const getDaysLeft = (deletedAt) => {
    if (!deletedAt) return 30;
    const diff = Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime())) / (24 * 60 * 60 * 1000));
    return Math.max(diff, 0);
  };

  return (
    <section className="tiktok-page">
      <div className="tiktok-page-header">
        <div>
          <p className="eyebrow">Corbeille</p>
          <h2>Contenus supprimés</h2>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/tiktok/create')}>
          Revenir à la création
        </button>
      </div>

      {trashPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗑️</div>
          <h3>La corbeille est vide</h3>
          <p>Les publications supprimées seront conservées pendant 30 jours avant suppression définitive.</p>
        </div>
      ) : (
        <div className="tiktok-list">
          {trashPosts.map((post) => (
            <article key={post.id} className="card tiktok-item-card">
              <div className="item-meta">
                <strong>{post.title}</strong>
                <span>Supprimé il y a {Math.max(1, Math.ceil((Date.now() - new Date(post.deletedAt).getTime()) / (24 * 60 * 60 * 1000)))} jours</span>
              </div>
              <img className="item-preview" src={post.contentPreview} alt={post.title} />
              <p>{post.caption}</p>
              <div className="tag-row">
                <span className="tag">{post.mediaType}</span>
                <span className="tag">{getDaysLeft(post.deletedAt)} jours restants</span>
              </div>
              <div className="item-actions">
                <button type="button" className="btn-primary" onClick={() => restorePost(post.id)}>
                  Restaurer
                </button>
                <button type="button" className="action-btn-secondary" onClick={() => deleteForever(post.id)}>
                  Supprimer définitivement
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}