import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TiktokShell from './TiktokShell.jsx';
import TiktokHome from './pages/TiktokHome.jsx';
import TiktokCreate from './pages/TiktokCreate.jsx';
import TiktokProfile from './pages/TiktokProfile.jsx';
import TiktokNotifications from './pages/TiktokNotifications.jsx';
import TiktokDashboard from './pages/TiktokDashboard.jsx';
import TiktokAnalytics from './pages/TiktokAnalytics.jsx';
import TiktokComments from './pages/TiktokComments.jsx';
import {
  generateAiCaption,
  generateMediaPlaceholder,
  initialComments,
  initialNotifications,
  initialPosts,
  profileInfo,
  suggestedCaptions,
  suggestedHashtags,
  suggestedIdeas,
  suggestedTips
} from './mockData.js';
import './TiktokApp.css';

const TIKTOK_META = {
  id: 'tiktok',
  name: 'TikTok',
  color: '#000000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg'
};

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const buildItem = (payload, status) => {
  const now = new Date().toISOString();

  return {
    id: createId('post'),
    type: payload.type,
    mediaType: payload.mediaType,
    title: payload.title || `${payload.type === 'story' ? 'Story' : 'Post'} ${payload.mediaType === 'photo' ? 'photo' : 'vidéo'}`,
    caption: payload.caption || (payload.prompt ? generateAiCaption(payload.prompt, payload.type, payload.mediaType) : ''),
    prompt: payload.prompt || '',
    mode: payload.mode || 'manual',
    status,
    visibility: payload.visibility || 'public',
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'published' ? now : null,
    scheduledAt: status === 'scheduled' ? payload.scheduledAt : payload.scheduledAt || null,
    deletedAt: null,
    contentPreview: payload.mediaPreview || generateMediaPlaceholder(payload.type, payload.mediaType),
    mediaName: payload.mediaName || (payload.mode === 'ai' ? 'AI generated asset' : 'Uploaded asset'),
    metrics: payload.metrics || {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      profileVisits: 0
    },
    commentsCount: payload.commentsCount ?? 0
  };
};

const purgeTrash = (posts) =>
  posts.filter((post) => {
    if (post.status !== 'trash') return true;
    if (!post.deletedAt) return false;
    return Date.now() - new Date(post.deletedAt).getTime() < TRASH_RETENTION_MS;
  });

export default function TiktokApp() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(initialPosts);
  const [comments, setComments] = useState(initialComments);
  const [notifications] = useState(initialNotifications);

  useEffect(() => {
    setPosts((current) => purgeTrash(current));
  }, []);

  const updatePosts = (updater) => {
    setPosts((current) => purgeTrash(updater(current)));
  };

  const createDraft = (payload) => updatePosts((current) => [...current, buildItem(payload, 'draft')]);
  const createScheduled = (payload) => updatePosts((current) => [...current, buildItem(payload, 'scheduled')]);
  const createPublished = (payload) => updatePosts((current) => [...current, buildItem(payload, 'published')]);

  const updatePost = (postId, updates) => {
    updatePosts((current) =>
      current.map((post) => (post.id !== postId ? post : { ...post, ...updates, updatedAt: new Date().toISOString() }))
    );
  };

  const moveToTrash = (postId) => updatePost(postId, { status: 'trash', deletedAt: new Date().toISOString() });
  const deleteForever = (postId) => setPosts((current) => current.filter((post) => post.id !== postId));
  const restorePost = (postId) => updatePost(postId, { status: 'draft', deletedAt: null, scheduledAt: null });
  const archivePost = (postId) => updatePost(postId, { status: 'archived', scheduledAt: null });
  const publishNow = (postId) => updatePost(postId, { status: 'published', publishedAt: new Date().toISOString(), scheduledAt: null });
  const schedulePost = (postId, scheduledAt) => updatePost(postId, { status: 'scheduled', scheduledAt });

  const addComment = ({ postId, text, author = 'Utilisateur' }) => {
    setComments((current) => [
      ...current,
      {
        id: createId('comment'),
        postId,
        author,
        text,
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const updateCommentStatus = (commentId, status) => {
    setComments((current) =>
      current.map((comment) => (comment.id === commentId ? { ...comment, status } : comment))
    );
  };

  const counts = useMemo(
    () => ({
      drafts: posts.filter((item) => item.status === 'draft').length,
      scheduled: posts.filter((item) => item.status === 'scheduled').length,
      published: posts.filter((item) => item.status === 'published').length,
      archived: posts.filter((item) => item.status === 'archived').length,
      trash: posts.filter((item) => item.status === 'trash').length
    }),
    [posts]
  );

  const outletContext = {
    posts,
    comments,
    notifications,
    profileInfo,
    suggestedCaptions,
    suggestedHashtags,
    suggestedIdeas,
    suggestedTips,
    createDraft,
    createPublished,
    createScheduled,
    publishNow,
    schedulePost,
    restorePost,
    archivePost,
    moveToTrash,
    deleteForever,
    updatePost,
    addComment,
    updateCommentStatus,
    generateAiCaption,
    generateMediaPlaceholder
  };

  return (
    <div className="tiktok-app">
      <Routes>
        <Route
          path="/"
          element={
            <TiktokShell meta={TIKTOK_META} counts={counts} outletContext={outletContext} />
          }
        >
          <Route index element={<TiktokDashboard />} />
          <Route path="home" element={<TiktokHome />} />
          <Route path="create" element={<TiktokCreate />} />
          <Route path="profile" element={<TiktokProfile />} />
          <Route path="notifications" element={<TiktokNotifications />} />
          <Route path="analytics" element={<TiktokAnalytics />} />
          <Route path="comments" element={<TiktokComments />} />
          <Route path="*" element={<Navigate replace to="/tiktok" />} />
        </Route>
      </Routes>
    </div>
  );
}