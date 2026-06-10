import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function TiktokNotifications() {
  const { notifications } = useOutletContext();

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Affichez les interactions de votre compte et les suggestions marketing.</p>
        </div>
      </header>

      <section className="notifications-grid">
        {notifications.map((item) => (
          <article key={item.id} className="notification-card">
            <div className="notification-top">
              <div>
                <h3 className="notification-title">{item.title}</h3>
                <p className="notification-detail">{item.detail}</p>
              </div>
              <span className="notification-time">{item.time}</span>
            </div>
            <div className="tag-row">
              <span className={`status-pill ${item.type}`}>{item.type}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}