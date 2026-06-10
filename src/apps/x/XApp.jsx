import React from 'react';
import XWorkspace from './components/XWorkspace.jsx';
import './styles/x.css';

const X_META = {
  id: 'x',
  name: 'X',
  color: '#000000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg',
};

export default function XApp({ onBack }) {
  return <XWorkspace meta={X_META} onBack={onBack} />;
}

