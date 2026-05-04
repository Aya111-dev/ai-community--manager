import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function TiktokProfile() {
  const { posts, profileInfo } = useOutletContext();

  const publishedPosts = posts.filter((post) => post.status === 'published');
  const totalReach = publishedPosts.reduce((sum, post) => sum + post.metrics.reach, 0);
  const totalLikes = publishedPosts.reduce((sum, post) => sum + post.metrics.likes, 0);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Profil TikTok</h1>
          <p>Vue synthétique du compte, des performances et des contenus récents.</p>
        </div>
      </header>

      <section className="profile-banner">
        <div className="profile-head">
          <div className="profile-avatar">{profileInfo.name[0]}</div>
          <div className="profile-summary">
            <h2>{profileInfo.name}</h2>
            <p>{profileInfo.bio}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <strong>{profileInfo.followers.toLocaleString()}</strong>
            <span>Abonnés</span>
          </div>
          <div className="profile-stat">
            <strong>{totalReach.toLocaleString()}</strong>
            <span>Vues totales</span>
          </div>
          <div className="profile-stat">
            <strong>{publishedPosts.length}</strong>
            <span>Publications</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>Contenus récents</h3>
            <span>Les publications les plus récentes avec aperçu.</span>
          </div>
        </div>

        <div className="profile-grid">
          {publishedPosts.map((post) => (
            <article key={post.id} className="preview-card">
              <img src={post.contentPreview} alt={post.title} />
              <div className="preview-card-body">
                <h4>{post.title}</h4>
                <p>{post.caption}</p>
                <div className="meta-row">
                  <span className="metric-badge">
                    <strong>{post.metrics.reach.toLocaleString()}</strong> vues
                  </span>
                  <span className="published-chip">{post.mediaType}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Statistiques</h3>
          <span>Résumé des performances clés.</span>
        </div>

        <div className="card-list">
          <div className="card-item">
            <h4>Total likes</h4>
            <p>{totalLikes.toLocaleString()} likes cumulés.</p>
          </div>
          <div className="card-item">
            <h4>Engagement</h4>
            <p>Suivez la portée de vos publications pour améliorer votre stratégie.</p>
          </div>
        </div>
      </section>
    </div>
  );
}