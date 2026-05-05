import React from 'react';
import { useNavigate } from 'react-router-dom';

const choices = [
  { title: 'Vidéo', route: '/tiktok/post/create' },
  { title: 'Image', route: '/tiktok/post/create' },
  { title: 'Story', route: '/tiktok/story/create' }
];

export default function TiktokCreateChoice() {
  const navigate = useNavigate();

  return (
    <section className="tiktok-page">
      <article className="create-card">
        <div className="create-card-top">
          <div>
            <p className="eyebrow">Création rapide</p>
            <h2>Choisis un format</h2>
          </div>
          <button className="action-btn-secondary outline" onClick={() => navigate('/tiktok')}>
            ← Retour
          </button>
        </div>

        <div className="create-choice-grid">
          {choices.map((choice) => (
            <button
              key={choice.title}
              type="button"
              className="choice-card"
              onClick={() => navigate(choice.route)}
            >
              <span className="choice-icon">{choice.title[0]}</span>
              <div>
                <strong>{choice.title}</strong>
                <p>Créer un post {choice.title.toLowerCase()}</p>
              </div>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
