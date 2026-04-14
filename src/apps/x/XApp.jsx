import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const X_META = {
  id: 'x',
  name: 'X',
  color: '#000000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg',
};

export default function XApp({ onBack }) {
  return <PlatformWorkspace meta={X_META} onBack={onBack} />;
}

