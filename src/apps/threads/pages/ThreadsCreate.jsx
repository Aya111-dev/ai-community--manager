import React, { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function ThreadsCreate() {
  const navigate = useNavigate();
  const { setShowCreateSection } = useOutletContext();

  useEffect(() => {
    setShowCreateSection(true);
    navigate('/threads', { replace: true });
  }, [navigate, setShowCreateSection]);

  return (
    <section className="tiktok-page">
      <article className="create-card threads-create-landing">
        <div className="create-card-top">
          <div>
            <p className="eyebrow">Composer</p>
            <h2>Ouverture du créateur Threads</h2>
          </div>
          <button type="button" className="button button-outline" onClick={() => navigate('/threads')}>
            ← Retour
          </button>
        </div>
        <p className="threads-create-hint">
          <Sparkles size={16} /> Redirection vers le tableau avec la même fenêtre de création que TikTok…
        </p>
      </article>
    </section>
  );
}
