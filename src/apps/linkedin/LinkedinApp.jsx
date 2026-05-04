import React from 'react';
import LinkedinWorkspace from './LinkedinWorkspace.jsx';

const LINKEDIN_META = {
  id: 'linkedin',
  name: 'LinkedIn',
  color: '#0a66c2',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
};

export default function LinkedinApp({ onBack }) {
  return <LinkedinWorkspace meta={LINKEDIN_META} onBack={onBack} />;
}
