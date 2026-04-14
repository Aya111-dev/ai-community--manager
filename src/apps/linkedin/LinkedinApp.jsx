import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const LINKEDIN_META = {
  id: 'linkedin',
  name: 'LinkedIn',
  color: '#0a66c2',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
};

export default function LinkedinApp({ onBack }) {
  return <PlatformWorkspace meta={LINKEDIN_META} onBack={onBack} />;
}

