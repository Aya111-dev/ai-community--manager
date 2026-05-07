import React, { useState } from 'react';

const TABS = ['publiés', 'planifiés', 'brouillons'];
const DEVICES = ['desktop', 'mobile'];

export default function PlatformComingSoon({ meta, onBack }) {
  const [activeTab, setActiveTab] = useState('publiés');
  const [deviceView, setDeviceView] = useState('desktop');

  const platformName = meta?.name ?? 'Plateforme';

  return (
    <main className="homepage-screen">
      <header className="header-card card animation-fade-in">
        <div className="header-left">
          <button
            type="button"
            className="platform-btn active"
            style={meta?.color ? { borderColor: meta.color, color: meta.color } : undefined}
            aria-label={`${platformName} selectionne`}
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
            Retour
          </button>
        </div>

        <div className="header-actions" />
      </header>

      <section className="posts-card card">
        <div className="posts-card-header">
          <h2>Posts publiés</h2>
          <div className="posts-card-controls">
            <div className="posts-card-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'publiés' ? 'Publiés' : tab === 'planifiés' ? 'Planifiés' : 'Brouillons'}
                </button>
              ))}
            </div>
            <div className="device-toggle">
              {DEVICES.map((device) => (
                <button
                  key={device}
                  className={`device-pill ${deviceView === device ? 'active' : ''}`}
                  onClick={() => setDeviceView(device)}
                >
                  {device === 'desktop' ? 'Desktop' : 'Mobile'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="post-preview-container">
          <div className="empty-state">
            <div className="empty-state-icon">+</div>
            <h3>
              Aucun {activeTab === 'publiés' ? 'post publié' : activeTab === 'planifiés' ? 'post planifié' : 'brouillon'}
            </h3>
            <p>
              Cette plateforme n'utilise pas encore le système Facebook.
              Nous la construirons séparément plus tard pour {platformName}.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
