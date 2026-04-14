import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const TIKTOK_META = {
  id: 'tiktok',
  name: 'TikTok',
  color: '#000000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
};

export default function TiktokApp({ onBack }) {
  return <PlatformWorkspace meta={TIKTOK_META} onBack={onBack} />;
}
