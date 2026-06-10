import React from 'react';

export default function ThreadsPlaceholder({ title, hint }) {
  return (
    <section className="dashboard-card" style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: '#6b7280', marginBottom: 0 }}>
        {hint || 'Section Threads — même navigation que TikTok, adaptée au format discussions.'}
      </p>
    </section>
  );
}
