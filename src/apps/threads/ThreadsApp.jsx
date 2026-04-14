import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const THREADS_META = {
  id: 'threads',
  name: 'Threads',
  color: '#000000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/threads.svg',
};

export default function ThreadsApp({ onBack }) {
  return <PlatformWorkspace meta={THREADS_META} onBack={onBack} />;
}

