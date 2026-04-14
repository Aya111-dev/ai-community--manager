
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookApp from '../apps/facebook/FacebookApp.jsx';
import InstagramApp from '../apps/instagram/InstagramApp.jsx';
import LinkedinApp from '../apps/linkedin/LinkedinApp.jsx';
import PinterestApp from '../apps/pinterest/PinterestApp.jsx';
import ThreadsApp from '../apps/threads/ThreadsApp.jsx';
import TiktokApp from '../apps/tiktok/TiktokApp.jsx';
import XApp from '../apps/x/XApp.jsx';
import YoutubeApp from '../apps/Youtube/YoutubeApp.jsx';

const platforms = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877f2',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#e1306c',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg'
  },
  {
    id: 'x',
    name: 'X',
    color: '#000000',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0a66c2',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    color: '#e60023',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#ff0000',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg'
  },
  {
    id: 'threads',
    name: 'Threads',
    color: '#000000',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/threads.svg'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState('facebook');
  const [activeTab, setActiveTab] = useState('publiés');
  const [deviceView, setDeviceView] = useState('desktop');
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const platformRefs = useRef({});

  // Mock posts data - empty for now
  const posts = {
    publiés: [],
    planifiés: [],
    brouillons: []
  };

  useEffect(() => {
    const activeEl = platformRefs.current[activePlatform];
    if (activeEl?.scrollIntoView) {
      activeEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [activePlatform]);

  const platformName = platforms.find((platform) => platform.id === activePlatform)?.name || 'Platforme';
  const handlePlatformClick = (platform) => {
    if (platform.id === 'facebook') {
      navigate('/facebook');
      return;
    }

    setActivePlatform(platform.id);
    setActiveWorkspace(platform.id);
  };

  if (activeWorkspace) {
    const onBack = () => setActiveWorkspace(null);
    if (activeWorkspace === 'instagram') return <InstagramApp onBack={onBack} />;
    if (activeWorkspace === 'x') return <XApp onBack={onBack} />;
    if (activeWorkspace === 'linkedin') return <LinkedinApp onBack={onBack} />;
    if (activeWorkspace === 'tiktok') return <TiktokApp onBack={onBack} />;
    if (activeWorkspace === 'pinterest') return <PinterestApp onBack={onBack} />;
    if (activeWorkspace === 'youtube') return <YoutubeApp onBack={onBack} />;
    if (activeWorkspace === 'threads') return <ThreadsApp onBack={onBack} />;
    if (activeWorkspace === 'facebook') return <FacebookApp />;
  }

  return (
    <main className="homepage-screen">
      <header className="header-card card animation-fade-in">
        <div className="platforms-tabs">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              ref={(el) => { platformRefs.current[platform.id] = el; }}
              type="button"
              className={`platform-btn ${activePlatform === platform.id ? 'active' : ''}`}
              style={activePlatform === platform.id ? { borderColor: platform.color, color: platform.color } : { borderColor: '#e5e7eb' }}
              onClick={() => handlePlatformClick(platform)}
            >
              <span className="platform-icon" style={{ background: platform.color }}>
                <img src={platform.logoUrl} alt={`${platform.name} logo`} />
              </span>
              <span>{platform.name}</span>
            </button>
          ))}
        </div>
        <div className="header-actions" />
      </header>

      <section className="posts-card card">
        <div className="posts-card-header">
          <h2>Posts publiés</h2>
          <div className="posts-card-controls">
            <div className="posts-card-tabs">
              <button 
                className={`tab-pill ${activeTab === 'publiés' ? 'active' : ''}`}
                onClick={() => setActiveTab('publiés')}
              >
                Publiés
              </button>
              <button 
                className={`tab-pill ${activeTab === 'planifiés' ? 'active' : ''}`}
                onClick={() => setActiveTab('planifiés')}
              >
                Planifiés
              </button>
              <button 
                className={`tab-pill ${activeTab === 'brouillons' ? 'active' : ''}`}
                onClick={() => setActiveTab('brouillons')}
              >
                Brouillons
              </button>
            </div>
            <div className="device-toggle">
              <button 
                className={`device-pill ${deviceView === 'desktop' ? 'active' : ''}`}
                onClick={() => setDeviceView('desktop')}
              >
                Desktop
              </button>
              <button 
                className={`device-pill ${deviceView === 'mobile' ? 'active' : ''}`}
                onClick={() => setDeviceView('mobile')}
              >
                Mobile
              </button>
            </div>
          </div>
        </div>
        
        <div className="post-preview-container">
          {posts[activeTab].length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">+</div>
              <h3>Aucun {activeTab === 'publiés' ? 'post publié' : activeTab === 'planifiés' ? 'post planifié' : 'brouillon'}</h3>
              <p>Commencez par créer votre premier {activeTab === 'publiés' ? 'post' : activeTab === 'planifiés' ? 'post planifié' : 'brouillon'} pour {platformName}</p>
            </div>
          ) : (
            <div className={`post-preview ${deviceView}-view`}>
              <div className="post-preview-header">
                <div className="avatar-circle">FB</div>
                <div className="post-meta">
                  <strong>Votre Page</strong>
                  <span>Il y a 2 heures</span>
                </div>
                <button className="icon-button">...</button>
              </div>
              
              <div className="post-preview-media">
                Contenu du post publié...
              </div>
              
              <div className="post-preview-actions">
                <button className="preview-action">
                  <span>156</span> J'aime
                </button>
                <button className="preview-action">
                  <span>23</span> Commentaires
                </button>
                <button className="preview-action">
                  <span>5</span> Partages
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
