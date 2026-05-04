import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2 } from 'lucide-react';

function ThreadFeedCard({ post, viewMode }) {
  return (
    <article className="card feed-card threads-feed-card">
      <div className={`device-frame ${viewMode}`}>
        <div className="device-content threads-feed-device">
          <div className="device-header">
            <span>Thread</span>
            <small>{post.author}</small>
          </div>

          <div className="threads-feed-body-scroll">
            <p className="threads-feed-post-copy">{post.body}</p>
          </div>

          <div className="device-overlay threads-feed-overlay">
            <div className="feed-actions threads-feed-actions-row">
              <div className="action-column">
                <button type="button" className="action-button">
                  <Heart size={16} />
                  {post.likes}
                </button>
                <button type="button" className="action-button">
                  <MessageCircle size={16} />
                  {post.replies}
                </button>
                <button type="button" className="action-button">
                  <Repeat2 size={16} />
                  {post.reposts}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ThreadsFeed() {
  const { threadItems } = useOutletContext();
  const [viewMode, setViewMode] = useState('mobile');

  const publishedThreads = threadItems
    .filter((t) => t.status === 'published')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="dashboard-page threads-dashboard-page">
      <header className="page-header">
        <div>
          <h1>Flux Threads</h1>
          <p>Aperçu mobile ou desktop du fil, comme sur TikTok.</p>
        </div>
      </header>

      <article className="card">
        <div className="card-header">
          <div>
            <h3>Aperçu du flux</h3>
            <span>Basculer entre le format mobile et desktop.</span>
          </div>
          <div className="preview-switch">
            <button type="button" className={viewMode === 'mobile' ? 'active' : ''} onClick={() => setViewMode('mobile')}>
              Mobile
            </button>
            <button type="button" className={viewMode === 'desktop' ? 'active' : ''} onClick={() => setViewMode('desktop')}>
              Desktop
            </button>
          </div>
        </div>

        <div className="feed-list threads-feed-list">
          {publishedThreads.length === 0 ? (
            <p className="threads-feed-empty">Aucun thread publié pour l’instant.</p>
          ) : (
            publishedThreads.map((post) => <ThreadFeedCard key={post.id} post={post} viewMode={viewMode} />)
          )}
        </div>
      </article>
    </div>
  );
}
