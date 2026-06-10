import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookApp from '../apps/facebook/FacebookApp.jsx';
import InstagramApp from '../apps/instagram/InstagramApp.jsx';
import LinkedinApp from '../apps/linkedin/LinkedinApp.jsx';
import PinterestApp from '../apps/pinterest/PinterestApp.jsx';
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
  const [activePlatform, setActivePlatform] = useState(null);
  const [activeTab, setActiveTab] = useState('publiés');
  const [deviceView, setDeviceView] = useState('desktop');
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaceEntering, setWorkspaceEntering] = useState(false);
  const platformRefs = useRef({});
  const workspaceTimerRef = useRef(null);

  // Mock posts data - empty for now
  const posts = {
    publiés: [],
    planifiés: [],
    brouillons: []
  };

  useEffect(() => {
    if (!activePlatform) return;
    const activeEl = platformRefs.current[activePlatform];
    if (activeEl?.scrollIntoView) {
      activeEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [activePlatform]);

  useEffect(() => {
    return () => {
      if (workspaceTimerRef.current) clearTimeout(workspaceTimerRef.current);
    };
  }, []);

  const hasSelectedPlatform = Boolean(activePlatform);
  const platformName = platforms.find((platform) => platform.id === activePlatform)?.name || 'votre reseau social';
  const emptyStateTitle = hasSelectedPlatform
    ? `Aucun ${activeTab === 'publiés' ? 'post publié' : activeTab === 'planifiés' ? 'post planifié' : 'brouillon'}`
    : 'Commencez votre premiere creation';
  const emptyStateDescription = hasSelectedPlatform
    ? `Commencez par creer votre premier ${activeTab === 'publiés' ? 'post' : activeTab === 'planifiés' ? 'post planifie' : 'brouillon'} pour ${platformName}`
    : 'Choisissez un reseau social, creez votre post avec l IA ou manuellement, et l application publie automatiquement au bon endroit.';

  const beginWorkspaceLaunch = (platform) => {
    if (workspaceTimerRef.current) clearTimeout(workspaceTimerRef.current);

    setActiveWorkspace(platform.id);
    setWorkspaceEntering(true);

    workspaceTimerRef.current = setTimeout(() => {
      setWorkspaceEntering(false);
    }, 520);
  };

  const handlePlatformClick = (platform) => {
    setActivePlatform(platform.id);

    if (platform.id === 'facebook') {
      navigate('/facebook');
      return;
    }

    if (platform.id === 'tiktok') {
      navigate('/tiktok', { state: { animateTopbar: true, fromHome: true } });
      return;
    }

    if (platform.id === 'threads') {
      navigate('/threads', { state: { animateTopbar: true, fromHome: true } });
      return;
    }

    if (platform.id === 'instagram' || platform.id === 'x' || platform.id === 'pinterest') {
      beginWorkspaceLaunch(platform);
      return;
    }

    setActiveWorkspace(platform.id);
  };

  if (activeWorkspace) {
    const onBack = () => {
      setActiveWorkspace(null);
      setWorkspaceEntering(false);
    };

    let workspace = null;
    if (activeWorkspace === 'instagram') workspace = <InstagramApp onBack={onBack} />;
    else if (activeWorkspace === 'x') workspace = <XApp onBack={onBack} />;
    else if (activeWorkspace === 'linkedin') workspace = <LinkedinApp onBack={onBack} />;
    else if (activeWorkspace === 'pinterest') workspace = <PinterestApp onBack={onBack} />;
    else if (activeWorkspace === 'youtube') workspace = <YoutubeApp onBack={onBack} />;
    else if (activeWorkspace === 'facebook') workspace = <FacebookApp />;

    if (workspace) {
      return (
        <div className={`workspace-transition-shell ${workspaceEntering ? 'entering' : ''}`}>
          {workspace}
        </div>
      );
    }
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
        <div className="post-preview-container">
          {posts[activeTab].length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">+</div>
              <h3>{emptyStateTitle}</h3>
              <p>{emptyStateDescription}</p>
              {!hasSelectedPlatform ? (
                <div className="empty-state-flow" role="note" aria-label="Parcours de creation">
                  <div className="empty-state-flow-step">
                    <span className="empty-state-flow-index">1</span>
                    <span>Choisissez un reseau</span>
                  </div>
                  <span className="empty-state-flow-arrow" aria-hidden="true">→</span>
                  <div className="empty-state-flow-step">
                    <span className="empty-state-flow-index">2</span>
                    <span>Creez votre post</span>
                  </div>
                  <span className="empty-state-flow-arrow" aria-hidden="true">→</span>
                  <div className="empty-state-flow-step">
                    <span className="empty-state-flow-index">3</span>
                    <span>Publication automatique</span>
                  </div>
                </div>
              ) : null}
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
