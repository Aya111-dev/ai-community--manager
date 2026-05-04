import React from 'react';
import PlatformWorkspace from '../common/PlatformWorkspace.jsx';

const FACEBOOK_META = {
  id: 'facebook',
  name: 'Facebook',
  color: '#1877f2',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
};

export default function FacebookApp({ posts, setPosts }) {
  return (
    <PlatformWorkspace
      meta={FACEBOOK_META}
      onBack={() => window.history.back()}
      posts={posts}
      setPosts={setPosts}
    />
  );
}