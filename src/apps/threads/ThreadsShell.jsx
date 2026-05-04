import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  Home,
  MessageSquare,
  Monitor,
  Plus,
  Smartphone,
  User
} from 'lucide-react';

export default function ThreadsShell({ counts, outletContext }) {
  const location = useLocation();
  const base = '/threads';
  const isDashboard = location.pathname.replace(/\/$/, '') === base;
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showStrategyCalendar, setShowStrategyCalendar] = useState(false);
  const [threadsPlatformLayout, setThreadsPlatformLayout] = useState('desktop');

  const navItems = [
    { label: 'Tableau', icon: BarChart3, to: base },
    { label: 'Flux', icon: Home, to: `${base}/home` },
    { label: 'Créer', icon: Plus, to: `${base}/create` },
    { label: 'Notifications', icon: Bell, to: `${base}/notifications` },
    { label: 'Commentaires', icon: MessageSquare, to: `${base}/comments` },
    { label: 'Profil', icon: User, to: `${base}/profile` },
    { label: 'Analytics', icon: BarChart3, to: `${base}/analytics` }
  ];

  const context = {
    ...outletContext,
    showCreateSection,
    setShowCreateSection,
    showStrategyCalendar,
    setShowStrategyCalendar,
    threadsPlatformLayout,
    setThreadsPlatformLayout
  };

  return (
    <div
      className={`tiktok-shell threads-shell${
        isDashboard ? ` shell-platform-layout-${threadsPlatformLayout}` : ''
      }`}
    >
      {isDashboard && (
        <header className="shell-topbar shell-topbar-dashboard threads-shell-topbar">
          <div className="shell-topbar-row">
            <div className="shell-topbar-left">
              <Link to={base} className="tiktok-brand threads-brand">
                <span className="tiktok-brand-logo">
                  <img
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/threads.svg"
                    alt="Threads logo"
                  />
                </span>
                <span className="tiktok-brand-text">Threads</span>
              </Link>

              <Link to="/" className="back-link">
                <ChevronLeft size={18} />
                Retourner
              </Link>
            </div>

            <div className="shell-topbar-actions">
              <div className="shell-topbar-actions-primary">
                <button
                  type="button"
                  className="strategy-button"
                  onClick={(e) => { e.preventDefault(); }}
                >
                  <CalendarDays size={16} />
                  Stratégie
                </button>

                <button
                  type="button"
                  className="create-button threads-create-button"
                  onClick={() => setShowCreateSection(true)}
                >
                <Plus size={16} />
                Créer un post
              </button>

              <div
                className="tiktok-platform-layout-switch tiktok-platform-layout-switch-inline threads-platform-layout-switch"
                role="group"
                aria-label="Affichage bureau ou mobile du tableau Threads"
              >
                <div className="tiktok-platform-layout-switch-buttons">
                  <button
                    type="button"
                    className={threadsPlatformLayout === 'desktop' ? 'active' : ''}
                    onClick={() => setThreadsPlatformLayout('desktop')}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    className={threadsPlatformLayout === 'mobile' ? 'active' : ''}
                    onClick={() => setThreadsPlatformLayout('mobile')}
                  >
                    Mobile
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <div
        className={`tiktok-shell-inner ${isDashboard ? 'no-sidebar' : ''} ${
          isDashboard ? `platform-layout-${threadsPlatformLayout}` : ''
        }`}
      >
        {!isDashboard && (
          <aside className="tiktok-nav threads-nav">
            <div className="nav-title">Menu Threads</div>
            <nav className="nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="nav-summary">
              <span className="summary-label">État du compte</span>
              <div className="summary-pill">
                <strong>{counts.published}</strong> publiés
              </div>
              <div className="summary-pill soft">
                <strong>{counts.scheduled}</strong> planifiés
              </div>
            </div>
          </aside>
        )}

        <main
          className={`tiktok-page threads-page ${isDashboard ? `tiktok-dashboard-main tiktok-dashboard-layout-${threadsPlatformLayout}` : ''}`}
        >
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
