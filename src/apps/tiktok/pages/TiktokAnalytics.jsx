import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function TiktokAnalytics() {
  const { posts } = useOutletContext();
  const published = posts.filter((post) => post.status === 'published');
  const totalReach = published.reduce((sum, post) => sum + post.metrics.reach, 0);
  const totalImpressions = published.reduce((sum, post) => sum + post.metrics.impressions, 0);
  const totalLikes = published.reduce((sum, post) => sum + post.metrics.likes, 0);
  const averageEngagement = published.length
    ? Math.round((published.reduce((sum, post) => sum + post.metrics.likes, 0) / published.length) * 10) / 10
    : 0;

  const topPosts = [...published].sort((a, b) => b.metrics.reach - a.metrics.reach).slice(0, 3);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Analysez le reach, les impressions et la performance de vos meilleurs posts.</p>
        </div>
      </header>

      <section className="analytics-grid">
        <article className="card">
          <div className="card-header">
            <div>
              <h3>Résumé</h3>
              <span>Métriques globales de votre contenu</span>
            </div>
          </div>

          <div className="metric-row">
            <div className="metric-card">
              <strong>{totalReach.toLocaleString()}</strong>
              <span>Vues</span>
            </div>
            <div className="metric-card">
              <strong>{totalImpressions.toLocaleString()}</strong>
              <span>Impressions</span>
            </div>
            <div className="metric-card">
              <strong>{totalLikes.toLocaleString()}</strong>
              <span>Likes</span>
            </div>
            <div className="metric-card">
              <strong>{averageEngagement}</strong>
              <span>Engagement moyen</span>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h3>Top posts</h3>
              <span>Classement par reach</span>
            </div>
          </div>

          {topPosts.map((post) => (
            <div key={post.id} className="analytics-bar">
              <span>{post.title}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.min(100, Math.round((post.metrics.reach / totalReach) * 100))}%` }}
                />
              </div>
              <span>{post.metrics.reach.toLocaleString()} vues</span>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}