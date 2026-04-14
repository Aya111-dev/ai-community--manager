import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const PINTEREST_META = {
  id: 'pinterest',
  name: 'Pinterest',
  color: '#e60023',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg',
};

export default function PinterestApp({ onBack }) {
  return <PlatformWorkspace meta={PINTEREST_META} onBack={onBack} />;
}

