// YoutubeApp.jsx - Version complète et finale

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Bell,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleOff,
  Captions,
  Flag,
  Info,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Repeat2,
  Search,
  ShieldAlert,
  Share2,
  SlidersHorizontal,
  Maximize,
  MonitorPlay,
  Monitor,
  Smartphone,
  ThumbsDown,
  ThumbsUp,
  Settings,
  Video,
  Volume2,
  VolumeX,
  ArrowDown,
} from 'lucide-react';
import './youtube.css';
import { generateContent, generateHashtags, generateMedia } from '../../services/api.js';
import { bustMediaUrl, mapPostTypeForApi } from '../../services/aiMediaHelpers.js';

const YOUTUBE_META = {
  id: 'youtube',
  name: 'YouTube',
  color: '#ff0000',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
};

const POST_TYPES = [
  { id: 'video', label: 'Vidéo', icon: '📹' },
  { id: 'shorts', label: 'Shorts', icon: '▶' },
];

function stableViewsFromId(id) {
  const str = String(id ?? '');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const n = Math.abs(hash % 9_000_000);
  return 100_000 + n;
}

function ShortsIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      style={{ display: 'block' }}
    >
      <path
        d="M14.5 3.5c-1.1-.6-2.4-.6-3.5 0L7.5 5.5c-.8.4-1.3 1.2-1.3 2.1v8.8c0 .9.5 1.7 1.3 2.1l3.5 2c1.1.6 2.4.6 3.5 0l3.5-2c.8-.4 1.3-1.2 1.3-2.1V7.6c0-.9-.5-1.7-1.3-2.1l-3.5-2z"
        fill="#ff0000"
        opacity="0.95"
      />
      <path d="M11 9v6l5-3-5-3z" fill="#fff" />
    </svg>
  );
}

function createMockPost({ id, type, title, channelName, duration }) {
  return {
    id,
    platformId: 'youtube',
    platformName: 'YouTube',
    status: 'Publié',
    type,
    channelName,
    title,
    description: '(Sans description)',
    hashtags: '',
    duration,
    mediaUrl: null,
    mediaType: 'image/*',
    createdAt: formatNowFr(new Date()),
  };
}

function getFallbackShorts() {
  return Array.from({ length: 10 }).map((_, i) =>
    createMockPost({
      id: `mock-short-${i}`,
      type: 'shorts',
      title: `Shorts #${i + 1} — Démo`,
      channelName: 'AI Community',
      duration: '0:19',
    }),
  );
}

function getFallbackVideos() {
  return Array.from({ length: 9 }).map((_, i) =>
    createMockPost({
      id: `mock-video-${i}`,
      type: 'video',
      title: `Vidéo #${i + 1} — Exemple de titre comme YouTube`,
      channelName: 'AI Community',
      duration: '3:17',
    }),
  );
}

function getInitialFakePosts() {
  return [
    {
      ...createMockPost({
        id: 'test-short-video',
        type: 'shorts',
        title: 'TEST Short Video - Vérification lecture',
        channelName: 'AI Community',
        duration: '0:19',
      }),
      description: 'Post de test short vidéo pour valider le lecteur.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'test-long-video',
        type: 'video',
        title: 'TEST Vidéo - Vérification lecture',
        channelName: 'AI Community',
        duration: '1:00',
      }),
      description: 'Post de test vidéo classique pour valider le lecteur.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'seed-short-1',
        type: 'shorts',
        title: 'Short Reel - Dance Vibes',
        channelName: 'AI Community',
        duration: '0:19',
      }),
      description: 'Short reel publie automatiquement pour demo.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://cdn.coverr.co/videos/coverr-a-young-man-rides-a-skateboard-1579/1080p.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'seed-video-1',
        type: 'video',
        title: 'Video - Music Session Live',
        channelName: 'AI Community',
        duration: '3:17',
      }),
      description: 'Video complete publiee automatiquement pour demo.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'seed-short-2',
        type: 'shorts',
        title: 'Short Reel - Urban Move',
        channelName: 'AI Community',
        duration: '0:22',
      }),
      description: 'Nouveau short reel avec vrai media.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://cdn.coverr.co/videos/coverr-typing-on-a-laptop-1579/1080p.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'seed-short-real-1',
        type: 'shorts',
        title: 'Short Reel - Real Video Test',
        channelName: 'AI Community',
        duration: '0:30',
      }),
      description: 'Short avec une vraie vidéo MP4 pour test de lecture.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'seed-video-2',
        type: 'video',
        title: 'Video - Creative Edit Tutorial',
        channelName: 'AI Community',
        duration: '4:02',
      }),
      description: 'Nouvelle video complete avec vrai media.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://cdn.coverr.co/videos/coverr-a-woman-walking-in-the-city-1579/1080p.mp4',
      mediaType: 'video/mp4',
    },
    {
      ...createMockPost({
        id: 'seed-short-3',
        type: 'shorts',
        title: 'Short Reel - Night City Lights',
        channelName: 'AI Community',
        duration: '0:21',
      }),
      description: 'Short reel ambience urbaine avec lumières de nuit.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://picsum.photos/id/1011/900/1600',
      mediaType: 'image/jpeg',
    },
    {
      ...createMockPost({
        id: 'seed-short-4',
        type: 'shorts',
        title: 'Short Reel - Street Motion',
        channelName: 'AI Community',
        duration: '0:24',
      }),
      description: 'Short reel dynamique style street lifestyle.',
      createdAt: 'Aujourd\'hui',
      status: 'Publié',
      mediaUrl: 'https://picsum.photos/id/1005/900/1600',
      mediaType: 'image/jpeg',
    },
  ];
}

function formatNowFr(date = new Date()) {
  const pad = (n) => `${n}`.padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function pickDefaultDuration(typeId) {
  return typeId === 'shorts' ? '0:19' : '3:17';
}

function inferMediaType({ file = null, url = '', fallback = 'image/*' } = {}) {
  const explicitType = String(file?.type || '').trim();
  if (explicitType) return explicitType;

  const source = String(url || '').toLowerCase().split('?')[0].split('#')[0];
  if (/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(source)) return 'video/mp4';
  if (/\.(png)$/i.test(source)) return 'image/png';
  if (/\.(gif)$/i.test(source)) return 'image/gif';
  if (/\.(webp)$/i.test(source)) return 'image/webp';
  if (/\.(jpe?g)$/i.test(source)) return 'image/jpeg';
  return fallback;
}

function isVideoMediaType(type = '') {
  return String(type || '').toLowerCase().startsWith('video/');
}

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const guessedType = inferMediaType({ file, url: file?.name ?? '', fallback: '' });
    if (!file || !isVideoMediaType(guessedType)) {
      resolve(pickDefaultDuration('video'));
      return;
    }
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60);
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      resolve(duration);
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      resolve(pickDefaultDuration('video'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
  });
}

function formatDurationFromSeconds(totalSeconds, typeId = 'video') {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return pickDefaultDuration(typeId);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function useResolvedPostDuration(post) {
  const fallbackType = post?.type === 'shorts' ? 'shorts' : 'video';
  const [resolvedDuration, setResolvedDuration] = useState(post?.duration || pickDefaultDuration(fallbackType));

  useEffect(() => {
    const resolvedType = inferMediaType({ url: post?.mediaUrl, fallback: post?.mediaType ?? 'image/*' });
    const isVideoMedia = !!post?.mediaUrl && isVideoMediaType(resolvedType);
    const initial = post?.duration || pickDefaultDuration(fallbackType);
    setResolvedDuration(initial);
    if (!isVideoMedia) return undefined;

    let cancelled = false;
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      if (cancelled) return;
      setResolvedDuration(formatDurationFromSeconds(el.duration, fallbackType));
    };
    el.onerror = () => {
      if (cancelled) return;
      setResolvedDuration(initial);
    };
    el.src = post.mediaUrl;

    return () => {
      cancelled = true;
      el.onloadedmetadata = null;
      el.onerror = null;
      el.src = '';
    };
  }, [post?.id, post?.duration, post?.mediaType, post?.mediaUrl, fallbackType]);

  return resolvedDuration;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==================== MODAL SHORTS GRAND FORMAT ====================
function ShortsPlayerModal({ post, onClose, onNext, onPrev, forceMobileLayout = false }) {
  const videoRef = useRef(null);
  const touchStartYRef = useRef(null);
  const dragStartYRef = useRef(null);
  const currentUser = 'Utilisateur';
  const commentsListRef = useRef(null);
  const [commentMenuOpenId, setCommentMenuOpenId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [replyMenuOpenKey, setReplyMenuOpenKey] = useState(null);
  const [editingReplyKey, setEditingReplyKey] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(1300);
  const [comments, setComments] = useState(9100);
  const [shares, setShares] = useState(1250);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShortOptions, setShowShortOptions] = useState(false);
  const [showShortDescription, setShowShortDescription] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [shortOptionNotice, setShortOptionNotice] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [wideLayout, setWideLayout] = useState(() =>
    forceMobileLayout ? false : (typeof window !== 'undefined' ? window.innerWidth >= 820 : true),
  );
  // When `forceMobileLayout` is enabled, we visually force the narrow layout without updating state.
  const effectiveWideLayout = forceMobileLayout ? false : wideLayout;
  const [commentList, setCommentList] = useState([
    {
      id: 1,
      user: 'DavianniGonzalez-f4c',
      text: 'Que bonita pareja me encanta sus videos ❤️❤️❤️',
      likes: 5,
      timestamp: '10 hours ago',
      likedByMe: false,
      dislikedByMe: false,
      replies: [
        { id: '1-r1', user: 'Maria', text: 'Totalement 😍', timestamp: '2 hours ago' },
      ],
      showReplies: false,
      isReplying: false,
      replyDraft: '',
    },
    {
      id: 2,
      user: 'PietroBarbosaDosSantos-q1d',
      text: 'os dois são o melhor casal do mundo',
      likes: 6,
      timestamp: '10 hours ago',
      likedByMe: false,
      dislikedByMe: false,
      replies: [{ id: '2-r1', user: 'Ana', text: 'Sim!!!', timestamp: '1 hour ago' }],
      showReplies: false,
      isReplying: false,
      replyDraft: '',
    },
    {
      id: 3,
      user: 'joa_king-z',
      text: 'Bom dia arthur',
      likes: 9,
      timestamp: '10 hours ago',
      likedByMe: false,
      dislikedByMe: false,
      replies: [{ id: '3-r1', user: 'Leo', text: 'Bom dia!', timestamp: '30 min ago' }],
      showReplies: false,
      isReplying: false,
      replyDraft: '',
    },
  ]);
  const displayDuration = useResolvedPostDuration(post);

  useEffect(() => {
    // Prevent page scroll / layout shift while typing
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (forceMobileLayout) return undefined;

    const onResize = () => setWideLayout(window.innerWidth >= 820);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [forceMobileLayout]);

  useEffect(() => {
    if (!shortOptionNotice) return undefined;
    const t = setTimeout(() => setShortOptionNotice(''), 1800);
    return () => clearTimeout(t);
  }, [shortOptionNotice]);

  useEffect(() => {
    if (!isDragActive) return undefined;
    const handleWindowMouseUp = () => {
      dragStartYRef.current = null;
      setIsDragActive(false);
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [isDragActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const syncPlaybackState = () => {
      setIsPlaying(!el.paused && !el.ended);
    };

    syncPlaybackState();
    el.addEventListener('play', syncPlaybackState);
    el.addEventListener('pause', syncPlaybackState);
    el.addEventListener('ended', syncPlaybackState);

    return () => {
      el.removeEventListener('play', syncPlaybackState);
      el.removeEventListener('pause', syncPlaybackState);
      el.removeEventListener('ended', syncPlaybackState);
    };
  }, [post?.id]);

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (el.paused || el.ended) {
        await el.play();
      } else {
        el.pause();
      }
      setIsPlaying(!el.paused && !el.ended);
    } catch {
      setIsPlaying(!el.paused && !el.ended);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    const next = !isMuted;
    setIsMuted(next);
    if (el) el.muted = next;
  };

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
      if (isDisliked) {
        setIsDisliked(false);
      }
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    } else {
      setIsDisliked(true);
      if (isLiked) {
        setLikes(prev => prev - 1);
        setIsLiked(false);
      }
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  const handleShare = () => {
    setShares(prev => prev + 1);
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.description }).catch(() => {});
    }
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: Date.now(),
        user: currentUser,
        text: commentText.trim(),
        likes: 0,
        timestamp: "À l'instant",
        likedByMe: false,
        dislikedByMe: false,
        replies: [],
        showReplies: false,
        isReplying: false,
        replyDraft: '',
      };
      setCommentList(prev => [...prev, newComment]);
      setComments(prev => prev + 1);
      setCommentText('');
    }
  };

  const toggleLikeComment = (commentId) => {
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const nextLiked = !c.likedByMe;
        const nextDisliked = nextLiked ? false : c.dislikedByMe;
        return {
          ...c,
          likedByMe: nextLiked,
          dislikedByMe: nextDisliked,
          likes: Math.max(0, (c.likes ?? 0) + (nextLiked ? 1 : -1)),
        };
      }),
    );
  };

  const toggleDislikeComment = (commentId) => {
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const nextDisliked = !c.dislikedByMe;
        const nextLiked = nextDisliked ? false : c.likedByMe;
        return {
          ...c,
          dislikedByMe: nextDisliked,
          likedByMe: nextLiked,
          likes: nextDisliked && c.likedByMe ? Math.max(0, (c.likes ?? 0) - 1) : c.likes,
        };
      }),
    );
  };

  const toggleReplies = (commentId) => {
    setCommentList((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, showReplies: !c.showReplies } : c)),
    );
  };

  const toggleReplyBox = (commentId) => {
    setCommentList((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isReplying: !c.isReplying } : c)),
    );
  };

  const updateReplyDraft = (commentId, value) => {
    setCommentList((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, replyDraft: value } : c)),
    );
  };

  const submitReply = (commentId) => {
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const text = (c.replyDraft ?? '').trim();
        if (!text) return c;
        const reply = {
          id: `${commentId}-r-${Date.now()}`,
          user: currentUser,
          text,
          timestamp: "À l'instant",
        };
        return {
          ...c,
          replies: [reply, ...(c.replies ?? [])],
          replyDraft: '',
          isReplying: false,
          showReplies: true,
        };
      }),
    );
  };

  const scrollComments = (direction) => {
    const el = commentsListRef.current;
    if (!el) return;
    const amount = Math.max(220, Math.floor(el.clientHeight * 0.8));
    el.scrollBy({ top: direction === 'down' ? amount : -amount, behavior: 'smooth' });
  };

  const runShortOption = (action) => {
    setShowShortOptions(false);
    if (action === 'description') {
      setShowShortDescription((v) => !v);
      setShortOptionNotice('Description toggled');
      return;
    }
    if (action === 'save') {
      setShortOptionNotice('Saved to playlist');
      window.alert('Saved to playlist');
      return;
    }
    if (action === 'captions') {
      const next = !captionsEnabled;
      setCaptionsEnabled(next);
      setShortOptionNotice(next ? 'Captions on' : 'Captions off');
      window.alert(next ? 'Captions enabled' : 'Captions disabled');
      return;
    }
    if (action === 'dontRecommend') {
      setShortOptionNotice("Channel won't be recommended");
      window.alert("Channel won't be recommended");
      onNext?.();
      return;
    }
    if (action === 'report') {
      setShortOptionNotice('Report sent');
      window.alert('Report sent');
      return;
    }
    if (action === 'feedback') {
      setShortOptionNotice('Thanks for feedback');
      window.alert('Thanks for feedback');
    }
  };

  const startEditComment = (comment) => {
    if (!comment || comment.user !== currentUser) return;
    setEditingCommentId(comment.id);
    setEditingText(comment.text ?? '');
    setCommentMenuOpenId(null);
  };

  const saveEditComment = () => {
    if (!editingCommentId) return;
    const nextText = editingText.trim();
    if (!nextText) return;
    setCommentList((prev) =>
      prev.map((comment) =>
        comment.id === editingCommentId && comment.user === currentUser
          ? { ...comment, text: nextText, timestamp: "Modifié" }
          : comment,
      ),
    );
    setEditingCommentId(null);
    setEditingText('');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteComment = (commentId) => {
    setCommentList((prev) => {
      const target = prev.find((comment) => comment.id === commentId);
      if (!target || target.user !== currentUser) return prev;
      setComments((c) => Math.max(0, c - 1));
      return prev.filter((comment) => comment.id !== commentId);
    });
  };

  const startEditReply = (commentId, reply) => {
    if (!reply || reply.user !== currentUser) return;
    setEditingReplyKey(`${commentId}:${reply.id}`);
    setEditingReplyText(reply.text ?? '');
    setReplyMenuOpenKey(null);
  };

  const cancelEditReply = () => {
    setEditingReplyKey(null);
    setEditingReplyText('');
  };

  const saveEditReply = () => {
    if (!editingReplyKey) return;
    const nextText = editingReplyText.trim();
    if (!nextText) return;
    const [commentIdStr, replyId] = editingReplyKey.split(':');
    const commentId = Number(commentIdStr);
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          replies: (c.replies ?? []).map((r) =>
            r.id === replyId && r.user === currentUser ? { ...r, text: nextText, timestamp: 'Modifié' } : r,
          ),
        };
      }),
    );
    setEditingReplyKey(null);
    setEditingReplyText('');
  };

  const deleteReply = (commentId, replyId) => {
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const target = (c.replies ?? []).find((r) => r.id === replyId);
        if (!target || target.user !== currentUser) return c;
        return { ...c, replies: (c.replies ?? []).filter((r) => r.id !== replyId) };
      }),
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const triggerVerticalNavigation = (deltaY) => {
    if (Math.abs(deltaY) < 50) return false;
    if (deltaY < 0) {
      onNext?.();
      return true;
    }
    onPrev?.();
    return true;
  };

  const handleShortTouchStart = (e) => {
    if (effectiveWideLayout) return;
    touchStartYRef.current = e.touches?.[0]?.clientY ?? null;
  };

  const handleShortTouchEnd = (e) => {
    if (effectiveWideLayout) return;
    const startY = touchStartYRef.current;
    const endY = e.changedTouches?.[0]?.clientY ?? null;
    touchStartYRef.current = null;
    if (startY == null || endY == null) return;
    triggerVerticalNavigation(endY - startY);
  };

  const handleShortMouseDown = (e) => {
    if (effectiveWideLayout || e.button !== 0) return;
    dragStartYRef.current = e.clientY;
    setIsDragActive(true);
  };

  const handleShortMouseMove = (e) => {
    if (effectiveWideLayout || !isDragActive || dragStartYRef.current == null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (triggerVerticalNavigation(deltaY)) {
      dragStartYRef.current = e.clientY;
    }
  };

  const handleShortMouseUp = (e) => {
    if (effectiveWideLayout || e.button !== 0) return;
    dragStartYRef.current = null;
    setIsDragActive(false);
  };

  const handleShortMouseLeave = () => {
    if (!isDragActive) return;
    dragStartYRef.current = null;
    setIsDragActive(false);
  };

  return (
    <>
      <div className="shorts-overlay" onClick={onClose}>
        <div
          className={`shorts-modal ${effectiveWideLayout ? 'wide' : 'narrow'} ${showComments && effectiveWideLayout ? 'comments-open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="shorts-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>

          <div className="shorts-video-wrap">
            <div
              className={`shorts-video ${!effectiveWideLayout ? 'shorts-video-mobile-gesture' : ''} ${isDragActive ? 'dragging' : ''}`}
              onTouchStart={handleShortTouchStart}
              onTouchEnd={handleShortTouchEnd}
              onMouseDown={handleShortMouseDown}
              onMouseMove={handleShortMouseMove}
              onMouseUp={handleShortMouseUp}
              onMouseLeave={handleShortMouseLeave}
            >
              {effectiveWideLayout ? (
                <div className="shorts-top-controls">
                  <button type="button" className="shorts-circle-dark" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <button type="button" className="shorts-circle-dark" onClick={toggleMute} aria-label={isMuted ? 'Activer le son' : 'Couper le son'}>
                    {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                </div>
              ) : (
                <div className="shorts-mobile-topbar">
                  <button type="button" className="shorts-circle-dark" onClick={onClose} aria-label="Retour">
                    <ChevronLeft size={19} />
                  </button>
                  <div className="shorts-mobile-top-right">
                    <button type="button" className="shorts-circle-dark" aria-label="Rechercher">
                      <Search size={19} />
                    </button>
                  </div>
                </div>
              )}
              <div className="shorts-top-right">
              <button
                type="button"
                className="shorts-circle-dark"
                aria-label="Options"
                onClick={() => {
                  setShowShortOptions((v) => !v);
                  setShortOptionNotice('');
                }}
              >
                  <MoreHorizontal size={17} />
                </button>
              {showShortOptions ? (
                <div className="shorts-options-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="shorts-options-item" role="menuitem" onClick={() => runShortOption('description')}>
                    <Info size={18} />
                    <span>Description</span>
                  </button>
                  <button type="button" className="shorts-options-item" role="menuitem" onClick={() => runShortOption('save')}>
                    <Bookmark size={18} />
                    <span>Save to playlist</span>
                  </button>
                  <button type="button" className="shorts-options-item" role="menuitem" onClick={() => runShortOption('captions')}>
                    <Captions size={18} />
                    <span>Captions</span>
                    <em>{captionsEnabled ? 'On' : 'Off'}</em>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="shorts-options-item" role="menuitem" onClick={() => runShortOption('dontRecommend')}>
                    <CircleOff size={18} />
                    <span>Don't recommend this channel</span>
                  </button>
                  <button type="button" className="shorts-options-item" role="menuitem" onClick={() => runShortOption('report')}>
                    <Flag size={18} />
                    <span>Report</span>
                  </button>
                  <button type="button" className="shorts-options-item" role="menuitem" onClick={() => runShortOption('feedback')}>
                    <ShieldAlert size={18} />
                    <span>Send feedback</span>
                  </button>
                </div>
              ) : null}
              </div>

              <div className="shorts-pill">{displayDuration}</div>

              {post.mediaUrl ? (
                post.mediaType?.startsWith('video/') ? (
                  <video
                    ref={videoRef}
                    src={post.mediaUrl}
                    muted={isMuted}
                    playsInline
                    autoPlay
                    loop
                    controls={false}
                    draggable={false}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <img src={post.mediaUrl} alt={post.title} draggable={false} />
                )
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  Aucun média
                </div>
              )}

              <div className="shorts-bottom-overlay">
                <div>
                  <div className="shorts-handle">
                    <span className="shorts-avatar">{post.channelName?.slice(0, 1)?.toUpperCase() || 'U'}</span>
                    <span>@{(post.channelName || 'Utilisateur').replace(/\s+/g, '')}</span>
                    <button type="button" className="shorts-subscribe" onClick={handleSubscribe}>
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  </div>
                {showShortDescription ? (
                  <div className="shorts-description">{post.description || 'Aucune description'}</div>
                ) : null}
                  <div className="shorts-user-line">Utilisateur: {post.channelName || 'Utilisateur'}</div>
                  <div className="shorts-tags">{post.hashtags?.trim() || '#shorts'}</div>
                </div>
              </div>
            {captionsEnabled ? <div className="shorts-captions">Auto captions enabled</div> : null}
            {shortOptionNotice ? <div className="shorts-toast">{shortOptionNotice}</div> : null}
            </div>
          </div>

          <div className="shorts-actions" aria-label="Actions">
            <div className="shorts-action-item">
              <button type="button" className={`shorts-circle ${isLiked ? 'active' : ''}`} onClick={handleLike} aria-label="Like">
                <ThumbsUp size={20} />
              </button>
              <div className="shorts-action-label">{formatNumber(likes)}</div>
            </div>

            <div className="shorts-action-item">
              <button type="button" className={`shorts-circle ${isDisliked ? 'active' : ''}`} onClick={handleDislike} aria-label="Dislike">
                <ThumbsDown size={20} />
              </button>
              <div className="shorts-action-label">Dislike</div>
            </div>

            <div className="shorts-action-item">
              <button type="button" className="shorts-circle" onClick={() => setShowComments(true)} aria-label="Commentaires">
                <MessageCircle size={20} />
              </button>
              <div className="shorts-action-label">{formatNumber(comments)}</div>
            </div>

            <div className="shorts-action-item">
              <button type="button" className="shorts-circle" onClick={handleShare} aria-label="Share">
                <Share2 size={20} />
              </button>
              <div className="shorts-action-label">Share</div>
            </div>

            <div className="shorts-action-item">
              <button type="button" className="shorts-circle" onClick={() => setShares((p) => p + 1)} aria-label="Remix">
                <Repeat2 size={20} />
              </button>
              <div className="shorts-action-label">{formatNumber(shares)}</div>
            </div>
          </div>

          {!effectiveWideLayout ? (
            <div className="shorts-mobile-scroll-arrows" aria-label="Navigation des shorts">
              <button type="button" className="shorts-mobile-arrow-btn" onClick={() => onPrev?.()} aria-label="Short précédent">
                <ChevronUp size={18} />
              </button>
              <button type="button" className="shorts-mobile-arrow-btn" onClick={() => onNext?.()} aria-label="Short suivant">
                <ChevronDown size={18} />
              </button>
            </div>
          ) : null}

          {effectiveWideLayout ? (
            <div className="shorts-right" aria-label="Navigation">
              {showComments ? (
                <section className="shorts-comments-panel" onClick={(e) => e.stopPropagation()}>
                  <header className="shorts-comments-header">
                    <div className="shorts-comments-title">
                      <strong>Comments</strong>
                      <span>{comments}</span>
                    </div>
                    <button type="button" className="shorts-comments-icon" aria-label="Filter">
                      <SlidersHorizontal size={18} />
                    </button>
                    <button
                      type="button"
                      className="shorts-comments-close"
                      onClick={() => setShowComments(false)}
                      aria-label="Fermer commentaires"
                    >
                      ✕
                    </button>
                  </header>

                  <div className="shorts-comments-list">
                    <div ref={commentsListRef} className="shorts-comments-scroll-area">
                    {commentList.map((comment) => (
                      <article key={comment.id} className="shorts-comment-item">
                        <div className="shorts-comment-avatar">{comment.user.charAt(0).toUpperCase()}</div>
                        <div className="shorts-comment-body">
                          <div className="shorts-comment-meta">
                            <strong>@{comment.user}</strong>
                            <span>{comment.timestamp}</span>
                            {comment.user === currentUser ? (
                              <div className="shorts-comment-menu-wrap">
                                <button
                                  type="button"
                                  className="shorts-comment-kebab"
                                  aria-label="Menu commentaire"
                                  onClick={() =>
                                    setCommentMenuOpenId((prev) => (prev === comment.id ? null : comment.id))
                                  }
                                >
                                  ⋯
                                </button>
                                {commentMenuOpenId === comment.id ? (
                                  <div className="shorts-comment-menu" role="menu">
                                    <button
                                      type="button"
                                      className="shorts-comment-menu-item"
                                      role="menuitem"
                                      onClick={() => startEditComment(comment)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="shorts-comment-menu-item danger"
                                      role="menuitem"
                                      onClick={() => {
                                        setCommentMenuOpenId(null);
                                        handleDeleteComment(comment.id);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div className="shorts-comment-menu-wrap">
                                <button type="button" className="shorts-comment-kebab" aria-label="Menu commentaire">
                                  ⋯
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="shorts-comment-edit">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={3}
                              />
                              <div className="shorts-comment-edit-actions">
                                <button type="button" onClick={cancelEditComment}>
                                  Cancel
                                </button>
                                <button type="button" onClick={saveEditComment} disabled={!editingText.trim()}>
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p>{comment.text}</p>
                          )}
                          <button type="button" className="shorts-translate">
                            Translate to Arabic
                          </button>
                          <div className="shorts-comment-actions-row">
                            <button
                              type="button"
                              className={`shorts-comment-action ${comment.likedByMe ? 'active' : ''}`}
                              aria-label="Like comment"
                              onClick={() => toggleLikeComment(comment.id)}
                            >
                              <ThumbsUp size={16} />
                              <span>{comment.likes ?? 0}</span>
                            </button>
                            <button
                              type="button"
                              className={`shorts-comment-action ${comment.dislikedByMe ? 'active' : ''}`}
                              aria-label="Dislike comment"
                              onClick={() => toggleDislikeComment(comment.id)}
                            >
                              <ThumbsDown size={16} />
                            </button>
                            <button type="button" className="shorts-comment-reply" onClick={() => toggleReplyBox(comment.id)}>
                              Reply
                            </button>
                          </div>
                          {comment.isReplying ? (
                            <div className="shorts-reply-box">
                              <input
                                value={comment.replyDraft ?? ''}
                                onChange={(e) => updateReplyDraft(comment.id, e.target.value)}
                                placeholder="Write a reply..."
                              />
                              <button type="button" onClick={() => submitReply(comment.id)} disabled={!(comment.replyDraft ?? '').trim()}>
                                Reply
                              </button>
                            </div>
                          ) : null}

                          {(comment.replies?.length ?? 0) > 0 ? (
                            <button type="button" className="shorts-replies" onClick={() => toggleReplies(comment.id)}>
                              <span>{comment.replies.length} reply</span>
                              <ChevronDown size={16} />
                            </button>
                          ) : null}

                          {comment.showReplies && (comment.replies?.length ?? 0) > 0 ? (
                            <div className="shorts-replies-list">
                              {comment.replies.map((r) => (
                                <div key={r.id} className="shorts-reply-item">
                                  <div className="shorts-comment-avatar">{r.user.charAt(0).toUpperCase()}</div>
                                  <div className="shorts-comment-body">
                                    <div className="shorts-comment-meta">
                                      <strong>@{r.user}</strong>
                                      <span>{r.timestamp}</span>
                                      {r.user === currentUser ? (
                                        <div className="shorts-comment-menu-wrap">
                                          <button
                                            type="button"
                                            className="shorts-comment-kebab"
                                            aria-label="Menu reply"
                                            onClick={() =>
                                              setReplyMenuOpenKey((prev) =>
                                                prev === `${comment.id}:${r.id}` ? null : `${comment.id}:${r.id}`,
                                              )
                                            }
                                          >
                                            ⋯
                                          </button>
                                          {replyMenuOpenKey === `${comment.id}:${r.id}` ? (
                                            <div className="shorts-comment-menu" role="menu">
                                              <button
                                                type="button"
                                                className="shorts-comment-menu-item"
                                                role="menuitem"
                                                onClick={() => startEditReply(comment.id, r)}
                                              >
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                className="shorts-comment-menu-item danger"
                                                role="menuitem"
                                                onClick={() => {
                                                  setReplyMenuOpenKey(null);
                                                  deleteReply(comment.id, r.id);
                                                }}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null}
                                    </div>
                                    {editingReplyKey === `${comment.id}:${r.id}` ? (
                                      <div className="shorts-comment-edit">
                                        <textarea
                                          value={editingReplyText}
                                          onChange={(e) => setEditingReplyText(e.target.value)}
                                          rows={3}
                                        />
                                        <div className="shorts-comment-edit-actions">
                                          <button type="button" onClick={cancelEditReply}>
                                            Cancel
                                          </button>
                                          <button type="button" onClick={saveEditReply} disabled={!editingReplyText.trim()}>
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p>{r.text}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    ))}
                    </div>
                  </div>

                  <footer className="shorts-comments-footer">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                    />
                    <button type="button" onClick={handleSubmitComment} disabled={!commentText.trim()}>
                      Add
                    </button>
                  </footer>

                  <div className="shorts-comments-scroll">
                    <button type="button" aria-label="Scroll up" onClick={() => scrollComments('up')}>
                      <ChevronUp size={20} />
                    </button>
                    <button type="button" aria-label="Scroll down" onClick={() => scrollComments('down')}>
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </section>
              ) : null}

              <button type="button" className={`shorts-next ${showComments ? 'hidden' : ''}`} onClick={() => onNext?.()} aria-label="Prochain Short">
                <ArrowDown size={24} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal Commentaires */}
      {showComments && !effectiveWideLayout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 2100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowComments(false)}
        >
          <div
            style={{
              background: 'white',
              width: '100%',
              maxWidth: 500,
              maxHeight: '70vh',
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 16, borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Commentaires ({formatNumber(comments)})</h3>
              <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e5e5e5', display: 'flex', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0 }}>
                {post.channelName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 12, padding: 12, fontSize: 14, resize: 'vertical' }}
                  rows={3}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                    style={{ background: !commentText.trim() ? '#ccc' : '#ff0000', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 20, fontSize: 14, cursor: 'pointer' }}
                  >
                    Commenter
                  </button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {commentList.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', flexShrink: 0 }}>
                    {comment.user.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{comment.user}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>{comment.timestamp}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14 }}>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== CARTE SHORT ====================
function ShortVideoCard({ post, onSelect, onEdit, onDelete }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  const views = post.views ?? stableViewsFromId(post.id);
  const displayDuration = useResolvedPostDuration(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasActions = !!onEdit || !!onDelete;

  return (
    <article
      className="yt-mobile-short-card"
      onClick={() => onSelect?.(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        onSelect?.(post);
      }}
    >
      <div className="yt-mobile-short-thumb">
        {post.mediaUrl ? (
          post.mediaType?.startsWith('video/') ? (
            <video
              src={post.mediaUrl}
              className="yt-mobile-short-media"
              muted
            />
          ) : (
            <img src={post.mediaUrl} alt={post.title} className="yt-mobile-short-media" />
          )
        ) : (
          <div className="yt-mobile-short-fallback">
            Shorts
          </div>
        )}

        <div className="yt-mobile-short-duration">{displayDuration}</div>
        <button
          type="button"
          className="yt-mobile-short-menu"
          aria-label="Options"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          ⋮
        </button>
        {menuOpen && hasActions ? (
          <div
            className="yt-menu yt-mobile-short-dropdown"
            role="menu"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onEdit ? (
              <button
                type="button"
                className="yt-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(post);
                }}
              >
                Modifier
              </button>
            ) : null}

            {onDelete ? (
              <button
                type="button"
                className="yt-menu-item yt-danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(post.id);
                }}
              >
                Supprimer
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="yt-mobile-short-title-overlay">{post.title || 'Sans titre'}</div>
      </div>

      <div className="yt-mobile-short-meta">
        <div className="yt-mobile-short-stats">
          {formatNumber(views)} vues
        </div>
      </div>
    </article>
  );
}

function ShortVideoCardDesktop({ post, onSelect, onEdit, onDelete }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const views = post.views ?? stableViewsFromId(post.id);
  const displayDuration = useResolvedPostDuration(post);
  const hasActions = !!onEdit || !!onDelete;

  return (
    <article
      className="yt-short-card"
      onClick={() => onSelect?.(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        onSelect?.(post);
      }}
      aria-label={`Ouvrir le Short: ${post.title || 'Sans titre'}`}
    >
      <div className="yt-short-thumb">
        {post.mediaUrl ? (
          post.mediaType?.startsWith('video/') ? (
            <video src={post.mediaUrl} muted />
          ) : (
            <img src={post.mediaUrl} alt={post.title} />
          )
        ) : (
          <div className="yt-short-thumb-fallback">Shorts</div>
        )}

        <div className="yt-short-duration">{displayDuration}</div>

        <button
          type="button"
          className="yt-kebab"
          aria-label="Options"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          ⋮
        </button>

        {menuOpen && hasActions && (
          <div
            className="yt-menu"
            role="menu"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onEdit ? (
              <button
                type="button"
                className="yt-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(post);
                }}
              >
                Modifier
              </button>
            ) : null}

            {onDelete ? (
              <button
                type="button"
                className="yt-menu-item yt-danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(post.id);
                }}
              >
                Supprimer
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="yt-short-meta">
        <div className="yt-short-title">{post.title || 'Sans titre'}</div>
        <div className="yt-short-sub">
          <span>{formatNumber(views)} vues</span>
        </div>
      </div>
    </article>
  );
}

function VideoCard({ post, onSelect, onEdit, onDelete }) {
  const views = post.views ?? stableViewsFromId(post.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasActions = !!onEdit || !!onDelete;
  const displayDuration = useResolvedPostDuration(post);
  return (
    <article className="yt-video-card" onClick={() => onSelect?.(post)} role="button" tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        onSelect?.(post);
      }}
      aria-label={`Ouvrir la vidéo: ${post.title || 'Sans titre'}`}
    >
      <div className="yt-thumb">
        <button
          type="button"
          className="yt-kebab"
          aria-label="Options video"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          ⋮
        </button>
        {menuOpen && hasActions ? (
          <div
            className="yt-menu"
            role="menu"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onEdit ? (
              <button
                type="button"
                className="yt-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(post);
                }}
              >
                Modifier
              </button>
            ) : null}

            {onDelete ? (
              <button
                type="button"
                className="yt-menu-item yt-danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(post.id);
                }}
              >
                Supprimer
              </button>
            ) : null}
          </div>
        ) : null}
        {post.mediaUrl ? (
          post.mediaType?.startsWith('video/') ? (
            <video
              src={post.mediaUrl}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={post.mediaUrl} alt={post.title} />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>
            Vidéo
          </div>
        )}
        <div className="yt-duration">{displayDuration}</div>
      </div>
      <div className="yt-meta">
        <div className="yt-channel" aria-hidden>
          {post.channelName?.slice(0, 1)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="yt-title">{post.title || 'Sans titre'}</div>
          <div className="yt-sub">
            <div>{post.channelName || 'Utilisateur'}</div>
            <div>
              {views.toLocaleString('fr-FR')} vues · {post.createdAt}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function YoutubeHomeFeed({ publishedShorts, publishedVideos, onSelect, onBack, onEditPost, onDeletePost, variant = 'desktop', allowFallback = true }) {
  const fallbackShorts = useMemo(() => getFallbackShorts(), []);

  const fallbackVideos = useMemo(() => getFallbackVideos(), []);

  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const shortsBase = publishedShorts.length > 0 ? publishedShorts : (allowFallback ? fallbackShorts : []);
  const videosBase = publishedVideos.length > 0 ? publishedVideos : (allowFallback ? fallbackVideos : []);

  const shorts = shortsBase.filter((p) => !hiddenIds.has(p.id));
  const videos = videosBase.filter((p) => !hiddenIds.has(p.id));
  const shortsSectionRef = useRef(null);

  const isMobile = variant === 'mobile';
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (post) => {
    if (!normalizedQuery) return true;
    const haystack = [
      post.title,
      post.channelName,
      post.description,
      post.hashtags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  };
  const filteredShorts = shorts.filter(matchesQuery);
  const filteredVideos = videos.filter(matchesQuery);

  return (
    <section className={`yt-shell ${isMobile ? 'yt-shell--mobile' : ''}`} aria-label={`Accueil YouTube (${variant})`}>
      {isMobile ? (
        <div className="yt-mobile-statusbar" aria-hidden>
          <span>09:53</span>
          <div className="yt-mobile-status-icons">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
      <div className="yt-topbar">
        {!isMobile && (
          <button type="button" className="yt-icon-btn" onClick={() => onBack?.()} aria-label="Retour">
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="yt-brand">
          <span className="yt-logo" aria-hidden />
          <span>YouTube</span>
        </div>

        {!isMobile && (
          <div className="yt-search" aria-label="Rechercher">
            <Search size={16} color="rgba(15,15,15,0.70)" />
            <input
              placeholder="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="yt-actions">
          {isMobile && (
            <button type="button" className="yt-icon-btn" aria-label="Rechercher">
              <Search size={18} />
            </button>
          )}
          <button type="button" className="yt-icon-btn" aria-label="Créer">
            <Video size={18} />
          </button>
          <button type="button" className="yt-icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>
      </div>

      <div className="yt-content">
        {isMobile ? (
          <div className="yt-search yt-search-mobile" aria-label="Rechercher" style={{ marginBottom: 10 }}>
            <Search size={16} color="rgba(15,15,15,0.70)" />
            <input
              placeholder="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : null}
        <div className="yt-section-title" ref={shortsSectionRef}>
          <h2 style={{ color: '#ff0000', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ShortsIcon size={18} />
            Shorts
          </h2>
          {isMobile ? <button type="button" className="yt-mobile-more" aria-label="Plus d'options">⋮</button> : <span className="yt-chip">Tout</span>}
        </div>
        <div className="yt-shorts-row" aria-label="Shorts">
          {filteredShorts.slice(0, 12).map((p) => (
            isMobile ? (
              <ShortVideoCard
                key={p.id}
                post={p}
                onSelect={(post) => onSelect?.(post, 'mobile')}
                onEdit={(post) => onEditPost?.(post)}
                onDelete={(id) => {
                  if (publishedShorts.some((x) => x.id === id)) onDeletePost?.(id);
                  setHiddenIds((prev) => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                  });
                }}
              />
            ) : (
              <ShortVideoCardDesktop
                key={p.id}
                post={p}
                onSelect={(post) => onSelect?.(post, 'desktop')}
                onEdit={(post) => onEditPost?.(post)}
                onDelete={(id) => {
                  if (publishedShorts.some((x) => x.id === id)) onDeletePost?.(id);
                  setHiddenIds((prev) => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                  });
                }}
              />
            )
          ))}
        </div>

        <div className="yt-section-title" style={{ marginTop: 6 }}>
          <h2>Vidéos</h2>
          {isMobile ? null : <span className="yt-chip">Recommandées</span>}
        </div>
        <div className="yt-videos-grid" aria-label="Vidéos">
          {filteredVideos.slice(0, 18).map((p) => (
            <VideoCard
              key={p.id}
              post={p}
              onSelect={onSelect}
              onEdit={(post) => onEditPost?.(post)}
              onDelete={(id) => {
                if (publishedVideos.some((x) => x.id === id)) onDeletePost?.(id);
                setHiddenIds((prev) => {
                  const next = new Set(prev);
                  next.add(id);
                  return next;
                });
              }}
            />
          ))}
        </div>
        {filteredShorts.length === 0 && filteredVideos.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 10 }}>
            {normalizedQuery
              ? `Aucun résultat pour "${searchQuery.trim()}".`
              : 'Aucun short ou vidéo dans cette catégorie.'}
          </div>
        ) : null}
      </div>
      {isMobile ? (
        <nav className="yt-mobile-bottom-nav" aria-label="Navigation mobile YouTube">
          <button type="button" className="yt-mobile-nav-item active">
            <span className="yt-mobile-nav-icon">⌂</span>
            <span>Home</span>
          </button>
          <button
            type="button"
            className="yt-mobile-nav-item"
            onClick={() =>
              shortsSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
          >
            <ShortsIcon size={18} />
            <span>Shorts</span>
          </button>
          <button type="button" className="yt-mobile-nav-create" aria-label="Créer">+</button>
          <button type="button" className="yt-mobile-nav-item">
            <Video size={18} />
            <span>Subscriptions</span>
          </button>
          <button type="button" className="yt-mobile-nav-item">
            <span className="yt-mobile-nav-avatar">A</span>
            <span>You</span>
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function YoutubeViewToggle({ value, onChange }) {
  return (
    <div className="yt-view-toggle" role="tablist" aria-label="Choisir la vue">
      <button
        type="button"
        className={`yt-view-pill ${value === 'Desktop' ? 'active' : ''}`}
        onClick={() => onChange('Desktop')}
        role="tab"
        aria-selected={value === 'Desktop'}
      >
        <Monitor size={14} />
        Desktop
      </button>
      <button
        type="button"
        className={`yt-view-pill ${value === 'Mobile' ? 'active' : ''}`}
        onClick={() => onChange('Mobile')}
        role="tab"
        aria-selected={value === 'Mobile'}
      >
        <Smartphone size={14} />
        Mobile
      </button>
    </div>
  );
}

// ==================== LECTURE VIDÉO NORMALE ====================
function VideoPlayer({ post, onClose }) {
  const videoRef = useRef(null);
  const modalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playerNotice, setPlayerNotice] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const syncPlaybackState = () => {
      setIsPlaying(!el.paused && !el.ended);
    };

    syncPlaybackState();
    el.addEventListener('play', syncPlaybackState);
    el.addEventListener('pause', syncPlaybackState);
    el.addEventListener('ended', syncPlaybackState);

    return () => {
      el.removeEventListener('play', syncPlaybackState);
      el.removeEventListener('pause', syncPlaybackState);
      el.removeEventListener('ended', syncPlaybackState);
    };
  }, [post?.id]);

  useEffect(() => {
    if (!playerNotice) return undefined;
    const t = window.setTimeout(() => setPlayerNotice(''), 1400);
    return () => window.clearTimeout(t);
  }, [playerNotice]);

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (el.paused || el.ended) {
        await el.play();
      } else {
        el.pause();
      }
      setIsPlaying(!el.paused && !el.ended);
    } catch {
      setIsPlaying(!el.paused && !el.ended);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    setIsMuted(next);
    el.muted = next;
  };

  const toggleCaptions = () => {
    setCaptionsEnabled((prev) => {
      const next = !prev;
      setPlayerNotice(next ? 'Sous-titres activés' : 'Sous-titres désactivés');
      return next;
    });
  };

  const applyPlaybackRate = (rate) => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    setPlayerNotice(`Vitesse ${rate}x`);
  };

  const handleSeek = (e) => {
    const el = videoRef.current;
    if (!el) return;
    const nextTime = Number(e.target.value);
    el.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleFullscreen = async () => {
    const el = modalRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // no-op
    }
  };

  return (
    <div className="yt-video-overlay" onClick={onClose}>
      <div className={`yt-video-modal ${isCinemaMode ? 'cinema' : ''}`} ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <button className="yt-video-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <div className="yt-video-title">{post.title || 'Video title'}</div>

        {post.mediaType?.startsWith('video/') ? (
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              className="yt-video-media"
              autoPlay
              muted={isMuted}
              controls={false}
              onLoadedMetadata={(e) => setDurationSeconds(e.currentTarget.duration || 0)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <button
              type="button"
              className="yt-video-center-toggle"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={26} /> : <Play size={26} />}
            </button>
          </>
        ) : (
          <img src={post.mediaUrl} alt={post.title} className="yt-video-media" />
        )}

        <div className="yt-video-bottom">
          <div className="yt-video-progress-top-dot" />
          <input
            type="range"
            min="0"
            max={durationSeconds || 0}
            step="0.1"
            value={Math.min(currentTime, durationSeconds || 0)}
            onChange={handleSeek}
            className="yt-video-seek"
            style={{
              '--yt-fill': `${durationSeconds > 0 ? (Math.min(currentTime, durationSeconds) / durationSeconds) * 100 : 0}%`,
            }}
            aria-label="Progression vidéo"
          />
          <div className="yt-video-row">
            <div className="yt-video-left-controls">
              <button type="button" className="yt-video-action yt-video-action-pill" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button type="button" className="yt-video-action yt-video-action-pill" onClick={toggleMute} aria-label={isMuted ? 'Activer le son' : 'Couper le son'}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div className="yt-video-time">
                {formatTime(currentTime)} / {formatTime(durationSeconds)}
              </div>
            </div>
            <div className="yt-video-right-controls">
              <button
                type="button"
                className={`yt-video-action ${captionsEnabled ? 'active' : ''}`}
                onClick={toggleCaptions}
                aria-label="Sous-titres"
              >
                <Captions size={17} />
              </button>
              <button
                type="button"
                className={`yt-video-action ${showSettings ? 'active' : ''}`}
                aria-label="Paramètres"
                onClick={() => setShowSettings((v) => !v)}
              >
                <Settings size={17} />
              </button>
              <button
                type="button"
                className={`yt-video-action ${isCinemaMode ? 'active' : ''}`}
                aria-label="Mode cinéma"
                onClick={() => {
                  setIsCinemaMode((v) => !v);
                  setPlayerNotice(!isCinemaMode ? 'Mode cinéma activé' : 'Mode cinéma désactivé');
                }}
              >
                <MonitorPlay size={17} />
              </button>
              <button type="button" className="yt-video-action" aria-label="Plein écran" onClick={toggleFullscreen}>
                <Maximize size={17} />
              </button>
            </div>
          </div>

          {showSettings ? (
            <div className="yt-video-settings-menu" role="menu" aria-label="Paramètres du lecteur">
              <div className="yt-video-settings-title">Vitesse de lecture</div>
              <div className="yt-video-settings-options">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`yt-video-settings-option ${playbackRate === rate ? 'active' : ''}`}
                    onClick={() => applyPlaybackRate(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {captionsEnabled ? <div className="yt-video-captions">Sous-titres automatiques activés</div> : null}
          {playerNotice ? <div className="yt-video-toast">{playerNotice}</div> : null}
        </div>
      </div>
    </div>
  );
}

// ==================== CHOIX DU TYPE DE POST ====================
function PostTypePickerInline({ platformName, value, onChange }) {
  return (
    <section className="post-types-card card animation-slide-up" aria-label="Choisir le type de post">
      <div className="post-types-header">
        <div className="avatar-small">U</div>
        <div className="prompt-text">Que souhaitez-vous publier ?</div>
        <div style={{ marginLeft: 'auto', color: 'var(--text-light)', fontSize: 12 }}>{platformName}</div>
      </div>
      <div className="post-types-grid" role="list" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {POST_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            className="post-type-box hover-lift"
            onClick={() => onChange(type.id)}
            aria-label={`Créer un post ${type.label} sur ${platformName}`}
            style={
              value === type.id
                ? {
                    borderColor: 'rgba(109, 40, 217, 0.25)',
                    boxShadow: '0 12px 24px rgba(2, 6, 23, 0.10)',
                    color: 'var(--text-main)',
                  }
                : undefined
            }
          >
            <div style={{ fontSize: 18 }}>{type.icon}</div>
            <div>{type.label}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ==================== PAGE D'ACCUEIL CRÉATION ====================
function YoutubeCreateLanding({ platformMeta, onBack, onPickType, publishedPosts, onSelect, onEditPost }) {
  const [publishedDeviceView, setPublishedDeviceView] = React.useState('Desktop');
  const publishedShorts = React.useMemo(
    () => publishedPosts.filter((p) => p.status === 'Publié' && p.type === 'shorts'),
    [publishedPosts],
  );
  const publishedVideos = React.useMemo(
    () => publishedPosts.filter((p) => p.status === 'Publié' && p.type === 'video'),
    [publishedPosts],
  );
  const showPublishedMobile = publishedDeviceView === 'Mobile';

  return (
    <section className="posts-card card animation-slide-up">
      <div className="posts-card-header" style={{ marginBottom: 0 }}>
        <h2>Créer un post</h2>
        <div className="posts-card-controls">
          <button type="button" className="action-btn-secondary outline" onClick={onBack}>
            ← Retour
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <PostTypePickerInline platformName={platformMeta.name} value={null} onChange={onPickType} />

        <section className="card shadowless" style={{ padding: 18 }}>
          <div className="posts-card-header" style={{ marginBottom: 16 }}>
            <h2>Posts déjà publiés</h2>
            <YoutubeViewToggle value={publishedDeviceView} onChange={setPublishedDeviceView} />
          </div>

          {publishedPosts.length === 0 ? (
            <div style={{ color: 'var(--text-light)', padding: '18px 0' }}>
              Aucun post publié pour l'instant.
            </div>
          ) : (
            showPublishedMobile ? (
              <div className="yt-phone-frame">
                <section className="yt-shell yt-shell--mobile" aria-label="Posts publiés mobile">
                  <div className="yt-content">
                    {publishedShorts.length > 0 ? (
                      <>
                        <div className="yt-section-title">
                          <h2 style={{ color: '#ff0000', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <ShortsIcon size={18} />
                            Shorts
                          </h2>
                          <button type="button" className="yt-mobile-more" aria-label="Plus d'options">⋮</button>
                        </div>
                        <div className="yt-shorts-row" aria-label="Shorts publiés">
                          {publishedShorts.map((post) => (
                            <ShortVideoCard
                              key={post.id}
                              post={post}
                              onSelect={(p) => onSelect?.(p, 'mobile')}
                              onEdit={(p) => onEditPost?.(p)}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}

                    {publishedVideos.length > 0 ? (
                      <>
                        <div className="yt-section-title" style={{ marginTop: 6 }}>
                          <h2>Vidéos</h2>
                        </div>
                        <div className="yt-videos-grid" aria-label="Vidéos publiées">
                          {publishedVideos.map((post) => (
                            <VideoCard
                              key={post.id}
                              post={post}
                              onSelect={(p) => onSelect?.(p, 'mobile')}
                              onEdit={(p) => onEditPost?.(p)}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 20 }}>
                {publishedShorts.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 12 }}>Shorts publiés</div>
                    <div className="yt-published-shorts-grid desktop">
                      {publishedShorts.map((post) => (
                        <ShortVideoCardDesktop
                          key={post.id}
                          post={post}
                          onSelect={(p) => onSelect?.(p, 'desktop')}
                          onEdit={(p) => onEditPost?.(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {publishedVideos.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 12 }}>Vidéos publiées</div>
                    <div className="yt-published-videos-grid desktop">
                      {publishedVideos.map((post) => (
                        <PublishedPostCard
                          key={post.id}
                          post={post}
                          onSelect={(p) => onSelect?.(p, 'desktop')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </section>
      </div>
    </section>
  );
}

// ==================== CARTE POST PUBLIÉ ====================
function PublishedPostCard({ post, onSelect }) {
  const isShort = post.type === 'shorts';
  const displayDuration = useResolvedPostDuration(post);
  
  return (
    <article
      className="hover-lift"
      onClick={() => onSelect?.(post)}
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(15, 23, 42, 0.10)',
        background: 'white',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ aspectRatio: isShort ? '9 / 16' : '16 / 9', background: '#0f172a' }}>
          {post.mediaUrl && (
            post.mediaType?.startsWith('video/') ? (
              <video
                src={post.mediaUrl}
                muted
                playsInline
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            padding: '4px 8px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {displayDuration}
        </div>
        {isShort && (
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: 8,
              padding: '2px 8px',
              borderRadius: 12,
              background: '#ff0000',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            Shorts
          </div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ 
          fontWeight: 900, 
          fontSize: isShort ? 13 : 14, 
          marginBottom: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.title}
        </div>
        <div style={{ color: 'var(--text-light)', fontSize: 12 }}>
          {post.channelName || 'Utilisateur'}
        </div>
      </div>
    </article>
  );
}

// ==================== PAGE DE CRÉATION DE POST ====================
function YoutubeCreatePostPage({
  platformMeta,
  initialType,
  initialPost,
  onBackToList,
  onBackToTypeSelect,
  onCreatePost,
  onUpdatePost,
}) {
  const effectiveType = initialPost?.type ?? initialType ?? 'video';
  const isEditing = !!initialPost;

  const [postType, _setPostType] = React.useState(effectiveType);
  const [channelName, _setChannelName] = React.useState(initialPost?.channelName ?? 'Utilisateur');
  const [title, setTitle] = React.useState(initialPost?.title ?? '');
  const [description, setDescription] = React.useState(initialPost?.description ?? '');
  const [prompt, setPrompt] = React.useState('');
  const [hashtags, setHashtags] = React.useState(initialPost?.hashtags ?? '');
  const [duration, setDuration] = React.useState(initialPost?.duration ?? pickDefaultDuration(effectiveType));
  const [scheduledAt, setScheduledAt] = React.useState('');
  const [media, setMedia] = React.useState(() => {
    if (!initialPost?.mediaUrl) return [];
    const inferredType = inferMediaType({ url: initialPost?.mediaUrl, fallback: initialPost?.mediaType ?? 'image/*' });
    return [
      {
        id: `edit-${initialPost.id}`,
        file: null,
        url: initialPost.mediaUrl,
        size: 0,
        type: inferredType,
        duration: initialPost.duration ?? pickDefaultDuration(initialPost.type ?? effectiveType),
      },
    ];
  });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const [createdAt] = React.useState(() => initialPost?.createdAt ?? formatNowFr(new Date()));

  const typeLabel = React.useMemo(() => {
    const found = POST_TYPES.find((t) => t.id === postType);
    return found?.label ?? 'Post';
  }, [postType]);

  const canPublish = title.trim().length > 0 && media.length > 0;

  React.useEffect(() => {
    if (isEditing) return undefined;
    setDuration(pickDefaultDuration(postType));
    setMedia([]);
    return undefined;
  }, [postType, isEditing]);

  const openFilePicker = () => fileInputRef.current?.click();

  const goBack = () => {
    onBackToTypeSelect?.();
    if (onBackToTypeSelect) return;
    onBackToList?.();
  };

  const hasUnsavedChanges = isEditing
    ? // In edit mode, don't consider the presence of `media` as a change.
      (!!prompt.trim() ||
        title.trim() !== String(initialPost?.title ?? '').trim() ||
        description.trim() !== String(initialPost?.description ?? '').trim() ||
        hashtags.trim() !== String(initialPost?.hashtags ?? '').trim() ||
        String(duration ?? '').trim() !== String(initialPost?.duration ?? '').trim() ||
        String(media?.[0]?.url ?? '') !== String(initialPost?.mediaUrl ?? ''))
    : !!(prompt.trim() || title.trim() || description.trim() || hashtags.trim() || media.length > 0);

  const onFilesPicked = async (files) => {
    const picked = Array.from(files ?? []);
    if (picked.length === 0) return;
    const file = picked[0];
    const url = URL.createObjectURL(file);
    
    const inferredType = inferMediaType({ file, url: file?.name ?? '', fallback: 'image/*' });
    let autoDuration = duration;
    if (isVideoMediaType(inferredType)) {
      autoDuration = await getVideoDuration(file);
      setDuration(autoDuration);
    }
    
    setMedia([
      {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
        file,
        url,
        size: file.size,
        type: inferredType,
        duration: autoDuration,
      },
    ]);
  };

  const removeMedia = (id) => {
    setMedia((prev) => {
      const toRemove = prev.find((m) => m.id === id);
      if (toRemove?.url?.startsWith('blob:')) URL.revokeObjectURL(toRemove.url);
      return prev.filter((m) => m.id !== id);
    });
  };

  const normalizeForTag = (word) =>
    String(word ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 22);

  const STOPWORDS = React.useMemo(
    () =>
      new Set([
        'avec',
        'sans',
        'dans',
        'sur',
        'pour',
        'par',
        'et',
        'ou',
        'de',
        'du',
        'des',
        'la',
        'le',
        'les',
        'un',
        'une',
        'au',
        'aux',
        'en',
        'chez',
        'plus',
        'très',
        'tres',
        'comment',
        'quoi',
        'pourquoi',
        'quand',
        'où',
        'ou',
        'ça',
        'ca',
        'cest',
        'cette',
        'cet',
        'cette',
        'ce',
        'il',
        'elle',
        'ils',
        'elles',
        'je',
        'tu',
        'nous',
        'vous',
        'on',
        'mon',
        'ma',
        'mes',
        'ton',
        'ta',
        'tes',
        'son',
        'sa',
        'ses',
        'votre',
        'vos',
        'notre',
        'nos',
        'leur',
        'leurs',
        'pro',
        'projet',
      ]),
    [],
  );

  const extractKeywords = (text) => {
    const cleaned = String(text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return [];

    const words = cleaned
      .split(' ')
      .map((w) => w.trim())
      .filter(Boolean)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    const freq = new Map();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w)
      .slice(0, 10);
  };

  const truncateWithEllipsis = (value, maxLen) => {
    const s = String(value ?? '').trim();
    if (s.length <= maxLen) return s;
    return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
  };

  const buildTitle = (subject, typeId) => {
    const s = truncateWithEllipsis(subject, typeId === 'shorts' ? 58 : 78);
    return typeId === 'shorts' ? `Short AI: ${s}` : `Vidéo AI: ${s}`;
  };

  const buildCaption = (subject, typeId, keywords) => {
    const main = keywords?.[0] ? keywords[0] : subject;
    const mainHuman = String(main ?? '').replace(/-/g, ' ');
    if (typeId === 'shorts') {
      return [
        `🔥 ${subject}`,
        '',
        `En 60 secondes :`,
        `- Comprendre ${mainHuman}`,
        `- Appliquer un exemple simple`,
        `- Résumer l'essentiel`,
        '',
        `Abonne-toi pour plus de contenus !`,
      ].join('\n');
    }

    return [
      `🎥 ${subject}`,
      '',
      `On détaille ${mainHuman} étape par étape :`,
      `1) Les bases`,
      `2) La méthode`,
      `3) Les erreurs à éviter`,
      '',
      `N'oublie pas de liker et t'abonner.`,
    ].join('\n');
  };

  const buildHashtags = (subject, typeId, keywords) => {
    const base = typeId === 'shorts' ? ['#shorts', '#youtubeshorts'] : ['#youtube', '#video'];
    const aiBase = ['#AI', '#AICommunity'];
    const kTags = (keywords ?? []).slice(0, 8).map((k) => `#${normalizeForTag(k)}`).filter((t) => t !== '#');
    const extra = normalizeForTag(subject).length > 0 ? [`#${normalizeForTag(subject.split(' ')[0])}`] : [];

    const uniq = new Set([...base, ...aiBase, ...kTags, ...extra].filter((t) => t && t.length > 2));
    // limit count for readability
    return [...uniq].slice(0, 14).join(' ');
  };

  const generateWithAI = async () => {
    const subject = prompt.trim();
    if (!subject) return;

    setIsGenerating(true);
    try {
      const apiPostType = mapPostTypeForApi(postType === 'shorts' ? 'reel' : 'video');
      const isRegenerate = Boolean(title.trim() || description.trim() || hashtags.trim() || media.length);
      const results = await Promise.allSettled([
        generateContent({ description: subject, platform: 'youtube', postType, regenerate: isRegenerate }),
        generateHashtags({ description: subject, platform: 'youtube', postType, regenerate: isRegenerate }),
        generateMedia({ description: subject, platform: 'youtube', postType: apiPostType, count: 1, regenerate: isRegenerate }),
      ]);

      if (results[0].status === 'fulfilled') {
        const content = results[0].value.contenu || '';
        setDescription(content);
        const firstLine = content.split('\n').map((line) => line.trim()).find(Boolean);
        setTitle(firstLine || buildTitle(subject, postType));
      } else {
        throw results[0].reason;
      }

      if (results[1].status === 'fulfilled') {
        setHashtags(results[1].value.hashtags);
      } else {
        alert(results[1].reason?.message || 'La génération des hashtags a échoué');
      }

      if (results[2].status === 'fulfilled' && results[2].value.media?.[0]) {
        const item = results[2].value.media[0];
        const isVideo = item.type === 'video';
        setMedia([
          {
            id: `ai-${Date.now()}`,
            file: null,
            url: bustMediaUrl(item.url),
            size: 0,
            type: isVideo ? 'video/mp4' : 'image/jpeg',
            duration: pickDefaultDuration(postType),
          },
        ]);
      } else if (results[2].status === 'rejected') {
        alert(results[2].reason?.message || 'La génération des médias a échoué');
      }

      setDuration(pickDefaultDuration(postType));
    } catch (error) {
      alert(error.message || 'Erreur de génération IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const publish = (status) => {
    const baseCreatedAt = initialPost?.createdAt ?? formatNowFr(new Date());
    const nextCreatedAt =
      status === 'Planifié'
        ? scheduledAt
          ? scheduledAt.replace('T', ' ')
          : baseCreatedAt
        : baseCreatedAt;

    const payload = {
      id: initialPost?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      platformId: platformMeta.id,
      platformName: platformMeta.name,
      status,
      type: postType,
      channelName: channelName.trim() || 'Utilisateur',
      title: title.trim() || '(Sans titre)',
      description: description.trim() || '(Sans description)',
      hashtags: hashtags.trim(),
      duration: duration.trim() || pickDefaultDuration(postType),
      views: initialPost?.views ?? stableViewsFromId(`${Date.now()}-${postType}-${title}`),
      mediaUrl: media[0]?.url ?? null,
      mediaType: inferMediaType({ file: media[0]?.file, url: media[0]?.url, fallback: media[0]?.type ?? 'image/*' }),
      createdAt: nextCreatedAt,
    };

    if (isEditing) {
      onUpdatePost?.(payload);
    } else {
      onCreatePost?.(payload);
    }

    onBackToList?.();
  };

  return (
    <section className="posts-card card animation-slide-up yt-create-post-page">
      <div className="posts-card-header" style={{ marginBottom: 0 }}>
        <h2>Créer un post</h2>
        <div className="posts-card-controls">
          <button
            type="button"
            className="yt-modern-close-btn"
            onClick={() => {
              if (!hasUnsavedChanges) {
                goBack();
                return;
              }
              setShowLeaveConfirm(true);
            }}
            aria-label="Fermer"
            title="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      {showLeaveConfirm ? (
        <div
          className="yt-leave-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div className="yt-leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="yt-leave-title">Continuer ou abandonner ?</div>
            <div className="yt-leave-body">
              Tu peux continuer la modification, ou abandonner pour revenir en arrière.
            </div>
            <div className="yt-leave-actions">
              <button
                type="button"
                className="btn-outline-reserve"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Continuer
              </button>
              <button
                type="button"
                className="btn-publish-now"
                style={{ background: '#be123c' }}
                onClick={() => {
                  setShowLeaveConfirm(false);
                  goBack();
                }}
              >
                Abandonner
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="yt-create-post-body" style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <section className="card shadowless yt-create-post-panel" style={{ padding: 18 }}>
          <div className="yt-create-post-ai-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez votre post, l'IA génère tout..."
              className="yt-ai-prompt-input"
              style={{
                minHeight: 50,
                borderRadius: 999,
                border: '1px solid var(--border-color)',
                padding: '12px 18px',
                background: 'white',
                color: 'var(--text-main)',
              }}
            />
            <button
              type="button"
              className="yt-generate-btn"
              style={{}}
              onClick={generateWithAI}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? 'Génération...' : '✨ Générer'}
            </button>
          </div>

          <div className="card shadowless yt-create-post-form-card" style={{ padding: 18, borderRadius: 20, marginBottom: 18, border: '1px solid rgba(109, 40, 217, 0.12)'}}>
            <div className="yt-create-post-user-row">
              <div className="avatar-circle">U</div>
              <div className="yt-create-post-user-meta">
                <div style={{ fontWeight: 900 }}>{channelName.trim() || 'Utilisateur'}</div>
                <div style={{ color: 'var(--text-light)', fontSize: 12 }}>{createdAt}</div>
              </div>
              <div className="yt-create-post-type">
                {typeLabel}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
                TITRE
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrez le titre de la vidéo ou du Short"
                style={{
                  width: '100%',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: 'white',
                  color: 'var(--text-main)',
                  marginBottom: 18,
                }}
              />
            </div>

            <div style={{ color: 'var(--text-light)', fontSize: 12, marginBottom: 16 }}>CAPTION</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cliquez pour rédiger ou générez avec l'IA"
              style={{
                width: '100%',
                minHeight: 110,
                resize: 'vertical',
                border: '1px solid rgba(15, 23, 42, 0.12)',
                borderRadius: 14,
                padding: 14,
                outline: 'none',
                background: 'white',
                color: 'var(--text-main)',
                marginBottom: 20,
              }}
            />

            <div style={{ color: 'var(--text-light)', fontSize: 12, marginBottom: 14 }}>MÉDIA</div>
            <div
              className="media-box hover-lift"
              role="button"
              tabIndex={0}
              onClick={() => {
                if (media[0]) return;
                openFilePicker();
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                if (media[0]) return;
                openFilePicker();
              }}
              aria-label={media[0] ? 'Média sélectionné' : 'Ajouter un média'}
              style={{
                minHeight: 140,
                width: '100%',
                aspectRatio: postType === 'shorts' ? '9 / 16' : '16 / 9',
                borderRadius: 18,
                overflow: 'hidden',
                background: media[0] ? 'transparent' : 'rgba(245, 245, 255, 0.85)',
                border: media[0] ? '1px solid rgba(15, 23, 42, 0.10)' : '1px dashed rgba(109, 40, 217, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                marginBottom: 18,
              }}
            >
              {media[0] ? (
                <>
                  {isVideoMediaType(media[0]?.type) ? (
                    <video
                      src={media[0].url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                      playsInline
                    />
                  ) : (
                    <img src={media[0].url} alt="Média sélectionné" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(media[0].id);
                    }}
                    aria-label="Retirer le média"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: 'rgba(15, 23, 42, 0.65)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                  <div
                    style={{
                      position: 'absolute',
                      left: 10,
                      bottom: 10,
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.75)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {formatFileSize(media[0].size)}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                  <div className="add-icon" style={{ fontSize: 24, marginBottom: 8 }}>+</div>
                  <div>Ajouter un média</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple={false}
              style={{ display: 'none' }}
              onChange={(e) => {
                const pickedFiles = Array.from(e.target.files ?? []);
                onFilesPicked(pickedFiles);
                e.target.value = '';
              }}
            />

            <section className="card shadowless" style={{ padding: 16, borderRadius: 18, background: 'rgba(248, 250, 252, 0.95)', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Aperçu {postType === 'shorts' ? 'Shorts' : 'Vidéo'}</div>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: postType === 'shorts' ? 'min(280px, 100%)' : '100%',
                margin: '0 auto',
                aspectRatio: postType === 'shorts' ? '9 / 16' : '16 / 9', 
                borderRadius: 20, 
                overflow: 'hidden', 
                background: '#0f172a' 
              }}>
                {media[0] ? (
                  <>
                    {isVideoMediaType(media[0]?.type) ? (
                      <video
                        src={media[0].url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        controls
                      />
                    ) : (
                      <img
                        src={media[0].url}
                        alt="Aperçu média"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {postType === 'shorts' && (
                      <>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.78) 100%)',
                          }}
                        />
                        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span
                            style={{
                              alignSelf: 'flex-start',
                              background: 'rgba(255,255,255,0.92)',
                              color: '#111827',
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Shorts
                          </span>
                          <span style={{ color: 'white', fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
                            {title.trim() || 'Titre du Short'}
                          </span>
                        </div>
                      </>
                    )}
                    {postType === 'video' && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 12,
                          bottom: 12,
                          padding: '4px 8px',
                          borderRadius: 8,
                          background: 'rgba(0,0,0,0.72)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {duration || pickDefaultDuration(postType)}
                      </div>
                    )}
                  </>
                ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    padding: '0 12px',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    color: '#94a3b8',
                    boxSizing: 'border-box',
                  }}
                >
                    Ajoutez un média pour voir l'aperçu
                  </div>
                )}
              </div>
            </section>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-light)', fontSize: 12, marginBottom: 8 }}>HASHTAGS</div>
                <input
                  className="hashtag-input"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="Cliquez pour ajouter ou générez avec l'IA"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid var(--border-color)',
                    background: 'white',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-publish-now"
              onClick={() => publish('Publié')}
              disabled={!canPublish}
              style={!canPublish ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
            >
              ✈ Publier maintenant
            </button>

            <div className="schedule-card card shadowless" style={{ marginTop: 18 }}>
              <div className="section-header" style={{ marginBottom: 10 }}>
                <h3>PLANIFIER POUR PLUS TARD</h3>
              </div>
              <div className="schedule-input-box">
                <span>{scheduledAt ? scheduledAt.replace('T', ' ') : createdAt}</span>
                <span aria-hidden>📅</span>
              </div>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  background: 'white',
                  marginBottom: 12,
                }}
              />
              <div className="schedule-actions">
                <button
                  type="button"
                  className="btn-schedule-main"
                  onClick={() => publish('Planifié')}
                  disabled={!canPublish}
                  style={!canPublish ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                >
                  📅 Planifier
                </button>
                <button type="button" className="btn-outline-reserve" onClick={onBackToList}>
                  Garder en réserve
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

// ==================== COMPOSANT PRINCIPAL ====================
export default function YoutubeApp({ onBack }) {
  const [activeTab, setActiveTab] = useState('Publiés');
  const [deviceView, setDeviceView] = useState('Desktop');
  const [isCreating, setIsCreating] = useState(false);
  const [creatingType, setCreatingType] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [posts, setPosts] = useState(() => getInitialFakePosts());
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostSource, setSelectedPostSource] = useState('desktop');
  const [selectedShortIndex, setSelectedShortIndex] = useState(0);

  const visiblePosts = useMemo(() => {
    if (activeTab === 'Publiés') return posts.filter((p) => p.status === 'Publié');
    if (activeTab === 'Planifiés') return posts.filter((p) => p.status === 'Planifié');
    if (activeTab === 'Brouillons') return posts.filter((p) => p.status === 'Brouillon');
    return posts;
  }, [activeTab, posts]);

  const publishedShorts = useMemo(
    () => posts.filter((p) => p.status === 'Publié' && p.type === 'shorts'),
    [posts],
  );
  const publishedVideos = useMemo(
    () => posts.filter((p) => p.status === 'Publié' && p.type === 'video'),
    [posts],
  );
  const tabShorts = useMemo(() => visiblePosts.filter((p) => p.type === 'shorts'), [visiblePosts]);
  const tabVideos = useMemo(() => visiblePosts.filter((p) => p.type === 'video'), [visiblePosts]);

  const shortsForViewer = useMemo(
    () => (tabShorts.length > 0 ? tabShorts : (activeTab === 'Publiés' ? getFallbackShorts() : [])),
    [tabShorts, activeTab],
  );

  const handleSelectPost = (post, source = 'desktop') => {
    setSelectedPost(post);
    setSelectedPostSource(source);
    if (post?.type === 'shorts') {
      const idx = shortsForViewer.findIndex((p) => p.id === post.id);
      setSelectedShortIndex(idx >= 0 ? idx : 0);
    }
  };

  const startEditPost = (post) => {
    if (!post) return;
    setSelectedPost(null);
    setEditingPost(post);
    setIsCreating(true);
    setCreatingType(post.type);
  };

  const stopEdit = () => {
    setEditingPost(null);
    setIsCreating(false);
    setCreatingType(null);
  };

  const renderPlayer = () => {
    if (!selectedPost) return null;
    
    if (selectedPost.type === 'shorts') {
      return (
        <ShortsPlayerModal
          key={selectedPost.id}
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          forceMobileLayout={selectedPostSource === 'mobile'}
          onPrev={() => {
            if (shortsForViewer.length === 0) return;
            const prevIndex = (selectedShortIndex - 1 + shortsForViewer.length) % shortsForViewer.length;
            setSelectedShortIndex(prevIndex);
            setSelectedPost(shortsForViewer[prevIndex]);
          }}
          onNext={() => {
            if (shortsForViewer.length === 0) return;
            const nextIndex = (selectedShortIndex + 1) % shortsForViewer.length;
            setSelectedShortIndex(nextIndex);
            setSelectedPost(shortsForViewer[nextIndex]);
          }}
        />
      );
    }
    return <VideoPlayer post={selectedPost} onClose={() => setSelectedPost(null)} />;
  };

  return (
    <main className="homepage-screen">
      <header className="header-card card animation-fade-in">
        <div className="header-left">
          <button
            type="button"
            className="platform-btn active"
            style={{ borderColor: YOUTUBE_META.color, color: YOUTUBE_META.color }}
            aria-label={`${YOUTUBE_META.name} sélectionné`}
          >
            <span className="platform-icon" style={{ background: YOUTUBE_META.color }}>
              <img src={YOUTUBE_META.logoUrl} alt={`${YOUTUBE_META.name} logo`} />
            </span>
            <span>{YOUTUBE_META.name}</span>
          </button>

          <button type="button" className="action-btn-secondary outline" onClick={() => onBack?.()}>
            ← Retourner
          </button>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setIsCreating(true);
              setCreatingType(null);
            }}
          >
            + Créer un post
          </button>
          <button type="button" className="action-btn-secondary outline">
            Stratégie
          </button>
        </div>
      </header>

      {renderPlayer()}

      {isCreating ? (
        creatingType ? (
          <YoutubeCreatePostPage
            platformMeta={YOUTUBE_META}
            initialType={creatingType}
            initialPost={editingPost}
            onBackToList={() => {
              stopEdit();
            }}
            onBackToTypeSelect={editingPost ? undefined : () => setCreatingType(null)}
            onCreatePost={
              editingPost
                ? undefined
                : (post) => {
                    setPosts((prev) => [post, ...prev]);
                    stopEdit();
                  }
            }
            onUpdatePost={
              editingPost
                ? (updatedPost) => {
                    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
                    stopEdit();
                  }
                : undefined
            }
          />
        ) : (
          <YoutubeCreateLanding
            platformMeta={YOUTUBE_META}
            onBack={() => {
              setIsCreating(false);
              setCreatingType(null);
            }}
            onPickType={setCreatingType}
            publishedPosts={posts}
            onSelect={(post, source) => handleSelectPost(post, source ?? 'desktop')}
            onEditPost={(post) => startEditPost(post)}
          />
        )
      ) : (
        <>
          <div className="yt-posts-section-card">
            {/* ── Header row: title + tabs + device toggle ── */}
            <div className="yt-posts-section-header">
              <h2 className="yt-posts-section-title">
                {activeTab === 'Publiés' ? "Fil d'actualité" : activeTab === 'Planifiés' ? 'Planifier' : 'Brouillons'}
              </h2>

              <div className="yt-posts-section-controls">
                <div className="posts-card-tabs" aria-label="Filtre des posts">
                  {['Publiés', 'Planifiés', 'Brouillons'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <YoutubeViewToggle value={deviceView} onChange={setDeviceView} />
              </div>
            </div>

            <div className="yt-posts-section-divider" />

            {/* ── Content: phone frame (Mobile) or feed (Desktop) ── */}
            <div className="yt-posts-section-body">
              {activeTab === 'Publiés' ? (
                deviceView === 'Mobile' ? (
                  <div className="yt-phone-frame">
                    <YoutubeHomeFeed
                      publishedShorts={tabShorts}
                      publishedVideos={tabVideos}
                      allowFallback={true}
                      onSelect={(post, source) => handleSelectPost(post, source ?? 'mobile')}
                      onBack={onBack}
                      onEditPost={(post) => startEditPost(post)}
                      variant="mobile"
                      onDeletePost={(postId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== postId));
                        if (selectedPost?.id === postId) setSelectedPost(null);
                      }}
                    />
                  </div>
                ) : (
                  <YoutubeHomeFeed
                    publishedShorts={tabShorts}
                    publishedVideos={tabVideos}
                    allowFallback={true}
                    onSelect={(post, source) => handleSelectPost(post, source ?? 'desktop')}
                    onBack={onBack}
                    onEditPost={(post) => startEditPost(post)}
                    variant="desktop"
                    onDeletePost={(postId) => {
                      setPosts((prev) => prev.filter((p) => p.id !== postId));
                      if (selectedPost?.id === postId) setSelectedPost(null);
                    }}
                  />
                )
              ) : activeTab === 'Planifiés' ? (
                <div style={{ padding: '24px 0' }}>
                  {tabVideos.length === 0 && tabShorts.length === 0 ? (
                    <div className="empty-state">
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucune vidéo planifiée</div>
                      <div style={{ color: 'var(--text-light)', fontSize: 14 }}>
                        Créez un post et choisissez "Planifier" pour le voir ici.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {tabShorts.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShortsIcon size={16} />
                            Shorts planifiés
                          </div>
                          <div className="yt-published-shorts-grid desktop">
                            {tabShorts.map((post) => (
                              <ShortVideoCardDesktop
                                key={post.id}
                                post={post}
                                onSelect={(p) => handleSelectPost(p, 'desktop')}
                                onEdit={(p) => startEditPost(p)}
                                onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {tabVideos.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 900, marginBottom: 12 }}>Vidéos planifiées</div>
                          <div className="yt-videos-grid">
                            {tabVideos.map((post) => (
                              <VideoCard
                                key={post.id}
                                post={post}
                                onSelect={(p) => handleSelectPost(p, 'desktop')}
                                onEdit={(p) => startEditPost(p)}
                                onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeTab === 'Brouillons' ? (
                <div style={{ padding: '24px 0' }}>
                  {tabVideos.length === 0 && tabShorts.length === 0 ? (
                    <div className="empty-state">
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun brouillon</div>
                      <div style={{ color: 'var(--text-light)', fontSize: 14 }}>
                        Vos brouillons non publiés apparaîtront ici.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {tabShorts.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShortsIcon size={16} />
                            Shorts — Brouillons
                          </div>
                          <div className="yt-published-shorts-grid desktop">
                            {tabShorts.map((post) => (
                              <ShortVideoCardDesktop
                                key={post.id}
                                post={post}
                                onSelect={(p) => handleSelectPost(p, 'desktop')}
                                onEdit={(p) => startEditPost(p)}
                                onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {tabVideos.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 900, marginBottom: 12 }}>Vidéos — Brouillons</div>
                          <div className="yt-videos-grid">
                            {tabVideos.map((post) => (
                              <VideoCard
                                key={post.id}
                                post={post}
                                onSelect={(p) => handleSelectPost(p, 'desktop')}
                                onEdit={(p) => startEditPost(p)}
                                onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </main>
  );



  
}