import React from 'react';
import InstagramWorkspace from './components/InstagramWorkspace.jsx';
import './styles/instagram.css';

const INSTAGRAM_META = {
  id: 'instagram',
  name: 'Instagram',
  color: '#e1306c',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
};

export default function InstagramApp({ onBack }) {
  return <InstagramWorkspace meta={INSTAGRAM_META} onBack={onBack} />;
}
