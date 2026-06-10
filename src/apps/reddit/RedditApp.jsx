import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const REDDIT_META = {
  id: 'reddit',
  name: 'Reddit',
  color: '#ff4500',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg',
};

export default function RedditApp({ onBack }) {
  return <PlatformWorkspace meta={REDDIT_META} onBack={onBack} />;
}
