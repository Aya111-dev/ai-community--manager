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

export default function TiktokShell({ counts, outletContext }) {
  const location = useLocation();
  const isDashboard = location.pathname.replace(/\/$/, '') === '/tiktok';
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showStrategyCalendar, setShowStrategyCalendar] = useState(false);
  const [tiktokPlatformLayout, setTiktokPlatformLayout] = useState('desktop');

  const navItems = [
    { label: 'Tableau', icon: BarChart3, to: '/tiktok' },
    { label: 'Flux', icon: Home, to: '/tiktok/home' },
    { label: 'Créer', icon: Plus, to: '/tiktok/create' },
    { label: 'Notifications', icon: Bell, to: '/tiktok/notifications' },
    { label: 'Commentaires', icon: MessageSquare, to: '/tiktok/comments' },
    { label: 'Profil', icon: User, to: '/tiktok/profile' },
    { label: 'Analytics', icon: BarChart3, to: '/tiktok/analytics' }
  ];

  const context = {
    ...outletContext,
    showCreateSection,
    setShowCreateSection,
    showStrategyCalendar,
    setShowStrategyCalendar,
    tiktokPlatformLayout,
    setTiktokPlatformLayout
  };

  return (
    <div
      className={`tiktok-shell${
        isDashboard ? ` shell-platform-layout-${tiktokPlatformLayout}` : ''
      }`}
    >
      {isDashboard && (
        <header className="shell-topbar shell-topbar-dashboard">
          <div className="shell-topbar-row">
            <div className="shell-topbar-left">
              <Link to="/tiktok" className="tiktok-brand">
                <span className="tiktok-brand-logo">
                  <img
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg"
                    alt="TikTok logo"
                  />
                </span>
                <span className="tiktok-brand-text">TikTok</span>
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
                  className="create-button"
                  onClick={() => setShowCreateSection(true)}
                >
                  <Plus size={16} />
                  Créer un post
                </button>

                              </div>
            </div>
          </div>
        </header>
      )}

      <div
        className={`tiktok-shell-inner ${isDashboard ? 'no-sidebar' : ''} ${
          isDashboard ? `platform-layout-${tiktokPlatformLayout}` : ''
        }`}
      >
        {!isDashboard && (
          <aside className="tiktok-nav">
            <div className="nav-title">Menu</div>
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
          className={`tiktok-page ${isDashboard ? `tiktok-dashboard-main tiktok-dashboard-layout-${tiktokPlatformLayout}` : ''}`}
        >
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}