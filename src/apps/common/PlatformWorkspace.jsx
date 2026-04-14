import React, { useMemo, useState } from 'react';

export default function PlatformWorkspace({ meta, onBack }) {
  const [activeTab, setActiveTab] = useState('Publiés');
  const [deviceView, setDeviceView] = useState('Mobile');

  const posts = useMemo(() => [], []);
  const platformName = meta?.name ?? 'Plateforme';

  return (
    <main className="homepage-screen">
      <header className="header-card card animation-fade-in">
        <div className="header-left">
          <button
            type="button"
            className="platform-btn active"
            style={meta?.color ? { borderColor: meta.color, color: meta.color } : undefined}
            aria-label={`${platformName} sélectionné`}
          >
            <span className="platform-icon" style={meta?.color ? { background: meta.color } : undefined}>
              {meta?.logoUrl ? <img src={meta.logoUrl} alt={`${platformName} logo`} /> : null}
            </span>
            <span>{platformName}</span>
          </button>

          <button
            type="button"
            className="action-btn-secondary outline"
            onClick={() => onBack?.()}
          >
            ← Retourner
          </button>
        </div>

        <div className="header-actions">
          <button type="button" className="action-btn-secondary outline">
            Stratégie
          </button>
          <button type="button" className="btn-primary">
            + Créer un post
          </button>
        </div>
      </header>

      <section className="posts-card card">
        <div className="posts-card-header">
          <h2>Posts publiés</h2>
          <div className="posts-card-controls">
            <div className="posts-card-tabs">
              {['Publiés', 'Planifiés', 'Brouillons'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="device-toggle">
              <button
                type="button"
                className={`device-pill ${deviceView === 'Desktop' ? 'active' : ''}`}
                onClick={() => setDeviceView('Desktop')}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`device-pill ${deviceView === 'Mobile' ? 'active' : ''}`}
                onClick={() => setDeviceView('Mobile')}
              >
                Mobile
              </button>
            </div>
          </div>
        </div>

        <div className="posts-list">
          {posts.length === 0 ? (
            <div className="empty-state">
              Aucun post {activeTab.toLowerCase()} pour <strong>{platformName}</strong>.
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="post-item card">
                <div className="post-item-header">
                  <span className="post-item-platform">{platformName}</span>
                  <span className="post-item-status">{post.status}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="post-item-footer">
                  <span>{post.createdAt}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

