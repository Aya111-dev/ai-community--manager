import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

const sampleVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function FeedItem({ post, viewMode }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || post.mediaType !== 'video') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      },
      { threshold: 0.55 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [post.mediaType]);

  const hashtags = post.caption.match(/#\w+/g) || ['#TikTok', '#Marketing'];

  return (
    <article className="card feed-card">
      <div className={`device-frame ${viewMode}`}>
        <div className="device-content">
          <div className="device-header">
            <span>{post.type === 'story' ? 'Story' : 'Publication'}</span>
            <small>{post.visibility === 'public' ? 'Public' : 'Privé'}</small>
          </div>

          <div className="device-media">
            {post.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={sampleVideo}
                poster={post.contentPreview}
                muted
                loop
                playsInline
              />
            ) : (
              <img src={post.contentPreview} alt={post.title} />
            )}
          </div>

          <div className="device-overlay">
            <div className="feed-text">
              <span className="feed-title">{post.title}</span>
              <span className="feed-subtitle">{post.caption}</span>
            </div>

            <div className="feed-tags">
              {hashtags.slice(0, 3).map((tag) => (
                <span key={tag} className="hashtag-pill">
                  {tag}
                </span>
              ))}
            </div>

            <div className="feed-actions">
              <div className="action-column">
                <button type="button" className="action-button">
                  <Heart size={16} />
                  {post.metrics.likes}
                </button>
                <button type="button" className="action-button">
                  <MessageCircle size={16} />
                  {post.metrics.comments}
                </button>
                <button type="button" className="action-button">
                  <Share2 size={16} />
                  {post.metrics.shares}
                </button>
              </div>
              <div className="feed-labels">
                <small>@Vous</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TiktokHome() {
  const { posts } = useOutletContext();
  const [viewMode, setViewMode] = useState('mobile');

  const publishedPosts = posts
    .filter((post) => post.status === 'published')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Flux TikTok</h1>
          <p>Affichez vos posts dans une interface mobile/desktop fidèle à la maquette.</p>
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

        <div className="feed-list">
          {publishedPosts.map((post) => (
            <FeedItem key={post.id} post={post} viewMode={viewMode} />
          ))}
        </div>
      </article>
    </div>
  );
}