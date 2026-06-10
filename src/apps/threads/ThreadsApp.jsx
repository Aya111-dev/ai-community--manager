import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import '../tiktok/TiktokApp.css';
import '../tiktok/TiktokManualStyles.css';
import './ThreadsApp.css';
import ThreadsShell from './ThreadsShell.jsx';
import ThreadsDashboard from './pages/ThreadsDashboard.jsx';
import ThreadsFeed from './pages/ThreadsFeed.jsx';
import ThreadsCreate from './pages/ThreadsCreate.jsx';
import ThreadsProfile from './pages/ThreadsProfile.jsx';
import ThreadsNotifications from './pages/ThreadsNotifications.jsx';
import ThreadsAnalytics from './pages/ThreadsAnalytics.jsx';
import ThreadsComments from './pages/ThreadsComments.jsx';

const THREADS_POSTS_STORAGE_KEY = 'threads_posts_v1';

function getDefaultThreadItems() {
  return [
    {
      id: 'threads-demo-1',
      status: 'published',
      type: 'text',
      author: '@studio',
      body: 'Exemple de thread — réponses et republications apparaîtront ici.',
      likes: 4,
      replies: 1,
      reposts: 0,
      createdAt: new Date().toISOString()
    }
  ];
}

function loadThreadItems() {
  if (typeof window === 'undefined') return getDefaultThreadItems();
  try {
    const raw = window.localStorage.getItem(THREADS_POSTS_STORAGE_KEY);
    if (!raw) return getDefaultThreadItems();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultThreadItems();
  } catch (error) {
    console.error('Erreur localStorage Threads:', error);
    return getDefaultThreadItems();
  }
}

export default function ThreadsApp() {
  const [threadItems, setThreadItems] = useState(() => loadThreadItems());

  useEffect(() => {
    try {
      window.localStorage.setItem(THREADS_POSTS_STORAGE_KEY, JSON.stringify(threadItems));
    } catch (error) {
      console.error('Erreur sauvegarde Threads:', error);
    }
  }, [threadItems]);

  const counts = useMemo(
    () => ({
      drafts: threadItems.filter((item) => item.status === 'draft').length,
      scheduled: threadItems.filter((item) => item.status === 'scheduled').length,
      published: threadItems.filter((item) => item.status === 'published').length
    }),
    [threadItems]
  );

  const outletContext = {
    threadItems,
    setThreadItems
  };

  return (
    <div className="tiktok-app threads-app">
      <Routes>
        <Route path="/" element={<ThreadsShell counts={counts} outletContext={outletContext} />}>
          <Route index element={<ThreadsDashboard />} />
          <Route path="home" element={<ThreadsFeed />} />
          <Route path="create" element={<ThreadsCreate />} />
          <Route path="profile" element={<ThreadsProfile />} />
          <Route path="notifications" element={<ThreadsNotifications />} />
          <Route path="analytics" element={<ThreadsAnalytics />} />
          <Route path="comments" element={<ThreadsComments />} />
          <Route path="*" element={<Navigate replace to="/threads" />} />
        </Route>
      </Routes>
    </div>
  );
}
