import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const YOUTUBE_META = {
  id: 'youtube',
  name: 'YouTube',
  color: '#ff0000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
};

export default function YoutubeApp({ onBack }) {
  return <PlatformWorkspace meta={YOUTUBE_META} onBack={onBack} />;
}

