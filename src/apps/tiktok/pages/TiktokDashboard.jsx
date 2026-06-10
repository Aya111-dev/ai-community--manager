import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useOutletContext } from 'react-router-dom';

import {

  AlertTriangle,

  Camera,

  Image,

  Video,

  Heart,

  MessageCircle,

  Share2,

  X,

  Sparkles,

  Music,

  ChevronDown,

  Check,

  Monitor,

  Smartphone,

  Calendar,

  CalendarDays,

  ChevronLeft,

  ChevronRight,

  Plus,

  Upload,

  Send,

  Star,

  Play,

  Bookmark,

  Edit3,

  Trash2,

  MoreVertical,

  Hash,

  Zap,

  Save

} from 'lucide-react';

import '../TiktokApp.css';

import '../TiktokManualStyles.css';

import TiktokManualMediaCarousel from './TiktokManualMediaCarousel';

import TiktokManualCarouselChrome from './TiktokManualCarouselChrome';

import PreviewVideo from '../../../components/PreviewVideo.jsx';

import { generateThemedPostMedia, mapPostTypeForApi } from '../../../services/aiMediaHelpers.js';

import { createPost, updatePost, getPosts } from '../../../services/api.js';

import { tiktokItemToApiPayload, apiPostToTiktokItem, resolveMediaUrl } from '../../../services/postPersistence.js';



const WEEK_DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

const HOURS = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}h`);



function getStartOfWeek(date) {

  const clone = new Date(date);

  const day = clone.getDay();

  clone.setHours(0, 0, 0, 0);

  clone.setDate(clone.getDate() - day);

  return clone;

}



function addDays(date, days) {

  const copy = new Date(date);

  copy.setDate(copy.getDate() + days);

  return copy;

}



function formatWeekRange(startDate) {

  const endDate = addDays(startDate, 6);

  const options = { month: 'short', day: '2-digit', year: 'numeric' };

  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString(

    'en-US',

    options

  )}`;

}



function formatSelectedDate(date) {

  return date.toLocaleString('fr-FR', {

    day: '2-digit',

    month: '2-digit',

    year: 'numeric',

    hour: '2-digit',

    minute: '2-digit'

  });

}



function formatCount(num) {

  if (num >= 1000000) {

    return (num / 1000000).toFixed(1) + 'M';

  } else if (num >= 1000) {

    return (num / 1000).toFixed(1) + 'K';

  }

  return num.toString();

}



export default function TiktokDashboard() {

  const {

    posts,

    showCreateSection,

    setShowCreateSection,

    showStrategyCalendar,

    setShowStrategyCalendar,

    tiktokPlatformLayout

  } = useOutletContext();



  const [activeTab, setActiveTab] = useState('published');

  const [viewMode, setViewMode] = useState('desktop');



  useEffect(() => {

    if (tiktokPlatformLayout === 'mobile') {

      setViewMode('mobile');

    } else if (tiktokPlatformLayout === 'desktop') {

      setViewMode('desktop');

    }

  }, [tiktokPlatformLayout]);

  const [selectedPublishType, setSelectedPublishType] = useState(null);

  const [creationKind, setCreationKind] = useState('story');

  const [galleryMode, setGalleryMode] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);

  const [aiPrompt, setAiPrompt] = useState('');

  const [storyPreview, setStoryPreview] = useState('');

  const [selectedSound, setSelectedSound] = useState('Ajouter un son');

  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const [soundPickerMode, setSoundPickerMode] = useState('menu');

  const [storyViewMode, setStoryViewMode] = useState('desktop');

  const [storyCreatedAt, setStoryCreatedAt] = useState(null);

  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const [showStoryAiSchedulePicker, setShowStoryAiSchedulePicker] = useState(false);

  const [showStoryManualSchedulePicker, setShowStoryManualSchedulePicker] = useState(false);

  const [showVideoComposeSchedulePicker, setShowVideoComposeSchedulePicker] = useState(false);

  const [scheduleWeekStart, setScheduleWeekStart] = useState(getStartOfWeek(new Date()));

  const [showEditMenu, setShowEditMenu] = useState(null); // ID de la story dont le menu est affiché

  const [selectedScheduleAt, setSelectedScheduleAt] = useState(null);

  const [scheduleOrigin, setScheduleOrigin] = useState('ai'); // 'ai' | 'manual'

  const [scheduledItems, setScheduledItems] = useState([

    // Données de test pour le calendrier stratégique

    {

      id: 'scheduled-story-1',

      type: 'story',

      title: 'Story TikTok - Promotion produit',

      contentPreview: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',

      scheduledAt: new Date(2026, 3, 25, 14, 0, 0), // 25 avril 2026 à 14h

      createdAt: new Date(),

      description: 'Story promotionnelle #trending #fyp',

      username: '@vous',

      sound: 'Son tendance - Artist',

      status: 'scheduled'

    },

    {

      id: 'scheduled-video-1',

      type: 'video',

      title: 'Post Vidéo - Tutoriel TikTok',

      contentPreview: 'https://storage.googleapis.com/coverr-main/mp4/Footage.mp4',

      scheduledAt: new Date(2026, 3, 25, 16, 0, 0), // 25 avril 2026 à 16h

      createdAt: new Date(),

      description: 'Tutoriel complet sur TikTok',

      username: '@vous',

      sound: 'Musique tutoriel - Creator',

      status: 'scheduled'

    },

    {

      id: 'scheduled-video-2',

      type: 'video',

      title: 'Post Vidéo - Challenge viral',

      contentPreview: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',

      scheduledAt: new Date(2026, 3, 26, 18, 0, 0), // 26 avril 2026 à 18h

      createdAt: new Date(),

      description: 'Participation au challenge du moment',

      username: '@vous',

      sound: 'Son challenge viral',

      status: 'scheduled'

    },

    {

      id: 'scheduled-photo-1',

      type: 'image',

      title: 'Post Photo - Carrousel',

      contentPreview: 'https://picsum.photos/400/600',

      scheduledAt: new Date(2026, 3, 27, 12, 0, 0), // 27 avril 2026 à 12h

      createdAt: new Date(),

      description: 'Carrousel photo thématique',

      username: '@vous',

      sound: '',

      status: 'scheduled'

    }

  ]);

  const [publishStatus, setPublishStatus] = useState('');

  const [scheduleMessage, setScheduleMessage] = useState('');

  const [draftSubTab, setDraftSubTab] = useState('stories'); // Onglets dans les brouillons: 'stories', 'photos', 'videos'

  const soundInputRef = useRef(null);

  const manualMediaInputRef = useRef(null);

  const manualCarouselRef = useRef(null);

  const manualVideoInputRef = useRef(null);



  const [manualMediaFiles, setManualMediaFiles] = useState([]);

  const [tiktokPosts, setTiktokPosts] = useState([

    {

      id: 'tiktok-1',

      type: 'video',

      title: 'Dance Trend ',

      contentPreview: '/videos/tiktok-dance-1.mp4',

      description: 'Nouveau dance challenge qui explose ! Essayez-le aussi #dance #trending #fyp #viral',

      username: '@danceking',

      userAvatar: 'DK',

      sound: 'Sons TikTok - Dance Vibes',

      soundIcon: '',

      likes: 125000,

      comments: 8921,

      shares: 3421,

      bookmarked: true,

      status: 'published',

      createdAt: new Date(Date.now() - 3600000),

      duration: '0:15',

      verified: true

    },

    {

      id: 'tiktok-2',

      type: 'video',

      title: 'Cooking Tutorial ',

      contentPreview: '/videos/tiktok-cooking-1.mp4',

      description: 'Recette secrète révélée ! Ingrédients en bio #cooking #recipe #food #healthy',

      username: '@foodmaster',

      userAvatar: 'FM',

      sound: 'Musique tendance - Kitchen Beats',

      soundIcon: '',

      likes: 89000,

      comments: 5643,

      shares: 2109,

      bookmarked: false,

      status: 'published',

      createdAt: new Date(Date.now() - 7200000),

      duration: '0:22',

      verified: true

    },

    {

      id: 'tiktok-3',

      type: 'video',

      title: 'Pet Compilation ',

      contentPreview: '/videos/tiktok-pets-1.mp4',

      description: 'Les chats les plus drôles du web ! Qui a le plus mignon ? #pets #cats #funny #cute',

      username: '@petlover',

      userAvatar: 'PL',

      sound: 'Son mignon - Pet Sounds',

      soundIcon: '',

      likes: 234000,

      comments: 12345,

      shares: 8765,

      bookmarked: true,

      status: 'published',

      createdAt: new Date(Date.now() - 10800000),

      duration: '0:18',

      verified: false

    },

    {

      id: 'tiktok-4',

      type: 'video',

      title: 'Fashion Haul ',

      contentPreview: '/videos/tiktok-fashion-1.mp4',

      description: 'Mes derniers achats mode  Liens en description #fashion #shopping #style #ootd',

      username: '@fashionista',

      userAvatar: 'FS',

      sound: 'Musique mode - Runway Beats',

      soundIcon: '',

      likes: 67000,

      comments: 4321,

      shares: 1543,

      bookmarked: false,

      status: 'published',

      createdAt: new Date(Date.now() - 14400000),

      duration: '0:25',

      verified: true

    },

    {

      id: 'tiktok-5',

      type: 'video',

      title: 'Workout Motivation ',

      contentPreview: '/videos/tiktok-fitness-1.mp4',

      description: 'Transforme ton corps en 30 jours ! Programme gratuit en bio #fitness #workout #motivation',

      username: '@fitguru',

      userAvatar: 'FG',

      sound: 'Musique sport - Gym Beats',

      soundIcon: '',

      likes: 156000,

      comments: 9876,

      shares: 5432,

      bookmarked: true,

      status: 'published',

      createdAt: new Date(Date.now() - 18000000),

      duration: '0:20',

      verified: true

    },

    {

      id: 'tiktok-6',

      type: 'video',

      title: 'Travel Vlog ',

      contentPreview: '/videos/tiktok-travel-1.mp4',

      description: 'Aventure incroyable à Bali ! Paradis sur terre #travel #adventure #explore #paradise',

      username: '@wanderer',

      userAvatar: 'WD',

      sound: 'Musique voyage - Travel Vibes',

      soundIcon: '',

      likes: 189000,

      comments: 11234,

      shares: 6789,

      bookmarked: false,

      status: 'published',

      createdAt: new Date(Date.now() - 21600000),

      duration: '0:30',

      verified: true

    }

  ]);

  

  // États manquants pour la gestion complète des Stories

  const [storyMediaType, setStoryMediaType] = useState('photo');

  const [storyAiMediaKind, setStoryAiMediaKind] = useState('image');

  const [storyMode, setStoryMode] = useState('ai');

  const [storyCaption, setStoryCaption] = useState('');

  const [storyCover, setStoryCover] = useState('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80');

  const [storyScheduledAt, setStoryScheduledAt] = useState('');

  const [storyMediaPreview, setStoryMediaPreview] = useState('');

  const [storyMediaName, setStoryMediaName] = useState('');

  const [storyVisibility, setStoryVisibility] = useState('public');

  const [storyAllowComments, setStoryAllowComments] = useState(true);

  const [storyAllowDuet, setStoryAllowDuet] = useState(true);

  const [storyAllowStitch, setStoryAllowStitch] = useState(true);

  const [storyHashtags, setStoryHashtags] = useState('');

  

  // États pour la gestion complète des Photos

  const [photoPrompt, setPhotoPrompt] = useState('');

  const [photoPreview, setPhotoPreview] = useState('');

  const [photoMode, setPhotoMode] = useState('ai');

  const [photoCaption, setPhotoCaption] = useState('');

  const [photoCover, setPhotoCover] = useState('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80');

  const [photoScheduledAt, setPhotoScheduledAt] = useState('');

  const [photoMediaPreview, setPhotoMediaPreview] = useState('');

  const [photoMediaName, setPhotoMediaName] = useState('');

  const [photoGallery, setPhotoGallery] = useState([]);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleManualCarouselIndex = useCallback((i) => {
    if (i < 0 || i >= manualMediaFiles.length) return;
    setCurrentPhotoIndex(i);
    const f = manualMediaFiles[i];
    if (f && !f.type?.startsWith('video/')) {
      setPhotoPreview(URL.createObjectURL(f));
    }
  }, [manualMediaFiles]);

  const handleManualCarouselDotClick = useCallback(
    (index) => {
      if (index < 0 || index >= manualMediaFiles.length) return;
      setCurrentPhotoIndex(index);
      const f = manualMediaFiles[index];
      if (f && !f.type?.startsWith('video/')) {
        setPhotoPreview(URL.createObjectURL(f));
      }
      requestAnimationFrame(() => {
        const el = manualCarouselRef.current;
        if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
      });
    },
    [manualMediaFiles]
  );

  useEffect(() => {
    const n = manualMediaFiles.length;
    if (n === 0) {
      setCurrentPhotoIndex(0);
      return;
    }
    setCurrentPhotoIndex((idx) => {
      const clamped = Math.min(idx, n - 1);
      if (clamped !== idx && n > 1) {
        requestAnimationFrame(() => {
          const el = manualCarouselRef.current;
          if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: 'auto' });
        });
      }
      return clamped;
    });
  }, [manualMediaFiles.length]);

  const [photoVisibility, setPhotoVisibility] = useState('public');

  const [photoAllowComments, setPhotoAllowComments] = useState(true);

  const [photoAllowDuet, setPhotoAllowDuet] = useState(false);

  const [photoAllowStitch, setPhotoAllowStitch] = useState(false);

  const [photoHashtags, setPhotoHashtags] = useState('');

  const [photoCreatedAt, setPhotoCreatedAt] = useState(null);

  const [manualPhotoFiles, setManualPhotoFiles] = useState([]);

  

  // États pour la recherche et la sélection de son

  const [photoSoundQuery, setPhotoSoundQuery] = useState('');

  const [photoSoundResults, setPhotoSoundResults] = useState([]);

  const [selectedPhotoSound, setSelectedPhotoSound] = useState(null);

  const [showPhotoSoundSearch, setShowPhotoSoundSearch] = useState(false);

  

  // États pour la gestion complète des Vidéos

  const [videoPrompt, setVideoPrompt] = useState('');

  const [videoPreview, setVideoPreview] = useState('');

  const [videoMode, setVideoMode] = useState('ai');

  const [videoCaption, setVideoCaption] = useState('');

  const [videoCover, setVideoCover] = useState('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=80');

  const [isAiMediaGenerating, setIsAiMediaGenerating] = useState(false);

  const [videoScheduledAt, setVideoScheduledAt] = useState('');

  const [videoMediaPreview, setVideoMediaPreview] = useState('');

  const [videoMediaName, setVideoMediaName] = useState('');

  const [videoGallery, setVideoGallery] = useState([]);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const [videoVisibility, setVideoVisibility] = useState('public');

  const [videoAllowComments, setVideoAllowComments] = useState(true);

  const [videoAllowDuet, setVideoAllowDuet] = useState(true);

  const [videoAllowStitch, setVideoAllowStitch] = useState(true);

  const [videoHashtags, setVideoHashtags] = useState('');

  const [videoCreatedAt, setVideoCreatedAt] = useState(null);

  const [manualVideoFiles, setManualVideoFiles] = useState([]);

  

  // États pour la recherche et la sélection de son vidéo

  const [videoSoundQuery, setVideoSoundQuery] = useState('');

  const [videoSoundResults, setVideoSoundResults] = useState([]);

  const [selectedVideoSound, setSelectedVideoSound] = useState(null);

  const [showVideoSoundSearch, setShowVideoSoundSearch] = useState(false);

  

  const [editingPublishedFromCreateId, setEditingPublishedFromCreateId] = useState(null);

  const [editingDraftFromListId, setEditingDraftFromListId] = useState(null);

  const [editingScheduledFromListId, setEditingScheduledFromListId] = useState(null);



  // Options de couvertures pour les Stories

  const storyCovers = [

    { id: 'story-cover-1', label: 'Motion', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },

    { id: 'story-cover-2', label: 'Lifestyle', url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=80' },

    { id: 'story-cover-3', label: 'Minimal', url: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80' }

  ];

  

  const [draftItems, setDraftItems] = useState([

    {

      id: 'draft-story-1',

      type: 'video',

      contentType: 'story', 

      title: 'Story TikTok - Brouillon',

      contentPreview: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',

      createdAt: new Date(),

      description: 'Story en préparation #trending #fyp',

      username: '@moi',

      sound: 'Son original - Moi',

      captions: 'Présentation de la story',

      hashtags: '#trending #fyp #viral',

      privacy: 'public',

      allowComments: true,

      allowDuet: true,

      allowStitch: true

    },

    {

      id: 'draft-video-1',

      type: 'video',

      contentType: 'video', 

      title: 'Post Vidéo - Brouillon',

      contentPreview: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',

      createdAt: new Date(),

      description: 'Post vidéo en préparation',

      username: '@moi',

      sound: 'Son tendance - Moi',

      captions: 'Post vidéo TikTok',

      hashtags: '#video #tiktok #trending',

      privacy: 'public',

      allowComments: true,

      allowDuet: true,

      allowStitch: true

    },

    {

      id: 'draft-photo-1',

      type: 'image',

      contentType: 'photo', 

      title: 'Post Photo - Brouillon',

      contentPreview: 'https://picsum.photos/400/600',

      createdAt: new Date(),

      description: 'Post photo en préparation',

      username: '@moi',

      sound: '',

      captions: 'Post photo TikTok',

      hashtags: '#photo #tiktok #art',

      privacy: 'public',

      allowComments: true,

      allowDuet: false,

      allowStitch: false

    }

  ]);



  const [editingDraft, setEditingDraft] = useState(null);

  const [editedDraftData, setEditedDraftData] = useState({});



  // États pour les interactions dynamiques avec les posts TikTok

  const [postInteractions, setPostInteractions] = useState({});

  const [playingVideos, setPlayingVideos] = useState(new Set());



  // États pour l'édition des posts planifiés

  const [editingScheduled, setEditingScheduled] = useState(null);

  const [editedScheduledData, setEditedScheduledData] = useState({});

  const [showEditOptions, setShowEditOptions] = useState(null);



  // États pour l'édition des posts publiés

  const [editingPublished, setEditingPublished] = useState(null);

  const [editedPublishedData, setEditedPublishedData] = useState({});

  const [showPublishedEditOptions, setShowPublishedEditOptions] = useState(null);

  const [showDraftEditOptions, setShowDraftEditOptions] = useState(null);

  const [showScheduledMoreOptions, setShowScheduledMoreOptions] = useState(null);

  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);

  useEffect(() => {
    if (!pendingDeleteTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPendingDeleteTarget(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingDeleteTarget]);



  const soundCategories = [

    {

      title: 'Pop',

      sounds: ['Summer Beat', 'Dance Floor', 'Pop Vibes']

    },

    {

      title: 'Chill',

      sounds: ['Mellow Mood', 'Lazy Afternoon', 'Chill Wave']

    },

    {

      title: 'Électro',

      sounds: ['Neon Pulse', 'Electric Drive', 'Future Bass']

    }

  ];



  const tabs = [

    { id: 'published', label: 'Publiés' },

    { id: 'scheduled', label: 'Planifiés' },

    { id: 'draft', label: 'Brouillons' }

  ];



  const filteredPosts = useMemo(

    () => {

      if (activeTab === 'published') {

        // Utiliser nos vraies vidéos TikTok pour les posts publiés

        return tiktokPosts;

      }

      if (activeTab === 'scheduled') {

        // Combiner les posts planifiés du contexte et les scheduledItems locaux

        const contextScheduled = posts.filter((post) => post.status === 'scheduled');

        return [...contextScheduled, ...scheduledItems];

      }

      if (activeTab === 'draft') {

        // Les brouillons proviennent du state local dynamique

        return draftItems;

      }

      return posts.filter((post) => post.status === activeTab);

    },

    [posts, activeTab, scheduledItems, tiktokPosts, draftItems]

  );



  const previewPost =

    filteredPosts[0] || posts.find((post) => post.status === 'published') || posts[0];



  // Fonctions localStorage pour stockage temporaire

  const saveToLocalStorage = (key, data) => {

    try {

      localStorage.setItem(key, JSON.stringify(data));

    } catch (error) {

      console.error('Erreur localStorage:', error);

    }

  };



  const loadFromLocalStorage = (key) => {

    try {

      const data = localStorage.getItem(key);

      return data ? JSON.parse(data) : null;

    } catch (error) {

      console.error('Erreur localStorage:', error);

      return null;

    }

  };



  const renderScheduleCalendar = (onScheduleConfirm = handleSchedulePublish, scheduleButtonLabel = 'Planifier la story') => (

    <div className="schedule-calendar-panel compact">

      <div className="schedule-calendar-header">

        <button

          type="button"

          className="schedule-calendar-nav"

          onClick={() => handleChangeWeek(-1)}

        >

          <ChevronLeft size={18} />

        </button>



        <div className="schedule-calendar-range">{formatWeekRange(scheduleWeekStart)}</div>



        <button

          type="button"

          className="schedule-calendar-nav"

          onClick={() => handleChangeWeek(1)}

        >

          <ChevronRight size={18} />

        </button>



        <button

          type="button"

          className="schedule-calendar-today"

          onClick={() => setScheduleWeekStart(getStartOfWeek(new Date()))}

        >

          Aujourd&apos;hui

        </button>

      </div>



      <div className="schedule-calendar-grid">

        <div className="schedule-calendar-grid-head">

          <div className="schedule-calendar-cell time-cell">GMT+1</div>

          {weekDays.map((day) => (

            <div key={day.toISOString()} className="schedule-calendar-cell header-cell">

              <div>{WEEK_DAYS[day.getDay()]}</div>

              <strong>{day.getDate()}</strong>

            </div>

          ))}

        </div>



        <div className="schedule-calendar-grid-body">

          {HOURS.map((hour) => (

            <div key={hour} className="schedule-calendar-row">

              <div className="schedule-calendar-cell time-cell">{hour}</div>

              {weekDays.map((day) => {

                const hourNumber = parseInt(hour, 10);

                const cellDate = new Date(day);

                cellDate.setHours(hourNumber, 0, 0, 0);

                const key = `${cellDate.toDateString()}-${hourNumber}`;

                const events = eventsBySlot[key] || [];

                const isSelected =

                  selectedScheduleAt && selectedScheduleAt.getTime() === cellDate.getTime();

                return (

                  <button

                    key={`${day.toISOString()}-${hour}`}

                    type="button"

                    className={`schedule-calendar-cell slot-cell ${isSelected ? 'selected' : ''}`}

                    onClick={() => handleSelectScheduleCell(day, hourNumber.toString())}

                  >

                    {events.length > 0 && (

                      <div className="schedule-event-pill">

                        <span className={`pill-type ${events[0].type}`}>

                          {events[0].type === 'video'

                            ? 'Vidéo'

                            : events[0].type === 'image'

                            ? 'Photo'

                            : 'Story'}

                        </span>

                        {events.length > 1 && (

                          <span className="pill-count">+{events.length - 1}</span>

                        )}

                      </div>

                    )}

                  </button>

                );

              })}

            </div>

          ))}

        </div>

      </div>



      <div className="schedule-selected-info">

        <div>

          <span>Choix sélectionné</span>

          <strong>{selectedScheduleAt ? selectedScheduleAt.toLocaleString() : 'Aucune date choisie'}</strong>

        </div>

        <button type="button" className="story-schedule-button primary" onClick={onScheduleConfirm}>

          {scheduleButtonLabel}

        </button>

      </div>

    </div>

  );



  const openStorySchedulePicker = () => {

    const hasContent =

      manualMediaFiles.length > 0 || Boolean(storyPreview) || Boolean(storyMediaPreview || storyCover);

    if (!hasContent) {

      setScheduleMessage('Génère ou ajoute d\'abord un média avant de planifier.');

      return;

    }

    setShowStoryManualSchedulePicker((prev) => !prev);

    setShowStoryAiSchedulePicker(false);

    setScheduleMessage('');

  };



  // Helpers: ajout dynamique dans les sections (Publié / Planifié / Brouillon)

  const createPublished = (payload) => {

    const publishedPayload = { ...payload, status: 'published' };

    setTiktokPosts((prev) => [publishedPayload, ...prev]);

    return publishedPayload;

  };



  const createScheduled = (payload) => {

    const scheduledAt =

      payload.scheduledAt ||

      selectedScheduleAt ||

      (payload.storyScheduledAt ? new Date(payload.storyScheduledAt) : null);

    const scheduledPayload = {

      ...payload,

      status: 'scheduled',

      scheduledAt: scheduledAt || new Date()

    };

    setScheduledItems((prev) => [...prev, scheduledPayload]);

    return scheduledPayload;

  };



  const createDraft = (payload) => {

    const draftPayload = { ...payload, status: 'draft' };

    setDraftItems((prev) => [draftPayload, ...prev]);

    return draftPayload;

  };



  const persistTiktokPost = async (payload, status = 'published') => {

    let apiPayload = tiktokItemToApiPayload({ ...payload, status }, status);

    if (apiPayload.media?.length) {

      apiPayload = {

        ...apiPayload,

        media: await Promise.all(apiPayload.media.map(resolveMediaUrl)),

      };

    }

    const existingId = payload._id || payload.id;

    const saved = existingId && !String(existingId).startsWith('story-') && !String(existingId).startsWith('video-') && !String(existingId).startsWith('photo-')

      ? await updatePost(existingId, apiPayload)

      : await createPost(apiPayload);

    const mapped = { ...apiPostToTiktokItem(saved), status: saved.status || status };

    setTiktokPosts((prev) => {

      const idx = prev.findIndex((p) => p.id === mapped.id || p._id === mapped._id);

      if (idx >= 0) {

        const next = [...prev];

        next[idx] = { ...prev[idx], ...mapped };

        return next;

      }

      return [mapped, ...prev];

    });

    return mapped;

  };



  useEffect(() => {

    getPosts({ platform: 'tiktok' })

      .then((loaded) => {

        if (!Array.isArray(loaded) || loaded.length === 0) return;

        const fromApi = loaded.map(apiPostToTiktokItem);

        setTiktokPosts((prev) => {

          const apiIds = new Set(fromApi.map((p) => p.id));

          const localOnly = prev.filter((p) => !apiIds.has(p.id));

          return [...fromApi, ...localOnly];

        });

      })

      .catch(() => { /* backend indisponible */ });

  }, []);



  /** Image / Story : forcer l’aperçu image (pas une balise vidéo) ; vidéo seulement si type ou URL vidéo. */
  const isPostVideoMedia = (post) => {
    if (!post) return false;
    if (post.type === 'video') return true;
    if (post.type === 'image' || post.type === 'story') return false;
    const u = String(post.contentPreview || '');
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(u) || u.includes('.mp4');
  };

  const createStoryPayload = () => {

    const kindLabel = creationKind === 'video' ? 'Vidéo' : creationKind === 'image' ? 'Image' : 'Story';

    const contentPreview =
      storyMediaPreview ||
      (manualMediaFiles?.length > 0 ? URL.createObjectURL(manualMediaFiles[0]) : null) ||
      storyCover;

    const isStoryVideo =
      creationKind === 'story' &&
      (storyMediaType === 'video' || storyAiMediaKind === 'video');

    const contentType =
      creationKind === 'image'
        ? 'photo'
        : creationKind === 'video' || isStoryVideo
          ? 'video'
          : 'story';

    return {

      id: editingPublishedFromCreateId || `story-${Date.now()}`,

      type: creationKind === 'story' ? 'story' : creationKind,

      contentType,

      title: storyPreview || `${kindLabel} TikTok`,

      contentPreview,

      createdAt: storyCreatedAt || new Date(),

      description: storyCaption || storyPreview || `Nouveau contenu ${kindLabel.toLowerCase()} TikTok`,

      username: '@vous',

      sound: selectedSound,

      status: 'draft',

      likes: 0,

      comments: 0,

      shares: 0,

      // Métadonnées pour l'aperçu TikTok

      mediaType: storyMediaType,

      caption: storyCaption || storyPreview,

      hashtags: storyHashtags || (creationKind === 'video' ? '#tiktok #video #fyp' : creationKind === 'image' ? '#tiktok #image #fyp' : '#tiktok #story #fyp'),

      visibility: storyVisibility,

      allowComments: storyAllowComments,

      allowDuet: storyAllowDuet,

      allowStitch: storyAllowStitch,

      // Spécifique à l'IA

      isAI: storyMode === 'ai',

      aiPrompt: storyMode === 'ai' ? aiPrompt : null

    };

  };



  const resetStoryState = () => {

    setAiPrompt('');

    setStoryPreview('');

    setSelectedSound('Ajouter un son');

    setShowSoundPicker(false);

    setSoundPickerMode('menu');

    setStoryViewMode('desktop');

    setStoryCreatedAt(null);

    setShowSchedulePicker(false);

    setShowStoryAiSchedulePicker(false);

    setShowStoryManualSchedulePicker(false);

    setSelectedScheduleAt(null);

    setPublishStatus('');

    setScheduleMessage('');

    setScheduleWeekStart(getStartOfWeek(new Date()));

    setManualMediaFiles([]);

    // Reset des nouveaux états Story

    setStoryMediaType('photo');

    setStoryAiMediaKind('image');

    setStoryMode('ai');

    setStoryCaption('');

    setStoryCover('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80');

    setStoryScheduledAt('');

    setStoryMediaPreview('');

    setStoryMediaName('');

    setStoryVisibility('public');

    setStoryAllowComments(true);

    setStoryAllowDuet(true);

    setStoryAllowStitch(true);

    setStoryHashtags('');

    setCurrentPhotoIndex(0);

  };



  const handleStoryClick = () => {

    // UX: ouverture directe de l'éditeur (sans étape "manuel vs IA")

    setCreationKind('story');

    setSelectedPublishType('story-ai');

    resetStoryState();

  };



  const handleManualClick = () => {

    setSelectedPublishType('story-ai');

    resetStoryState();

    setStoryMode('manual');

    setShowCreateSection(true);

  };



  const handleAiClick = () => {

    setSelectedPublishType('story-ai');

    resetStoryState();

    setShowCreateSection(true);

  };



  const handlePhotoManualClick = () => {

    setCreationKind('image');

    setSelectedPublishType('story-ai');

    resetStoryState();

    setPhotoMode('manual');

    setShowCreateSection(true);

  };



  const handlePhotoAiClick = () => {

    setCreationKind('image');

    setSelectedPublishType('story-ai');

    resetPhotoState();

    setPhotoMode('ai');

    setShowCreateSection(true);

  };



  const handleVideoClick = () => {

    // Ouverture directe de l'éditeur (comme Story)

    setCreationKind('video');

    setSelectedPublishType('story-ai');

    resetVideoState();

    setShowCreateSection(true);

  };



  const handleVideoManualClick = () => {

    setCreationKind('video');

    setSelectedPublishType('story-ai');

    resetVideoState();

    setVideoMode('manual');

    setShowCreateSection(true);

  };



  const handleVideoAiClick = () => {

    setCreationKind('video');

    setSelectedPublishType('story-ai');

    resetVideoState();

    setVideoMode('ai');

    setShowCreateSection(true);

  };



  const handleStoryMediaTypeChange = (mediaType) => {

    setStoryMediaType(mediaType);

  };



  const handleStoryModeChange = (mode) => {

    setStoryMode(mode);

  };



  const handleStoryCaptionChange = (caption) => {

    setStoryCaption(caption);

  };



  const handleStoryCoverChange = (coverUrl) => {

    setStoryCover(coverUrl);

  };



  const handleStoryHashtagsChange = (hashtags) => {

    setStoryHashtags(hashtags);

  };



  const handleStoryVisibilityChange = (visibility) => {

    setStoryVisibility(visibility);

  };



  const handleStoryPrivacyToggle = (option) => {

    switch (option) {

      case 'comments':

        setStoryAllowComments(!storyAllowComments);

        break;

      case 'duet':

        setStoryAllowDuet(!storyAllowDuet);

        break;

      case 'stitch':

        setStoryAllowStitch(!storyAllowStitch);

        break;

    }

  };



  const handleStoryScheduledAtChange = (date) => {

    setStoryScheduledAt(date);

  };



  const handleStoryUpload = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    

    const url = URL.createObjectURL(file);

    setStoryMediaPreview(url);

    setStoryMediaName(file.name);

    setStoryCover(url);

    setStoryMode('manual');

    

    // Ajouter aux fichiers manuels aussi pour l'aperçu

    setManualMediaFiles([file]);

  };



  const handleStoryPublish = async () => {

    if (!manualMediaFiles.length && !storyMediaPreview && !storyPreview) {

      setPublishStatus('Ajoute un média ou génère un contenu avant de publier');

      return;

    }



    const payload = createStoryPayload();

    try {

      if (editingPublishedFromCreateId) {

        await persistTiktokPost({ ...payload, id: editingPublishedFromCreateId, status: 'published' }, 'published');

        setPublishStatus('Modifications sauvegardées et publiées !');

        setEditingPublishedFromCreateId(null);

      } else {

        await persistTiktokPost(payload, 'published');

        setPublishStatus(`${creationKind === 'video' ? 'Vidéo' : creationKind === 'image' ? 'Image' : 'Story'} publiée avec succès !`);

      }

      setActiveTab('published');

      setShowCreateSection(false);

      setSelectedPublishType(null);

      resetStoryState();

    } catch (error) {

      alert(error.message || 'Impossible de publier la story');

    }

  };



  const handleStorySchedule = () => {

    if (!storyScheduledAt) {

      setPublishStatus('Choisis une date de planification');

      return;

    }



    const payload = {
      ...createStoryPayload(),
      scheduledAt: new Date(storyScheduledAt),
    };

    createScheduled(payload);

    setPublishStatus(`${creationKind === 'video' ? 'Vidéo' : creationKind === 'image' ? 'Image' : 'Story'} planifiée avec succès !`);

    setShowCreateSection(false);

    setSelectedPublishType(null);

    resetStoryState();

  };



  const handleStorySaveDraft = () => {

    if (editingDraftFromListId) {

      handleSaveDraftFromCreator();

      return;

    }

    const payload = createStoryPayload();

    createDraft(payload);

    setPublishStatus(`${creationKind === 'video' ? 'Vidéo' : creationKind === 'image' ? 'Image' : 'Story'} sauvegardée en brouillon`);

    setShowCreateSection(false);

    setSelectedPublishType(null);

    resetStoryState();

  };



  const handleAiSubmit = async (event) => {

    event.preventDefault();

    const prompt = aiPrompt.trim();

    if (!prompt) return;

    const mediaKind =
      creationKind === 'video'
        ? 'video'
        : creationKind === 'image'
          ? 'image'
          : storyMediaType === 'video'
            ? 'video'
            : 'image';

    setIsAiMediaGenerating(true);

    try {

      const result = await generateThemedPostMedia({

        description: prompt,

        platform: 'tiktok',

        postType: mapPostTypeForApi(mediaKind),

        regenerate: Boolean(storyPreview.trim() || storyCaption.trim() || storyMediaPreview),

      });

      const now = new Date();

      setStoryPreview(prompt);

      setStoryCaption(result.caption);

      setStoryHashtags(result.hashtags);

      if (result.mediaItems[0]?.type) {
        setStoryAiMediaKind(result.mediaItems[0].type === 'video' ? 'video' : 'image');
      } else if (creationKind === 'story') {
        setStoryAiMediaKind(storyMediaType === 'video' ? 'video' : 'image');
      }

      if (result.mediaUrl) {

        setStoryMediaPreview(result.mediaUrl);

        setStoryCover(result.mediaUrl);

      }

      setStoryCreatedAt(now);

      setSelectedScheduleAt(null);

      setShowSoundPicker(false);

      setPublishStatus('');

      setScheduleMessage('');

      setScheduleWeekStart(getStartOfWeek(now));

    } catch (error) {

      alert(error.message || 'Erreur de génération IA');

    } finally {

      setIsAiMediaGenerating(false);

    }

  };



  const handlePhotoAiSubmit = async (event) => {

    event.preventDefault();

    const prompt = photoPrompt.trim();

    if (!prompt) return;

    setIsAiMediaGenerating(true);

    try {

      const result = await generateThemedPostMedia({

        description: prompt,

        platform: 'tiktok',

        postType: 'image',

        regenerate: Boolean(photoPreview.trim() || photoCaption.trim() || photoCover),

      });

      const now = new Date();

      setPhotoPreview(prompt);

      setPhotoCaption(result.caption);

      setPhotoHashtags(result.hashtags);

      if (result.mediaUrl) {

        setPhotoCover(result.mediaUrl);

        setPhotoMediaPreview(result.mediaUrl);

      }

      setPhotoCreatedAt(now);

      setSelectedScheduleAt(null);

      setShowSoundPicker(false);

      setPublishStatus('');

      setScheduleMessage('');

      setScheduleWeekStart(getStartOfWeek(now));

    } catch (error) {

      alert(error.message || 'Erreur de génération IA');

    } finally {

      setIsAiMediaGenerating(false);

    }

  };



  const handlePhotoPublish = async () => {

    if (!photoPreview && manualMediaFiles.length === 0) {

      setPublishStatus('Génère ou ajoute d\'abord une image avant de publier');

      return;

    }



    const contentPreview =

      manualMediaFiles[0] != null ? URL.createObjectURL(manualMediaFiles[0]) : photoCover;



    const payload = {

      id: editingPublishedFromCreateId || `photo-${Date.now()}`,

      type: 'image',

      title: photoPreview || 'Photo TikTok',

      contentPreview,

      createdAt: photoCreatedAt || new Date(),

      description: photoPreview || 'Nouvelle photo TikTok',

      username: '@vous',

      sound: selectedSound,

      status: 'published',

      caption: photoCaption || photoPreview,

      hashtags: photoHashtags || '#tiktok #photo #fyp',

      visibility: photoVisibility,

      allowComments: photoAllowComments,

      allowDuet: photoAllowDuet,

      allowStitch: photoAllowStitch,

      isAI: photoMode === 'ai',

      aiPrompt: photoMode === 'ai' ? photoPrompt : null

    };



    try {

      if (editingPublishedFromCreateId) {

        await persistTiktokPost({ ...payload, id: editingPublishedFromCreateId }, 'published');

        setPublishStatus('Modifications sauvegardées et publiées !');

        setEditingPublishedFromCreateId(null);

      } else {

        await persistTiktokPost(payload, 'published');

        setPublishStatus('Photo publiée avec succès !');

      }

      setActiveTab('published');

      setTimeout(() => {

        setShowCreateSection(false);

        setSelectedPublishType(null);

        resetPhotoState();

      }, 1500);

    } catch (error) {

      alert(error.message || 'Impossible de publier la photo');

    }

  };



  const handlePhotoSchedule = () => {

    const scheduleAt = selectedScheduleAt || (photoScheduledAt ? new Date(photoScheduledAt) : null);

    if (!scheduleAt) {

      setPublishStatus('Choisis une date de planification dans le calendrier.');

      return;

    }



    const contentPreview =

      manualMediaFiles[0] != null ? URL.createObjectURL(manualMediaFiles[0]) : photoCover;



    const payload = {

      id: `photo-scheduled-${Date.now()}`,

      type: 'image',

      title: photoPreview || 'Photo planifiée',

      contentPreview,

      scheduledAt: scheduleAt,

      createdAt: new Date(),

      description: photoPreview || 'Nouvelle photo TikTok',

      username: '@vous',

      sound: selectedSound,

      status: 'scheduled',

      // Métadonnées pour l'aperçu TikTok

      caption: photoPreview,

      hashtags: photoHashtags || '#tiktok #photo #fyp',

      visibility: photoVisibility,

      allowComments: photoAllowComments,

      allowDuet: photoAllowDuet,

      allowStitch: photoAllowStitch,

      // Spécifique à l'IA

      isAI: photoMode === 'ai',

      aiPrompt: photoMode === 'ai' ? photoPrompt : null

    };



    // Ajouter aux éléments planifiés

    setScheduledItems(prev => [...prev, payload]);

    setPublishStatus('Photo planifiée avec succès !');

    setShowSchedulePicker(false);

    resetStoryState();

  };



  const handlePhotoSaveDraft = () => {

    const payload = {

      id: `photo-draft-${Date.now()}`,

      type: 'image',

      title: photoPreview || 'Photo TikTok',

      contentPreview: photoCover,

      createdAt: new Date(),

      description: photoPreview || 'Nouvelle photo TikTok',

      username: '@vous',

      sound: selectedSound,

      status: 'draft',

      // Métadonnées pour l'aperçu TikTok

      caption: photoPreview,

      hashtags: photoHashtags || '#tiktok #photo #fyp',

      visibility: photoVisibility,

      allowComments: photoAllowComments,

      allowDuet: photoAllowDuet,

      allowStitch: photoAllowStitch,

      // Spécifique à l'IA

      isAI: photoMode === 'ai',

      aiPrompt: photoMode === 'ai' ? photoPrompt : null

    };



    // Ajouter aux brouillons

    setDraftItems(prev => [payload, ...prev]);

    setPublishStatus('Photo sauvegardée en brouillon');

    resetStoryState();

  };



  const resetPhotoState = () => {

    setPhotoPrompt('');

    setPhotoPreview('');

    setPhotoMode('ai');

    setPhotoCaption('');

    setPhotoHashtags('');

    setPhotoCover('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80');

    setPhotoScheduledAt('');

    setPhotoMediaPreview('');

    setPhotoMediaName('');

    setPhotoGallery([]);

    setCurrentPhotoIndex(0);

    setPhotoVisibility('public');

    setPhotoAllowComments(true);

    setPhotoAllowDuet(false);

    setPhotoAllowStitch(false);

    setPhotoCreatedAt(null);

    setManualPhotoFiles([]);

    setManualMediaFiles([]);

    setPhotoSoundQuery('');

    setPhotoSoundResults([]);

    setSelectedPhotoSound(null);

    setShowPhotoSoundSearch(false);

  };



  // Fonctions pour la gestion vidéo

  const resetVideoState = () => {

    setVideoPrompt('');

    setVideoPreview('');

    setSelectedSound('Ajouter un son');

    setShowSoundPicker(false);

    setSoundPickerMode('menu');

    setVideoCreatedAt(null);

    setShowSchedulePicker(false);

    setSelectedScheduleAt(null);

    setPublishStatus('');

    setScheduleMessage('');

    setScheduleWeekStart(getStartOfWeek(new Date()));

    setManualVideoFiles([]);

    setShowVideoComposeSchedulePicker(false);

    setVideoMode('ai');

    setVideoCaption('');

    setVideoCover('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=80');

    setVideoScheduledAt('');

    setVideoMediaPreview('');

    setVideoMediaName('');

    setVideoVisibility('public');

    setVideoAllowComments(true);

    setVideoAllowDuet(true);

    setVideoAllowStitch(true);

    setVideoHashtags('');

    setSelectedVideoSound(null);

    setVideoSoundQuery('');

    setVideoSoundResults([]);

    setShowVideoSoundSearch(false);

  };



  const handleVideoAiSubmit = async (event) => {

    event.preventDefault();

    const prompt = videoPrompt.trim();

    if (!prompt) return;

    setIsAiMediaGenerating(true);

    try {

      const result = await generateThemedPostMedia({

        description: prompt,

        platform: 'tiktok',

        postType: 'video',

        regenerate: Boolean(videoPreview.trim() || videoCaption.trim() || videoCover),

      });

      const now = new Date();

      setVideoPreview(prompt);

      setVideoCaption(result.caption);

      setVideoHashtags(result.hashtags);

      if (result.mediaUrl) {

        setVideoCover(result.mediaUrl);

        setVideoMediaPreview(result.mediaUrl);

      }

      setVideoCreatedAt(now);

      setSelectedScheduleAt(null);

      setShowSoundPicker(false);

      setPublishStatus('');

      setScheduleMessage('');

      setScheduleWeekStart(getStartOfWeek(now));

    } catch (error) {

      alert(error.message || 'Erreur de génération IA');

    } finally {

      setIsAiMediaGenerating(false);

    }

  };



  const handleVideoPublish = async () => {

    if (!videoPreview && manualVideoFiles.length === 0) {

      setPublishStatus('Génère ou ajoute d\'abord une vidéo avant de publier');

      return;

    }



    const payload = {

      id: editingPublishedFromCreateId || `video-${Date.now()}`,

      type: 'video',

      title: videoPreview || 'Vidéo TikTok',

      contentPreview:

        manualVideoFiles[0] != null ? URL.createObjectURL(manualVideoFiles[0]) : videoCover,

      createdAt: videoCreatedAt || new Date(),

      description: videoPreview || 'Nouvelle vidéo TikTok',

      username: '@vous',

      sound: selectedVideoSound ? selectedVideoSound.title : selectedSound,

      status: 'published',

      caption: videoCaption || videoPreview,

      hashtags: videoHashtags || '#tiktok #video #fyp',

      visibility: videoVisibility,

      allowComments: videoAllowComments,

      allowDuet: videoAllowDuet,

      allowStitch: videoAllowStitch,

      isAI: videoMode === 'ai',

      aiPrompt: videoMode === 'ai' ? videoPrompt : null

    };



    try {

      if (editingPublishedFromCreateId) {

        await persistTiktokPost({ ...payload, id: editingPublishedFromCreateId }, 'published');

        setPublishStatus('Modifications sauvegardées et publiées !');

        setEditingPublishedFromCreateId(null);

      } else {

        await persistTiktokPost(payload, 'published');

        setPublishStatus('Vidéo publiée avec succès !');

      }

      setActiveTab('published');

      setTimeout(() => {

        setShowCreateSection(false);

        setSelectedPublishType(null);

        resetVideoState();

      }, 1500);

    } catch (error) {

      alert(error.message || 'Impossible de publier la vidéo');

    }

  };



  const handleVideoSchedule = () => {

    const scheduleAt = selectedScheduleAt || (videoScheduledAt ? new Date(videoScheduledAt) : null);

    if (!scheduleAt) {

      setPublishStatus('Choisis une date de planification dans le calendrier.');

      return;

    }



    const payload = {

      id: `video-scheduled-${Date.now()}`,

      type: 'video',

      title: videoPreview || 'Vidéo planifiée',

      contentPreview:

        manualVideoFiles[0] != null ? URL.createObjectURL(manualVideoFiles[0]) : videoCover,

      scheduledAt: scheduleAt,

      createdAt: new Date(),

      description: videoPreview || 'Nouvelle vidéo TikTok',

      username: '@vous',

      sound: selectedVideoSound ? selectedVideoSound.title : selectedSound,

      status: 'scheduled',

      // Métadonnées pour l'aperçu TikTok

      caption: videoPreview,

      hashtags: videoHashtags || '#tiktok #video #fyp',

      visibility: videoVisibility,

      allowComments: videoAllowComments,

      allowDuet: videoAllowDuet,

      allowStitch: videoAllowStitch,

      // Spécifique à l'IA

      isAI: videoMode === 'ai',

      aiPrompt: videoMode === 'ai' ? videoPrompt : null

    };



    // Ajouter aux éléments planifiés

    setScheduledItems(prev => [...prev, payload]);

    setPublishStatus('Vidéo planifiée avec succès !');

    setShowVideoComposeSchedulePicker(false);

    resetVideoState();

  };



  const handleVideoSaveDraft = () => {

    const payload = {

      id: `video-draft-${Date.now()}`,

      type: 'video',

      title: videoPreview || 'Vidéo TikTok',

      contentPreview: videoCover,

      createdAt: new Date(),

      description: videoPreview || 'Nouvelle vidéo TikTok',

      username: '@vous',

      sound: selectedVideoSound ? selectedVideoSound.title : selectedSound,

      status: 'draft',

      // Métadonnées pour l'aperçu TikTok

      caption: videoPreview,

      hashtags: videoHashtags || '#tiktok #video #fyp',

      visibility: videoVisibility,

      allowComments: videoAllowComments,

      allowDuet: videoAllowDuet,

      allowStitch: videoAllowStitch,

      // Spécifique à l'IA

      isAI: videoMode === 'ai',

      aiPrompt: videoMode === 'ai' ? videoPrompt : null

    };



    // Ajouter aux brouillons

    setDraftItems(prev => [payload, ...prev]);

    setPublishStatus('Vidéo sauvegardée en brouillon');

    resetVideoState();

  };



  // Fonctions pour la recherche de son vidéo

  const handleVideoSoundSearch = (query) => {

    setVideoSoundQuery(query);

    

    if (query.length < 2) {

      setVideoSoundResults([]);

      return;

    }



    // Simuler une recherche de sons (à remplacer par une vraie API)

    const mockSounds = [

      { id: 'sound-1', title: 'Trending Beat 2024', artist: 'DJ Producer', duration: '0:15' },

      { id: 'sound-2', title: 'Summer Vibes', artist: 'Beach Music', duration: '0:12' },

      { id: 'sound-3', title: 'Dance Floor', artist: 'Club Hits', duration: '0:18' },

      { id: 'sound-4', title: 'Chill Mode', artist: 'Relax Beats', duration: '0:20' },

      { id: 'sound-5', title: 'Energy Boost', artist: 'Workout Music', duration: '0:16' }

    ];



    const filtered = mockSounds.filter(sound => 

      sound.title.toLowerCase().includes(query.toLowerCase()) ||

      sound.artist.toLowerCase().includes(query.toLowerCase())

    );

    

    setVideoSoundResults(filtered);

  };



  const handleSelectVideoSound = (sound) => {

    setSelectedVideoSound(sound);

    setShowVideoSoundSearch(false);

    setVideoSoundQuery('');

    setVideoSoundResults([]);

  };



  const handleRemoveVideoSound = () => {

    setSelectedVideoSound(null);

  };



  const generateMetadataFromPrompt = (rawPrompt, mediaKind) => {

    const prompt = rawPrompt.trim();

    const words = prompt.toLowerCase().split(/\s+/).filter(Boolean);

    const thematic = [];

    if (words.some((word) => word.includes('beaute') || word.includes('beauté') || word.includes('skin'))) thematic.push('#beaute', '#beautytips');

    if (words.some((word) => word.includes('mode') || word.includes('fashion') || word.includes('style'))) thematic.push('#fashion', '#style');

    if (words.some((word) => word.includes('food') || word.includes('cuisine') || word.includes('recipe'))) thematic.push('#food', '#foodie');

    if (words.some((word) => word.includes('travel') || word.includes('voyage') || word.includes('aventure'))) thematic.push('#travel', '#explore');

    if (words.some((word) => word.includes('sport') || word.includes('fitness') || word.includes('workout'))) thematic.push('#fitness', '#workout');

    const base =

      mediaKind === 'video'

        ? ['#tiktok', '#video', '#fyp', '#viral']

        : mediaKind === 'story'

        ? ['#tiktok', '#story', '#fyp', '#viral']

        : ['#tiktok', '#photo', '#fyp', '#viral'];

    const hashtags = [...new Set([...base, ...thematic])].slice(0, 8).join(' ');

    return {

      caption: `✨ ${prompt}`,

      hashtags

    };

  };



  const handleApplyPhotoMetadata = () => {

    setPhotoPreview(photoCaption || photoPreview);

    setPublishStatus('Caption et hashtags ajoutés à l’aperçu.');

  };



  const handleApplyVideoMetadata = () => {

    setVideoPreview(videoCaption || videoPreview);

    setPublishStatus('Caption et hashtags ajoutés à l’aperçu.');

  };



  const handleApplyStoryMetadata = () => {

    if (storyCaption.trim()) {

      setStoryPreview(storyCaption.trim());

    }

    setPublishStatus('Caption et hashtags ajoutés à l’aperçu.');

  };



  const handleOpenSoundPicker = () => {

    setShowSoundPicker((prev) => !prev);

    setSoundPickerMode('menu');

  };



  const handleSelectSuggestedSound = (sound) => {

    setSelectedSound(sound);

    setShowSoundPicker(false);

    setSoundPickerMode('menu');

  };



  const handleImportSoundClick = () => {

    if (soundInputRef.current) {

      soundInputRef.current.click();

    }

  };



  const handleAudioFileChange = (event) => {

    const file = event.target.files?.[0];

    if (file) {

      setSelectedSound(file.name);

      setShowSoundPicker(false);

      setSoundPickerMode('menu');

    }

    event.target.value = '';

  };



  // Fonction pour naviguer vers la photo suivante

  const handleNextPhoto = () => {

    if (manualMediaFiles.length <= 1) return;

    setCurrentPhotoIndex((prevIndex) => {

      const nextIndex = (prevIndex + 1) % manualMediaFiles.length;

      const f = manualMediaFiles[nextIndex];

      if (f && !f.type?.startsWith('video/')) {

        setPhotoPreview(URL.createObjectURL(f));

      }

      requestAnimationFrame(() => {

        const el = manualCarouselRef.current;

        if (el) el.scrollTo({ left: nextIndex * el.clientWidth, behavior: 'smooth' });

      });

      return nextIndex;

    });

  };



  // Fonction pour naviguer vers la photo précédente

  const handlePreviousPhoto = () => {

    if (manualMediaFiles.length <= 1) return;

    setCurrentPhotoIndex((currentIndex) => {

      const prevIndex = currentIndex === 0 ? manualMediaFiles.length - 1 : currentIndex - 1;

      const f = manualMediaFiles[prevIndex];

      if (f && !f.type?.startsWith('video/')) {

        setPhotoPreview(URL.createObjectURL(f));

      }

      requestAnimationFrame(() => {

        const el = manualCarouselRef.current;

        if (el) el.scrollTo({ left: prevIndex * el.clientWidth, behavior: 'smooth' });

      });

      return prevIndex;

    });

  };



  const handleOpenSchedulePicker = () => {

    // Autoriser la planification:

    // - si une story IA a été générée (storyPreview)

    // - ou si un média manuel est sélectionné

    if (manualMediaFiles.length === 0 && !storyPreview) {

      setScheduleMessage('Ajoute d\'abord un média pour planifier.');

      return;

    }

    setShowSchedulePicker((prev) => !prev);

    setScheduleMessage('');

  };



  const handleOpenSchedulePickerPhoto = () => {

    if (manualMediaFiles.length === 0 && !photoPreview) {

      setScheduleMessage('Ajoute ou génère d\'abord du contenu pour planifier.');

      return;

    }

    setShowSchedulePicker((prev) => !prev);

    setScheduleMessage('');

  };



  const openVideoComposeSchedulePicker = () => {

    if (manualVideoFiles.length === 0 && !videoPreview) {

      setScheduleMessage('Ajoute ou génère d\'abord une vidéo avant de planifier.');

      return;

    }

    setShowVideoComposeSchedulePicker((prev) => !prev);

    setScheduleMessage('');

  };



const handleChangeWeek = (direction) => {

  setScheduleWeekStart((current) => addDays(current, direction * 7));

};



const handleSelectScheduleCell = (day, hour) => {

  const date = new Date(day);

  date.setHours(parseInt(hour, 10), 0, 0, 0);

  setSelectedScheduleAt(date);

  setScheduleMessage('');

};



const handleSelectScheduleCellPhoto = (day, hour) => {

  const date = new Date(day);

  date.setHours(parseInt(hour, 10), 0, 0, 0);

  setSelectedScheduleAt(date);

  setScheduleMessage('');

};



const handleSchedulePublish = () => {

  if (!selectedScheduleAt) {

    setScheduleMessage('Choisis d\'abord une date et une heure.');

    return;

  }



  // Story planifiée: soit issue d'un média manuel, soit d'un aperçu IA (storyPreview)

  if (manualMediaFiles.length === 0 && !storyPreview && !storyMediaPreview) {

    setScheduleMessage('Ajoute d\'abord un média ou génère une story IA pour planifier.');

    return;

  }



  const title = storyPreview || manualMediaFiles[0]?.name || 'Story planifiée';

  const caption = storyPreview || 'Nouvelle story TikTok';



  const preview = manualMediaFiles[0]

      ? URL.createObjectURL(manualMediaFiles[0])

      : storyMediaPreview || storyCover || 'https://picsum.photos/400/600';



  if (editingScheduledFromListId) {

    setScheduledItems(prev => prev.map(item => item.id === editingScheduledFromListId ? {

      ...item,

      title: title,

      contentPreview: preview,

      scheduledAt: selectedScheduleAt,

      description: caption,

      caption: caption,

      hashtags: storyHashtags || item.hashtags,

      sound: selectedSound !== 'Ajouter un son' ? selectedSound : item.sound,

      visibility: storyVisibility || item.visibility

    } : item));

    

    setPublishStatus('Contenu planifié mis à jour !');

    setScheduleMessage(`✅ Story planifiée pour le ${selectedScheduleAt.toLocaleString()}`);

    

    setShowSchedulePicker(false);

    setShowStoryAiSchedulePicker(false);

    setShowStoryManualSchedulePicker(false);

    

    setTimeout(() => {

      setSelectedPublishType(null);

      resetStoryState();

      setShowCreateSection(false);

      setEditingScheduledFromListId(null);

    }, 2000);

    return;

  }



  // Créer l'élément de story planifiée avec le vrai aperçu

  const newItem = {

    id: `story-scheduled-${Date.now()}`,

    type: creationKind || 'story',

    title: title,

    contentPreview: preview,

    scheduledAt: selectedScheduleAt,

    createdAt: new Date(),

    description: caption,

    username: '@vous',

    sound: selectedSound,

    status: 'scheduled',

    // Métadonnées pour l'aperçu TikTok

    mediaType: manualMediaFiles[0]?.type?.startsWith('video/') ? 'video' : (storyMediaType || 'image'),

    caption: caption,

    hashtags: storyHashtags || '#tiktok #story #fyp',

    visibility: storyVisibility || 'public'

  };



  // Ajouter aux éléments planifiés

  setScheduledItems((prev) => {

    const updated = [...prev, newItem];

    console.log('Story TikTok planifiée:', newItem);

    return updated;

  });



  // Afficher le message de confirmation

  setScheduleMessage(`✅ Story planifiée pour le ${selectedScheduleAt.toLocaleString()}`);

  setPublishStatus('Story ajoutée aux planifiés !');

  

  // Fermer le calendrier et réinitialiser

  setShowSchedulePicker(false);

  setShowStoryAiSchedulePicker(false);

  setShowStoryManualSchedulePicker(false);

  

  // Optionnel: fermer l'interface de création après planification

  setTimeout(() => {

    setSelectedPublishType(null);

    resetStoryState();

    setShowCreateSection(false);

  }, 2000);

};



  const handleOpenManualMediaPicker = () => {

    manualMediaInputRef.current?.click();

  };

  const handleRemoveManualMediaFile = (index) => {

    setManualMediaFiles((prev) => prev.filter((_, idx) => idx !== index));

  };



  const handleOpenVideoManualMediaPicker = () => {

    manualVideoInputRef.current?.click();

  };

  const handleRemoveVideoManualMediaFile = (index) => {

    setManualVideoFiles((prev) => prev.filter((_, idx) => idx !== index));

  };

  const handleVideoManualMediaFileChange = (event) => {

    const files = Array.from(event.target.files);

    setManualVideoFiles((prev) => {

      const newFiles = [...prev];

      files.forEach((file) => {

        if (newFiles.length < 4) {

          newFiles.push(file);

        }

      });

      return newFiles.slice(0, 4);

    });

  };



  const handleManualSubmit = () => {

    if (manualMediaFiles.length === 0) {

      setPublishStatus('Ajoute d\'abord un média pour publier');

      return;

    }



    // Créer le payload pour la publication

    const payload = {

      id: `manual-${Date.now()}`,

      type: manualMediaFiles[0]?.type?.startsWith('video/') ? 'video' : 'image',

      title: storyPreview || 'Contenu manuel',

      contentPreview: manualMediaFiles[0] ? URL.createObjectURL(manualMediaFiles[0]) : '',

      createdAt: new Date(),

      description: storyPreview || 'Nouveau contenu TikTok',

      username: '@vous',

      sound: selectedSound,

      status: 'published'

    };



    // Ajouter aux posts publiés

    setTiktokPosts(prev => [payload, ...prev]);

    setPublishStatus('Contenu publié avec succès !');

    

    // Fermer l'interface et réinitialiser

    setTimeout(() => {

      setShowCreateSection(false);

      setSelectedPublishType(null);

      resetStoryState();

    }, 2000);

  };



  const handleManualMediaFileChange = (event) => {

    const files = Array.from(event.target.files);

    setManualMediaFiles((prev) => {

      const newFiles = [...prev];

      files.forEach((file) => {

        if (newFiles.length < 4) {

          newFiles.push(file);

        }

      });

      return newFiles.slice(0, 4);

    });



    // Story manuelle: synchroniser un aperçu utilisable dans les sections Publiés/Planifiés/Brouillons

    if (files.length > 0) {

      const url = URL.createObjectURL(files[0]);

      setStoryMediaPreview(url);

      setStoryCover(url);

      setStoryMode('manual');

      setStoryMediaType(files[0].type?.startsWith('video/') ? 'video' : 'photo');

    }

  };



  // Fonctions pour les interactions dynamiques avec les posts TikTok

  const handleLikePost = (postId) => {

    setPostInteractions(prev => {

      const current = prev[postId] || {};

      const isLiked = !current.liked;

      

      // Mettre à jour les likes dans tiktokPosts

      const postIndex = tiktokPosts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {

        tiktokPosts[postIndex].likes += isLiked ? 1 : -1;

        tiktokPosts[postIndex].bookmarked = isLiked;

      }

      

      return {

        ...prev,

        [postId]: {

          ...current,

          liked: isLiked,

          likes: (current.likes || 0) + (isLiked ? 1 : -1)

        }

      };

    });

  };



  const handleBookmarkPost = (postId) => {

    setPostInteractions(prev => {

      const current = prev[postId] || {};

      const isBookmarked = !current.bookmarked;

      

      // Mettre à jour bookmarked dans tiktokPosts

      const postIndex = tiktokPosts.findIndex(p => p.id === postId);

      if (postIndex !== -1) {

        tiktokPosts[postIndex].bookmarked = isBookmarked;

      }

      

      return {

        ...prev,

        [postId]: {

          ...current,

          bookmarked: isBookmarked

        }

      };

    });

  };



  const handleCommentPost = (postId) => {

    // Ouvrir une interface de commentaire

    console.log('Commenter le post:', postId);

    // Pour l'instant, on augmente juste le compteur

    setPostInteractions(prev => {

      const current = prev[postId] || {};

      return {

        ...prev,

        [postId]: {

          ...current,

          comments: (current.comments || 0) + 1

        }

      };

    });

  };



  const handleSharePost = (postId) => {

    // Partager le post

    console.log('Partager le post:', postId);

    // Pour l'instant, on augmente juste le compteur

    setPostInteractions(prev => {

      const current = prev[postId] || {};

      return {

        ...prev,

        [postId]: {

          ...current,

          shares: (current.shares || 0) + 1

        }

      };

    });

  };



  const handlePlayPauseVideo = (postId) => {

    const videoElement = document.getElementById(`tiktok-video-${postId}`);

    if (videoElement) {

      if (videoElement.paused) {

        videoElement.play();

        setPlayingVideos(prev => new Set([...prev, postId]));

      } else {

        videoElement.pause();

        setPlayingVideos(prev => {

          const newSet = new Set(prev);

          newSet.delete(postId);

          return newSet;

        });

      }

    }

  };



  const handleFollowUser = (username) => {

    console.log('Suivre l\'utilisateur:', username);

    // Logique pour suivre/désuivre un utilisateur

  };



  const handleViewProfile = (username) => {

    console.log('Voir le profil de:', username);

    // Navigation vers le profil utilisateur

  };



  const handleOpenMusic = (musicTitle) => {

    console.log('Ouvrir la musique:', musicTitle);

    // Ouvrir la page de la musique

  };



  const handleCopyLink = (postId) => {

    const link = `https://tiktok.com/@user/video/${postId}`;

    navigator.clipboard.writeText(link).then(() => {

      console.log('Lien copié:', link);

    });je

  };



  const handleReportPost = (postId) => {

    console.log('Signaler le post:', postId);

    // Ouvrir l'interface de signalement

  };



  const handleMoreOptions = (postId) => {

    console.log('Plus d\'options pour:', postId);

    // Ouvrir le menu d'options

  };



  // Fonctions pour l'édition des posts planifiés

  const handleEditScheduledPost = (post) => {

    setEditingScheduledFromListId(post.id);

    setCreationKind(post.contentType || (post.type === 'image' ? 'image' : post.type === 'video' ? 'video' : 'story'));

    setSelectedPublishType('story-ai');

    

    // Remplir les états

    setStoryCaption(post.description || '');

    setStoryHashtags(post.hashtags || '');

    if (post.type === 'image') {

      setStoryMediaPreview(post.contentPreview || '');

      setStoryCover(post.contentPreview || '');

    } else {

      setStoryCover(post.contentPreview || '');

    }

    setSelectedSound(post.sound || 'Ajouter un son');

    setStoryVisibility(post.visibility || post.privacy || 'public');

    setStoryCreatedAt(post.createdAt ? new Date(post.createdAt) : new Date());

    setSelectedScheduleAt(post.scheduledAt ? new Date(post.scheduledAt) : null);



    setShowScheduledMoreOptions(null);

    setShowCreateSection(true);

  };



  const handleSaveScheduledChanges = (postId) => {

    // Mettre à jour le post planifié

    const updatedScheduledItems = scheduledItems.map(item => 

      item.id === postId 

        ? { ...item, ...editedScheduledData }

        : item

    );

    setScheduledItems(updatedScheduledItems);

    

    // Réinitialiser les états d'édition

    setEditingScheduled(null);

    setEditedScheduledData({});

    setShowEditOptions(null);

    setShowScheduledMoreOptions(null);

    

    // Afficher un message de confirmation

    setPublishStatus('Modifications sauvegardées avec succès !');

    setTimeout(() => setPublishStatus(''), 3000);

  };



  const handleCancelEditScheduled = () => {

    setEditingScheduled(null);

    setEditedScheduledData({});

    setShowEditOptions(null);

    setShowScheduledMoreOptions(null);

  };



  const handleDeleteScheduledPost = (postId) => {
    setShowScheduledMoreOptions(null);
    setPendingDeleteTarget({ id: postId, type: 'scheduled' });

  };



  const handleDeleteDraftPost = (postId) => {
    setShowDraftEditOptions(null);
    setPendingDeleteTarget({ id: postId, type: 'draft' });

  };

  const handleConfirmDeletePost = () => {
    if (!pendingDeleteTarget) return;

    const { id, type } = pendingDeleteTarget;

    if (type === 'scheduled') {
      setScheduledItems((prev) => prev.filter((item) => item.id !== id));

      if (editingScheduled === id || showEditOptions === id) {
        setEditingScheduled(null);
        setEditedScheduledData({});
        setShowEditOptions(null);
      }

      setPublishStatus('Contenu planifié supprimé');
    } else if (type === 'draft') {
      setDraftItems((prev) => prev.filter((item) => item.id !== id));
      setPublishStatus('Brouillon supprimé avec succès !');
    } else {
      setTiktokPosts((prev) => prev.filter((post) => post.id !== id));

      if (editingPublished === id) {
        setEditingPublished(null);
        setEditedPublishedData({});
      }

      setGalleryMode(false);
      setSelectedPost(null);
      setPublishStatus('Contenu publié supprimé');
    }

    setShowDraftEditOptions(null);
    setShowPublishedEditOptions(null);
    setShowScheduledMoreOptions(null);
    setPendingDeleteTarget(null);
  };



  const handlePublishDraftPost = (post) => {

    const publishedPayload = {

      ...post,

      id: `published-${Date.now()}`,

      status: 'published',

      createdAt: new Date()

    };

    setTiktokPosts((prev) => [publishedPayload, ...prev]);

    setDraftItems((prev) => prev.filter((item) => item.id !== post.id));

    setShowDraftEditOptions(null);

    setPublishStatus('Brouillon publié avec succès !');

  };



  const handleEditPublishedPost = (post) => {

    setShowPublishedEditOptions(null);

    setShowDraftEditOptions(null);

    setShowScheduledMoreOptions(null);

    // Fermer l'aperçu agrandi s'il est ouvert

    setGalleryMode(false);

    setSelectedPost(null);

    // Ouvrir la section de création avec les données du post à modifier

    setShowCreateSection(true);

    setEditingPublishedFromCreateId(post.id);

    setEditingDraftFromListId(null);

    resetStoryState();



    const kind = post.type === 'video' ? 'video' : post.type === 'image' ? 'image' : 'story';

    setCreationKind(kind);

    setSelectedPublishType('story-ai');

    setStoryMediaType(kind === 'video' ? 'video' : 'photo');



    const captionText = post.caption || post.description || '';

    // S'assurer que les hashtags sont bien une chaîne de caractères
    let tagText = '';
    if (post.hashtags) {
      if (typeof post.hashtags === 'string') {
        tagText = post.hashtags;
      } else if (Array.isArray(post.hashtags)) {
        tagText = post.hashtags.join(' ');
      }
    } else {
      // Valeur par défaut si le post n'a pas de hashtags
      tagText = post.type === 'video' ? '#tiktok #video #fyp' : post.type === 'image' ? '#tiktok #image #fyp' : '#tiktok #story #fyp';
    }



    setStoryPreview(captionText || post.title || '');

    setStoryCaption(captionText);

    setStoryHashtags(tagText);

    const prev = post.contentPreview || '';

    if (prev) {

      setStoryCover(prev);

      setStoryMediaPreview(prev);

    }

    setSelectedSound(post.sound || 'Ajouter un son');

    setStoryVisibility(post.visibility || post.privacy || 'public');

    setStoryCreatedAt(post.createdAt ? new Date(post.createdAt) : new Date());

  };



  const handleSaveDraftFromCreator = () => {

    if (!editingDraftFromListId) return;

    const desc = (storyCaption || '').trim() || storyPreview || '';

    const caps = (storyCaption || '').trim();

    const tags = (storyHashtags || '').trim();



    setDraftItems((prev) =>

      prev.map((d) =>

        d.id === editingDraftFromListId

          ? {

              ...d,

              description: desc,

              captions: caps,

              hashtags: tags

            }

          : d

      )

    );

    setPublishStatus('Brouillon mis à jour');

    setEditingDraftFromListId(null);

    setShowCreateSection(false);

    setSelectedPublishType(null);

    resetStoryState();

  };



  const handleSavePublishedChanges = (postId) => {

    // Mettre à jour le post publié dans tiktokPosts

    const postIndex = tiktokPosts.findIndex(p => p.id === postId);

    if (postIndex !== -1) {

      tiktokPosts[postIndex] = { ...tiktokPosts[postIndex], ...editedPublishedData };

    }

    

    // Réinitialiser les états d'édition

    setEditingPublished(null);

    setEditedPublishedData({});

    setShowPublishedEditOptions(null);

    

    // Afficher un message de confirmation

    setPublishStatus('Modifications sauvegardées avec succès !');

    setTimeout(() => setPublishStatus(''), 3000);

  };



  const handleCancelEditPublished = () => {

    setEditingPublished(null);

    setEditedPublishedData({});

    setShowPublishedEditOptions(null);

  };



  const handleDeletePublishedPost = (postId) => {
    setShowPublishedEditOptions(null);
    setPendingDeleteTarget({ id: postId, type: 'published' });

  };



  const handleBoostContent = (postId) => {

    // Activer le boost pour le contenu

    const postIndex = tiktokPosts.findIndex(p => p.id === postId);

    if (postIndex !== -1) {

      tiktokPosts[postIndex].boostEnabled = !tiktokPosts[postIndex].boostEnabled;

      setPublishStatus(tiktokPosts[postIndex].boostEnabled ? 'Contenu boosté !' : 'Boost désactivé');

      setTimeout(() => setPublishStatus(''), 3000);

    }

  };



  const handleEditCover = (postId) => {

    // Ouvrir un sélecteur de fichier pour changer la couverture

    const input = document.createElement('input');

    input.type = 'file';

    input.accept = 'image/*,video/*';

    input.onchange = (e) => {

      const file = e.target.files?.[0];

      if (file) {

        const url = URL.createObjectURL(file);

        setEditedPublishedData(prev => ({ ...prev, contentPreview: url }));

      }

    };

    input.click();

  };



  const handleReserveFromCreation = () => {

    // Si pas de média, ouvrir directement le sélecteur de fichiers

    if (manualMediaFiles.length === 0) {

      const input = document.createElement('input');

      input.type = 'file';

      input.accept = 'image/*,video/*';

      input.multiple = true;

      input.onchange = (e) => {

        const files = Array.from(e.target.files);

        if (files.length > 0) {

          // Ajouter les fichiers sélectionnés aux brouillons

          files.forEach((file) => {

            const mediaType = file.type?.startsWith('video/') ? 'video' : 'image';

            let contentType = 'photo';

            

            if (selectedPublishType?.includes('story')) {

              contentType = 'story';

            } else if (selectedPublishType === 'video' || mediaType === 'video') {

              contentType = 'video';

            } else {

              contentType = 'photo';

            }



            const newDraft = {

              id: `draft-${Date.now()}-${Math.random()}`,

              type: mediaType,

              contentType: contentType,

              title: file.name || 'Contenu sauvegardé',

              contentPreview: URL.createObjectURL(file),

              createdAt: new Date(),

              description: `${contentType === 'story' ? 'Story' : contentType === 'video' ? 'Vidéo' : 'Photo'} sauvegardé(e) dans les brouillons`,

              username: '@vous',

              sound: selectedSound || 'Son original',

              captions: '',

              hashtags: '#trending #fyp',

              privacy: 'public',

              allowComments: true,

              allowDuet: contentType !== 'photo',

              allowStitch: contentType !== 'photo'

            };



            // Ajouter aux brouillons

            setDraftItems(prev => [newDraft, ...prev]);

          });



          setPublishStatus(`✅ ${files.length} fichier(s) sauvegardé(s) dans les brouillons`);

          

          // Fermer l'interface après un court délai

          setTimeout(() => {

            setShowCreateSection(false);

            setSelectedPublishType(null);

            resetStoryState();

          }, 1000);

        }

      };

      input.click();

      return;

    }



    // S'il y a déjà des médias, les sauvegarder directement

    const summary = storyPreview || manualMediaFiles[0]?.name || 'Contenu sauvegardé';

    const mediaType = manualMediaFiles[0]?.type?.startsWith('video/') ? 'video' : 'image';

    

    let contentType = 'photo';

    if (selectedPublishType?.includes('story')) {

      contentType = 'story';

    } else if (selectedPublishType === 'video' || mediaType === 'video') {

      contentType = 'video';

    } else {

      contentType = 'photo';

    }



    // Sauvegarder tous les fichiers médias

    manualMediaFiles.forEach((file, index) => {

      const newDraft = {

        id: `draft-${Date.now()}-${index}`,

        type: file.type?.startsWith('video/') ? 'video' : 'image',

        contentType: contentType,

        title: file.name || `Contenu ${index + 1}`,

        contentPreview: URL.createObjectURL(file),

        createdAt: new Date(),

        description: storyPreview || `${contentType === 'story' ? 'Story' : contentType === 'video' ? 'Vidéo' : 'Photo'} sauvegardé(e) dans les brouillons`,

        username: '@vous',

        sound: selectedSound || 'Son original',

        captions: storyPreview || '',

        hashtags: '#trending #fyp',

        privacy: 'public',

        allowComments: true,

        allowDuet: contentType !== 'photo',

        allowStitch: contentType !== 'photo'

      };



      setDraftItems(prev => [newDraft, ...prev]);

    });



    setPublishStatus(`✅ ${manualMediaFiles.length} fichier(s) sauvegardé(s) dans les brouillons`);

    

    // Fermer l'écran de création après sauvegarde

    setTimeout(() => {

      setShowCreateSection(false);

      setSelectedPublishType(null);

      resetStoryState();

    }, 1000);

  };



  const handleEditDraft = (draft) => {

    setShowDraftEditOptions(null);

    setEditingDraftFromListId(draft.id);

    setEditingPublishedFromCreateId(null);

    setShowCreateSection(true);

    resetStoryState();



    const isStory = draft.contentType === 'story' || draft.type === 'story';

    const isVideo =

      !isStory &&

      (draft.type === 'video' || draft.contentType === 'video' || String(draft.contentPreview || '').includes('.mp4'));

    const kind = isStory ? 'story' : isVideo ? 'video' : 'image';



    setCreationKind(kind);

    setSelectedPublishType('story-ai');

    setStoryMediaType(kind === 'video' ? 'video' : 'photo');



    const captionText = draft.captions || draft.description || draft.title || '';

    setStoryCaption(captionText);

    setStoryHashtags(typeof draft.hashtags === 'string' ? draft.hashtags : '');

    setStoryPreview(captionText);

    const prev = draft.contentPreview || '';

    if (prev) {

      setStoryCover(prev);

      setStoryMediaPreview(prev);

    }

    setSelectedSound(draft.sound || 'Ajouter un son');

    setStoryCreatedAt(draft.createdAt ? new Date(draft.createdAt) : new Date());

    setStoryVisibility(draft.privacy || draft.visibility || 'public');

  };



  const handleSaveDraftEdit = () => { 

    if (!editingDraft) return; 

    

    setDraftItems(prev => prev.map(draft => 

      draft.id === editingDraft.id 

        ? {  

            ...draft, 

            ...editedDraftData,

            isEditing: false 

          } 

        : draft 

    ));

    

    // Fermer l'interface de modification

    setEditingDraft(null);

    setEditedDraftData({});

    setShowCreateSection(false);

  };



  const handleCancelDraftEdit = () => {

    setEditingDraft(null);

    setEditedDraftData({});

    setShowCreateSection(false);

  };



  const handleRemoveDraftVideo = () => {

    if (!editingDraft) return;

    

    const updatedDraft = {

      ...editingDraft,

      contentPreview: '',

      type: 'image'

    };

    

    setEditedDraftData(updatedDraft);

    setDraftItems(prev => prev.map(draft => 

      draft.id === editingDraft.id ? updatedDraft : draft

    ));

  };



  const handleReplaceDraftVideo = (event) => {

    if (!editingDraft) return;

    

    const file = event.target.files?.[0];

    if (file) {

      const updatedDraft = {

        ...editingDraft,

        contentPreview: URL.createObjectURL(file),

        type: file.type?.startsWith('video/') ? 'video' : 'image'

      };

      

      setEditedDraftData(updatedDraft);

      setDraftItems(prev => prev.map(draft => 

        draft.id === editingDraft.id ? updatedDraft : draft

      ));

    }

    event.target.value = '';

  };



  const handlePlayPauseDraft = (draftId) => {

    // Toggle play/pause pour la vidéo du brouillon

    const videoElement = document.getElementById(`draft-video-${draftId}`);

    if (videoElement) {

      if (videoElement.paused) {

        videoElement.play();

      } else {

        videoElement.pause();

      }

    }

  };



  const handleToggleEditMenu = (postId) => {

    setShowEditMenu(showEditMenu === postId ? null : postId);

  };



  const handleEditCaption = (post) => {

    const newCaption = prompt('Modifier la légende:', post.description || '');

    if (newCaption !== null) {

      setScheduledItems(prev => prev.map(item => 

        item.id === post.id ? { ...item, description: newCaption } : item

      ));

      setPublishStatus('Légende mise à jour avec succès');

      setShowEditMenu(null);

    }

  };



  const handleEditSound = (post) => {

    const newSound = prompt('Modifier le son:', post.sound || '');

    if (newSound !== null) {

      setScheduledItems(prev => prev.map(item => 

        item.id === post.id ? { ...item, sound: newSound } : item

      ));

      setPublishStatus('Son mis à jour avec succès');

      setShowEditMenu(null);

    }

  };



  const handleEditScheduleDate = (post) => {

    const newDateStr = prompt('Modifier la date de planification:', 

      post.scheduledAt ? post.scheduledAt.toLocaleString() : '');

    if (newDateStr) {

      const [datePart, timePart] = newDateStr.split(' ');

      const [day, month, year] = datePart.split('/');

      const [hour, minute] = timePart.split(':');

      const newDate = new Date(year, month - 1, day, hour, minute);

      

      if (!isNaN(newDate.getTime())) {

        setScheduledItems(prev => prev.map(item => 

          item.id === post.id ? { ...item, scheduledAt: newDate } : item

        ));

        setPublishStatus('Date de planification mise à jour avec succès');

        setShowEditMenu(null);

      }

    }

  };



  // Filtrer les brouillons par type (stories/photos/videos)

  const filteredDrafts = useMemo(

    () => {

      // Si le contentType n'existe pas, utiliser le type comme fallback

      const filtered = draftItems.filter(draft => {

        const contentType = draft.contentType || draft.type;

        const fileType = draft.type; // type direct: 'image', 'video'

        

        console.log('DEBUG draft:', draft.title, 'contentType:', contentType, 'type:', fileType);

        

        if (draftSubTab === 'stories') {

          return contentType === 'story' || (contentType === 'video' && draft.title?.toLowerCase().includes('story'));

        } else if (draftSubTab === 'photos') {

          // Afficher les photos et les images

          return contentType === 'photo' || contentType === 'image' || fileType === 'image';

        } else if (draftSubTab === 'videos') {

          // Afficher les vidéos (sauf les stories)

          return contentType === 'video' || fileType === 'video';

        }

        return false;

      });

      

      console.log('=== DEBUG: filteredDrafts ===');

      console.log('draftSubTab:', draftSubTab);

      console.log('draftItems total:', draftItems.length);

      console.log('filteredDrafts:', filtered.length);

      console.log('draftItems:', draftItems);

      return filtered;

    },

    [draftItems, draftSubTab]

  );



  const weekDays = Array.from({ length: 7 }, (_, index) =>

    addDays(scheduleWeekStart, index)

  );



  const eventsBySlot = scheduledItems.reduce((acc, item) => {

    const key = `${item.scheduledAt.toDateString()}-${item.scheduledAt.getHours()}`;

    acc[key] = acc[key] || [];

    acc[key].push(item);

    return acc;

  }, {});



  const schedulePanel = (

    <div className="story-schedule-panel">

      <div className="story-schedule-label">PLANIFIER POUR PLUS TARD</div>



      <div className="manual-schedule-card">

        <div className="manual-schedule-row">

          <div>

            <span className="manual-schedule-row-label">Date de création</span>

            <strong className="manual-schedule-row-value">

              {selectedScheduleAt

                ? selectedScheduleAt.toLocaleString()

                : new Date().toLocaleString()}

            </strong>

          </div>

          <button

            type="button"

            className="manual-schedule-icon"

            onClick={handleOpenSchedulePicker}

          >

            <Calendar size={18} />

          </button>

        </div>



        <div className="manual-plan-actions">

          <button

            type="button"

            className="manual-plan-button"

            onClick={handleOpenSchedulePicker}

          >

            <Calendar size={18} />

            Planifier

          </button>

          <button

            type="button"

            className="manual-reserve-button"

            onClick={handleStorySaveDraft}

          >

            Garder en réserve

          </button>

        </div>

      </div>



      {showSchedulePicker && selectedPublishType !== 'image-ai' && (

        <div className="schedule-calendar-panel">

          <div className="schedule-calendar-header">

            <button

              type="button"

              className="schedule-calendar-nav"

              onClick={() => handleChangeWeek(-1)}

            >

              <ChevronLeft size={18} />

            </button>



            <div className="schedule-calendar-range">

              {formatWeekRange(scheduleWeekStart)}

            </div>



            <button

              type="button"

              className="schedule-calendar-nav"

              onClick={() => handleChangeWeek(1)}

            >

              <ChevronRight size={18} />

            </button>



            <button

              type="button"

              className="schedule-calendar-today"

              onClick={() => setScheduleWeekStart(getStartOfWeek(new Date()))}

            >

              Aujourd'hui

            </button>

          </div>



          <div className="schedule-calendar-grid">

            <div className="schedule-calendar-grid-head">

              <div className="schedule-calendar-cell time-cell">GMT+1</div>

              {weekDays.map((day) => (

                <div key={day.toISOString()} className="schedule-calendar-cell header-cell">

                  <div>{WEEK_DAYS[day.getDay()]}</div>

                  <strong>{day.getDate()}</strong>

                </div>

              ))}

            </div>



            <div className="schedule-calendar-grid-body">

              {HOURS.map((hour) => (

                <div key={hour} className="schedule-calendar-row">

                  <div className="schedule-calendar-cell time-cell">{hour}</div>

                  {weekDays.map((day) => {

                    const hourNumber = parseInt(hour, 10);

                    const cellDate = new Date(day);

                    cellDate.setHours(hourNumber, 0, 0, 0);

                    const key = `${cellDate.toDateString()}-${hourNumber}`;

                    const events = eventsBySlot[key] || [];

                    const isSelected =

                      selectedScheduleAt &&

                      selectedScheduleAt.getTime() === cellDate.getTime();

                    return (

                      <button

                        key={`${day.toISOString()}-${hour}`}

                        type="button"

                        className={`schedule-calendar-cell slot-cell ${

                          isSelected ? 'selected' : ''

                        }`}

                        onClick={() => handleSelectScheduleCell(day, hourNumber.toString())}

                      >

                        {events.length > 0 && (

                          <div className="schedule-event-pill">

                            <span className={`pill-type ${events[0].type}`}>

                              {events[0].type === 'video'

                                ? 'Vidéo'

                                : events[0].type === 'image'

                                ? 'Photo'

                                : 'Story'}

                            </span>

                            {events.length > 1 && (

                              <span className="pill-count">+{events.length - 1}</span>

                            )}

                          </div>

                        )}

                      </button>

                    );

                  })}

                </div>

              ))}

            </div>

          </div>



          <div className="schedule-selected-info">

            <div>

              <span>Choix sélectionné</span>

              <strong>

                {selectedScheduleAt

                  ? selectedScheduleAt.toLocaleString()

                  : 'Aucune date choisie'}

              </strong>

            </div>

            <button

              type="button"

              className="story-schedule-button primary"

              onClick={handleSchedulePublish}

            >

              Planifier

            </button>

          </div>

        </div>

      )}



      {scheduleMessage && (

        <div className="story-schedule-message">{scheduleMessage}</div>

      )}

    </div>

  );



  // États pour le calendrier stratégique

  const [strategyWeekStart, setStrategyWeekStart] = useState(getStartOfWeek(new Date()));

  const STRATEGY_HOURS = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}h`);

  const strategyWeekDays = Array.from({ length: 7 }, (_, index) =>

    addDays(strategyWeekStart, index)

  );



  // États pour le calendrier mensuel

  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  

  // Fonctions pour le calendrier mensuel

  const getDaysInMonth = (date) => {

    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  };

  

  const getFirstDayOfMonth = (date) => {

    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  };

  

  const getMonthName = (date) => {

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return months[date.getMonth()];

  };

  

  const getYearName = (date) => {

    return date.getFullYear();

  };

  

  const changeMonth = (direction) => {

    setCurrentMonth(prev => {

      const newDate = new Date(prev);

      if (direction === 'prev') {

        newDate.setMonth(prev.getMonth() - 1);

      } else {

        newDate.setMonth(prev.getMonth() + 1);

      }

      return newDate;

    });

  };



  // Fonctions utilitaires pour le calendrier stratégique

  const isDateToday = (date) => {

    const today = new Date();

    return date.toDateString() === today.toDateString();

  };



  const getThisWeekEvents = () => {

    const weekStart = getStartOfWeek(new Date());

    const weekEnd = addDays(weekStart, 7);

    return scheduledItems.filter(item => 

      item.scheduledAt >= weekStart && item.scheduledAt < weekEnd

    );

  };



  const getTodayEvents = () => {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    return scheduledItems.filter(item => 

      item.scheduledAt >= today && item.scheduledAt < tomorrow

    );

  };



  const handleEventClick = (event) => {

    console.log('Event clicked:', event);

    // Ouvrir les détails de l'événement

  };



  // Fonction pour générer les jours du calendrier

  const generateCalendarDays = () => {

    const days = [];

    const start = new Date(scheduleWeekStart);

    const day = start.getDay();

    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi soit le début

    start.setDate(diff);

    

    for (let i = 0; i < 7; i++) {

      const date = new Date(start);

      date.setDate(start.getDate() + i);

      days.push(date);

    }

    return days;

  };



  // Grouper les événements par créneau horaire pour le calendrier stratégique

  const strategyEventsBySlot = scheduledItems.reduce((acc, item) => {

    const key = `${item.scheduledAt.toDateString()}-${item.scheduledAt.getHours()}`;

    acc[key] = acc[key] || [];

    acc[key].push(item);

    return acc;

  }, {});



  // Composant calendrier stratégique en plein écran - Thème clair/original

  const strategyCalendarPanel = (

    <div style={{

      position: 'fixed',

      top: '0',

      left: '0',

      right: '0',

      bottom: '0',

      backgroundColor: '#ffffff',

      zIndex: 10000,

      display: 'flex',

      flexDirection: 'column'

    }}>

      {/* Header clair */}

      <div style={{

        backgroundColor: '#ffffff',

        borderBottom: '1px solid #e5e7eb',

        padding: '16px 24px',

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'center'

      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <div style={{

              width: '32px',

              height: '32px',

              backgroundColor: '#6366f1',

              borderRadius: '8px',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center'

            }}>

              <CalendarDays size={18} color="white" />

            </div>

            <h1 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>Calendar</h1>

          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <button 

              onClick={() => setShowMonthlyCalendar(true)}

              style={{

                padding: '8px 16px',

                border: '1px solid #d1d5db',

                borderRadius: '8px',

                backgroundColor: '#f3f4f6',

                cursor: 'pointer',

                fontSize: '14px',

                fontWeight: '500',

                color: '#6366f1'

              }}

            >

              Strategy

            </button>

            <button 

              style={{

                padding: '8px 16px',

                border: '1px solid #d1d5db',

                borderRadius: '8px',

                backgroundColor: '#ffffff',

                cursor: 'pointer',

                fontSize: '14px',

                fontWeight: '500',

                color: '#374151'

              }}

            >

              + Create Post

            </button>

            <button

              onClick={() => setShowStrategyCalendar(false)}

              style={{

                padding: '8px',

                border: 'none',

                backgroundColor: '#ffffff',

                cursor: 'pointer',

                borderRadius: '6px',

                fontSize: '16px',

                color: '#6b7280'

              }}

            >

              <X size={20} />

            </button>

          </div>

        </div>

      </div>



      {/* Navigation semaine claire */}

      <div style={{

        backgroundColor: '#ffffff',

        padding: '12px 24px',

        borderBottom: '1px solid #e5e7eb',

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'center'

      }}>

        <button 

          onClick={() => setStrategyWeekStart(addDays(strategyWeekStart, -7))}

          style={{

            padding: '6px 8px',

            border: '1px solid #d1d5db',

            borderRadius: '6px',

            backgroundColor: '#ffffff',

            cursor: 'pointer',

            color: '#6b7280'

          }}

        >

          <ChevronLeft size={16} />

        </button>

        <div style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>

          {formatWeekRange(strategyWeekStart)}

        </div>

        <button 

          onClick={() => setStrategyWeekStart(addDays(strategyWeekStart, 7))}

          style={{

            padding: '6px 8px',

            border: '1px solid #d1d5db',

            borderRadius: '6px',

            backgroundColor: '#ffffff',

            cursor: 'pointer',

            color: '#6b7280'

          }}

        >

          <ChevronRight size={16} />

        </button>

        <button 

          onClick={() => setStrategyWeekStart(getStartOfWeek(new Date()))}

          style={{

            padding: '6px 12px',

            border: '1px solid #d1d5db',

            borderRadius: '6px',

            backgroundColor: '#ffffff',

            cursor: 'pointer',

            fontSize: '13px',

            fontWeight: '500',

            color: '#374151'

          }}

        >

          Today

        </button>

      </div>



      {/* Grille calendrier claire */}

      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f9fafb', padding: '16px' }}>

        <div style={{

          display: 'grid',

          gridTemplateColumns: '60px repeat(7, 1fr)',

          gap: '1px',

          backgroundColor: '#e5e7eb',

          border: '1px solid #e5e7eb',

          borderRadius: '8px',

          overflow: 'hidden',

          minHeight: '500px'

        }}>

          {/* En-têtes clairs */}

          <div style={{

            backgroundColor: '#f9fafb',

            padding: '12px 8px',

            textAlign: 'center',

            fontWeight: '500',

            fontSize: '11px',

            color: '#6b7280',

            borderRight: '1px solid #e5e7eb'

          }}>

            GMT+1

          </div>

          {strategyWeekDays.map((day) => (

            <div key={day.toISOString()} style={{

              backgroundColor: '#f9fafb',

              padding: '12px 8px',

              textAlign: 'center',

              borderRight: '1px solid #e5e7eb'

            }}>

              <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>

                {WEEK_DAYS[day.getDay()]}

              </div>

              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginTop: '2px' }}>

                {day.getDate()}

              </div>

            </div>

          ))}



          {/* Lignes horaires claires */}

          {STRATEGY_HOURS.map((hour) => (

            <React.Fragment key={hour}>

              <div style={{

                backgroundColor: '#f9fafb',

                padding: '8px 4px',

                textAlign: 'center',

                fontSize: '10px',

                color: '#6b7280',

                borderRight: '1px solid #e5e7eb',

                borderBottom: '1px solid #e5e7eb'

              }}>

                {hour}

              </div>

              {strategyWeekDays.map((day) => {

                const hourNumber = parseInt(hour.replace('h', ''), 10);

                const cellDate = new Date(day);

                cellDate.setHours(hourNumber, 0, 0, 0);

                const key = `${cellDate.toDateString()}-${hourNumber}`;

                const events = strategyEventsBySlot[key] || [];

                const isToday = isDateToday(cellDate);

                const isPast = cellDate < new Date();



                return (

                  <div 

                    key={`${day.toISOString()}-${hour}`}

                    style={{

                      backgroundColor: isToday ? '#eff6ff' : isPast ? '#f9fafb' : '#ffffff',

                      padding: '2px',

                      borderRight: '1px solid #e5e7eb',

                      borderBottom: '1px solid #e5e7eb',

                      minHeight: '40px',

                      position: 'relative'

                    }}

                  >

                    {events.length > 0 && events.map((event, eventIndex) => (

                      <div 

                        key={`${event.id}-${eventIndex}`}

                        style={{

                          backgroundColor: event.type === 'story' ? '#ec4899' : '#3b82f6',

                          color: 'white',

                          padding: '2px 6px',

                          borderRadius: '4px',

                          fontSize: '9px',

                          fontWeight: '500',

                          cursor: 'pointer',

                          marginBottom: '2px',

                          textAlign: 'center',

                          textTransform: 'uppercase',

                          letterSpacing: '0.3px'

                        }}

                        onClick={() => handleEventClick(event)}

                      >

                        {event.type === 'story' ? 'Story' : 'Post'}

                      </div>

                    ))}

                  </div>

                );

              })}

            </React.Fragment>

          ))}

        </div>

      </div>



      {/* Footer clair */}

      <div style={{

        backgroundColor: '#ffffff',

        borderTop: '1px solid #e5e7eb',

        padding: '16px 24px',

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'center'

      }}>

        <div style={{ display: 'flex', gap: '32px' }}>

          <div>

            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Total scheduled</div>

            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{scheduledItems.length}</div>

          </div>

          <div>

            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>This week</div>

            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{getThisWeekEvents().length}</div>

          </div>

        </div>

        <button 

          onClick={() => setShowCreateSection(true)}

          style={{

            padding: '8px 16px',

            backgroundColor: '#6366f1',

            color: 'white',

            border: 'none',

            borderRadius: '8px',

            cursor: 'pointer',

            fontSize: '14px',

            fontWeight: '500'

          }}

        >

          + Create Post

        </button>

      </div>

    </div>

  );



  // Affichage du calendrier mensuel s'il est ouvert

  if (showMonthlyCalendar) {

    return monthlyCalendarPanel;

  }



  // Affichage du calendrier stratégique s'il est ouvert

  if (showStrategyCalendar) {

    return strategyCalendarPanel;

  }



  // Le reste du composant dashboard

  return (

    <>

      {/* Section création de contenu */}

      {showCreateSection && (

        <section

          className={`dashboard-card dashboard-publish-card ${

            selectedPublishType === 'story-ai' || selectedPublishType === 'story-manual' || 

            selectedPublishType === 'image-ai' || selectedPublishType === 'image-manual' ||

            selectedPublishType === 'video-ai' || selectedPublishType === 'video-manual'

              ? 'story-full-width-layout'

              : ''

          }`}

        >

          {selectedPublishType !== null && (

            <div className="publish-section-header">

              <h3>Création de contenu</h3>

            </div>

          )}

          

          {selectedPublishType === null && (

            <div className="create-content-modal">

              <div className="create-modal-header">

                <div className="create-modal-logo">

                  <div className="logo-circle">

                    <span className="logo-text">U</span>

                  </div>

                  <span className="create-modal-title">
                    <span className="create-modal-title-line1">Que souhaitez-vous</span>
                    {' '}
                    <span className="create-modal-title-line2">publier ?</span>
                  </span>

                </div>

                <button

                  type="button"

                  className="create-modal-close"

                  onClick={() => {

                    setShowCreateSection(false);

                    setSelectedPublishType(null);

                    setEditingDraftFromListId(null);

                    setEditingPublishedFromCreateId(null);

                    resetStoryState();

                  }}

                >

                  <X size={20} />

                </button>

              </div>

              

              <div className="create-modal-buttons tiktok-create-type-grid">

                <button
                  type="button"
                  className="create-modal-button"
                  onClick={() => {
                    setCreationKind('video');
                    setSelectedPublishType('story-ai');
                    resetStoryState();
                    setStoryMediaType('video');
                  }}
                >
                  <div className="modal-button-icon">
                    <Video size={26} strokeWidth={1.5} />
                  </div>
                  <span className="modal-button-text">Vidéo</span>
                </button>

                <button
                  type="button"
                  className="create-modal-button"
                  onClick={() => {
                    setCreationKind('image');
                    setSelectedPublishType('story-ai');
                    resetStoryState();
                    setStoryMediaType('photo');
                  }}
                >
                  <div className="modal-button-icon">
                    <Image size={26} strokeWidth={1.5} />
                  </div>
                  <span className="modal-button-text">Image</span>
                </button>

                <button type="button" className="create-modal-button" onClick={handleStoryClick}>
                  <div className="modal-button-icon">
                    <Camera size={26} strokeWidth={1.5} />
                  </div>
                  <span className="modal-button-text">Story</span>
                </button>

              </div>

            </div>

          )}



          {/* Section choix entre création manuelle et IA pour Story */}

          {selectedPublishType === 'story' && (

            <div className="publish-story-panel">

              <div className="publish-story-actions">

                <button

                  type="button"

                  className="publish-story-action manual"

                  onClick={handleManualClick}

                >

                  <Upload size={20} />

                  <span>Créer manuellement</span>

                </button>

                

                <button

                  type="button"

                  className="publish-story-action ai"

                  onClick={handleAiClick}

                >

                  <Sparkles size={20} />

                  <span>Générer avec l'IA</span>

                </button>

              </div>

            </div>

          )}





          {/* Section création manuelle de Image */}

          {selectedPublishType === 'image-manual' && (

            <div className="story-creation-panel">

              <button 

                className="story-creation-close"

                onClick={() => {

                  setSelectedPublishType(null);

                  resetStoryState();

                }}

              >

                <X size={20} />

              </button>



              {/* Grille de médias - 4 emplacements */}

              <div className="story-media-grid">

                {[0, 1, 2].map((index) => (

                  <div key={index} className="story-media-slot">

                    {manualMediaFiles[index] ? (

                      <div className="story-media-preview">

                        {manualMediaFiles[index].type?.startsWith('video/') ? (

                          <video

                            className="story-media-video"

                            autoPlay

                            muted

                            loop

                            playsInline

                          >

                            <source src={URL.createObjectURL(manualMediaFiles[index])} />

                          </video>

                        ) : (

                          <img

                            className="story-media-image"

                            src={URL.createObjectURL(manualMediaFiles[index])}

                            alt={`Media ${index + 1}`}

                          />

                        )}

                        <button 

                          className="story-media-remove"

                          onClick={() => handleRemoveManualMediaFile(index)}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div className="story-media-empty" onClick={handleOpenManualMediaPicker}>

                        <div className="story-media-icon">

                          <Image size={32} />

                        </div>

                        <span className="story-media-text">Ajouter un média</span>

                      </div>

                    )}

                  </div>

                ))}

                

                {/* 4ème emplacement avec bordure pointillée */}

                <div className="story-media-slot">

                  {manualMediaFiles[3] ? (

                    <div className="story-media-preview">

                      {manualMediaFiles[3].type?.startsWith('video/') ? (

                        <video

                          className="story-media-video"

                          autoPlay

                          muted

                          loop

                          playsInline

                        >

                          <source src={URL.createObjectURL(manualMediaFiles[3])} />

                        </video>

                      ) : (

                        <img

                          className="story-media-image"

                          src={URL.createObjectURL(manualMediaFiles[3])}

                          alt={`Media 4`}

                        />

                      )}

                      <button 

                        className="story-media-remove"

                        onClick={() => handleRemoveManualMediaFile(3)}

                      >

                        <X size={14} />

                      </button>

                    </div>

                  ) : (

                    <div className="story-media-add" onClick={handleOpenManualMediaPicker}>

                      <Plus size={32} />

                      <span>Ajouter</span>

                    </div>

                  )}

                </div>

              </div>



              <input

                ref={manualMediaInputRef}

                type="file"

                accept="image/*,video/*"

                multiple

                onChange={handleManualMediaFileChange}

                style={{ display: 'none' }}

              />



              <div className="tiktok-publish-actions" style={{ marginTop: 18 }}>

                <button type="button" className="tiktok-publish-primary" onClick={handleStoryPublish} disabled={manualMediaFiles.length === 0}>

                  <Send size={20} />

                  <span>Publier maintenant</span>

                </button>

                <div className="tiktok-schedule-block">

                  <div className="tiktok-schedule-title">

                    <Calendar size={18} />

                    <span>PLANIFIER POUR PLUS TARD</span>

                  </div>

                  <div className="tiktok-schedule-input">

                    <input

                      type="text"

                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}

                      readOnly

                      onClick={handleOpenSchedulePicker}

                    />

                    <button type="button" onClick={handleOpenSchedulePicker} aria-label="Ouvrir le calendrier">

                      <Calendar size={18} />

                    </button>

                  </div>

                  <div className="tiktok-publish-secondary-row">

                    <button

                      type="button"

                      className="tiktok-publish-secondary"

                      onClick={handleOpenSchedulePicker}

                      disabled={manualMediaFiles.length === 0}

                    >

                      <Calendar size={18} />

                      <span>Planifier</span>

                    </button>

                    <button type="button" className="tiktok-publish-tertiary" onClick={handleStorySaveDraft} disabled={manualMediaFiles.length === 0}>

                      <span>Garder en réserve</span>

                    </button>

                  </div>

                </div>

              </div>



              {/* Champs pour la description et hashtags */}

              {manualMediaFiles.length > 0 && (

                <div className="manual-content-fields" style={{ 

                  marginTop: '20px',

                  display: 'flex',

                  flexDirection: 'column',

                  gap: '16px'

                }}>

                  {/* Champ pour la description */}

                  <div className="manual-field-group">

                    <label className="manual-field-label" style={{

                      display: 'block',

                      fontSize: '14px',

                      fontWeight: '500',

                      color: '#374151',

                      marginBottom: '8px'

                    }}>

                      Description

                    </label>

                    <textarea

                      value={photoCaption}

                      onChange={(e) => setPhotoCaption(e.target.value)}

                      placeholder="Écris une description pour ton image..."

                      maxLength={500}

                      style={{

                        width: '100%',

                        minHeight: '80px',

                        padding: '12px',

                        border: '1px solid #e5e7eb',

                        borderRadius: '8px',

                        fontSize: '14px',

                        fontFamily: 'Inter, system-ui, sans-serif',

                        resize: 'vertical',

                        outline: 'none',

                        transition: 'border-color 0.2s'

                      }}

                      onFocus={(e) => e.target.style.borderColor = '#6366f1'}

                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}

                    />

                    <div style={{

                      fontSize: '12px',

                      color: '#9ca3af',

                      marginTop: '4px',

                      textAlign: 'right'

                    }}>

                      {photoCaption.length}/500

                    </div>

                  </div>



                  {/* Champ pour les hashtags */}

                  <div className="manual-field-group">

                    <label className="manual-field-label" style={{

                      display: 'block',

                      fontSize: '14px',

                      fontWeight: '500',

                      color: '#374151',

                      marginBottom: '8px'

                    }}>

                      Hashtags

                    </label>

                    <input

                      type="text"

                      value={photoHashtags}

                      onChange={(e) => setPhotoHashtags(e.target.value)}

                      placeholder="#tiktok #photo #fyp #viral"

                      maxLength={200}

                      style={{

                        width: '100%',

                        padding: '12px',

                        border: '1px solid #e5e7eb',

                        borderRadius: '8px',

                        fontSize: '14px',

                        fontFamily: 'Inter, system-ui, sans-serif',

                        outline: 'none',

                        transition: 'border-color 0.2s'

                      }}

                      onFocus={(e) => e.target.style.borderColor = '#6366f1'}

                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}

                    />

                    <div style={{

                      fontSize: '12px',

                      color: '#9ca3af',

                      marginTop: '4px',

                      textAlign: 'right'

                    }}>

                      {photoHashtags.length}/200

                    </div>

                  </div>



                  {/* Champ pour le son */}

                  <div className="manual-field-group">

                    <label className="manual-field-label" style={{

                      display: 'block',

                      fontSize: '14px',

                      fontWeight: '500',

                      color: '#374151',

                      marginBottom: '8px'

                    }}>

                      Son musical

                    </label>

                    

                    {/* Affichage du son sélectionné ou bouton pour ajouter */}

                    {selectedPhotoSound ? (

                      <div style={{

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'space-between',

                        padding: '12px',

                        border: '1px solid #e5e7eb',

                        borderRadius: '8px',

                        backgroundColor: '#f8fafc'

                      }}>

                        <div style={{

                          display: 'flex',

                          alignItems: 'center',

                          gap: '8px'

                        }}>

                          <Music size={16} color="#6366f1" />

                          <div>

                            <div style={{

                              fontSize: '14px',

                              fontWeight: '500',

                              color: '#111827'

                            }}>

                              {selectedPhotoSound.title}

                            </div>

                            <div style={{

                              fontSize: '12px',

                              color: '#6b7280'

                            }}>

                              {selectedPhotoSound.artist} • {selectedPhotoSound.duration}

                            </div>

                          </div>

                        </div>

                        <button

                          type="button"

                          onClick={handleRemovePhotoSound}

                          style={{

                            padding: '4px 8px',

                            border: '1px solid #ef4444',

                            borderRadius: '4px',

                            backgroundColor: '#ffffff',

                            color: '#ef4444',

                            fontSize: '12px',

                            cursor: 'pointer'

                          }}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div>

                        <input

                          type="text"

                          value={photoSoundQuery}

                          onChange={(e) => handlePhotoSoundSearch(e.target.value)}

                          placeholder="Rechercher un son musical..."

                          style={{

                            width: '100%',

                            padding: '12px',

                            border: '1px solid #e5e7eb',

                            borderRadius: '8px',

                            fontSize: '14px',

                            fontFamily: 'Inter, system-ui, sans-serif',

                            outline: 'none',

                            transition: 'border-color 0.2s'

                          }}

                          onFocus={(e) => e.target.style.borderColor = '#6366f1'}

                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}

                        />

                        

                        {/* Résultats de recherche */}

                        {photoSoundResults.length > 0 && (

                          <div style={{

                            position: 'absolute',

                            top: '100%',

                            left: '0',

                            right: '0',

                            backgroundColor: '#ffffff',

                            border: '1px solid #e5e7eb',

                            borderRadius: '8px',

                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',

                            zIndex: 50,

                            maxHeight: '200px',

                            overflowY: 'auto'

                          }}>

                            {photoSoundResults.map((sound) => (

                              <button

                                key={sound.id}

                                type="button"

                                onClick={() => handleSelectPhotoSound(sound)}

                                style={{

                                  width: '100%',

                                  padding: '12px',

                                  border: 'none',

                                  backgroundColor: 'transparent',

                                  textAlign: 'left',

                                  cursor: 'pointer',

                                  borderBottom: '1px solid #f3f4f6',

                                  transition: 'background-color 0.2s'

                                }}

                                onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}

                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}

                              >

                                <div style={{

                                  display: 'flex',

                                  alignItems: 'center',

                                  gap: '8px'

                                }}>

                                  <Music size={16} color="#6366f1" />

                                  <div>

                                    <div style={{

                                      fontSize: '14px',

                                      fontWeight: '500',

                                      color: '#111827'

                                    }}>

                                      {sound.title}

                                    </div>

                                    <div style={{

                                      fontSize: '12px',

                                      color: '#6b7280'

                                    }}>

                                      {sound.artist} • {sound.duration}

                                    </div>

                                  </div>

                                </div>

                              </button>

                            ))}

                          </div>

                        )}

                      </div>

                    )}

                  </div>



                  <button type="button" className="ai-action-btn tertiary" onClick={handleApplyPhotoMetadata}>

                    Ajouter

                  </button>

                </div>

              )}



              {/* Aperçu de story TikTok automatique */}

              {manualMediaFiles.length > 0 && (

                <div className="story-preview-section">

                  <div className="story-preview-header">

                    <h4>Aperçu de votre Image</h4>

                  </div>

                  <div className="story-tiktok-preview">

                    {/* Format téléphone TikTok */}

                    <div className="tiktok-phone-frame">

                      <div className="tiktok-story-container">

                        {/* Image/vidéo de la story */}

                        <div className="story-media-container">

                          <TiktokManualMediaCarousel

                            files={manualMediaFiles}

                            carouselRef={manualCarouselRef}

                            onSlideIndexChange={handleManualCarouselIndex}

                          />

                          

                          {/* Overlay TikTok authentique */}

                          <div className="story-overlay">

                            {/* Header TikTok */}

                            <div className="story-header">

                              <div className="story-user-info">

                                <div className="story-avatar">

                                  <span>V</span>

                                </div>

                                <div className="story-user-details">

                                  <div className="story-username">@votrenom</div>

                                  <div className="story-time">il y a 1s</div>

                                </div>

                              </div>

                              <div className="story-header-actions">

                                <button className="story-more-btn">

                                  <MoreVertical size={20} color="white" />

                                </button>

                              </div>

                            </div>



                            {/* Footer TikTok - LITTÉRALEMENT IDENTIQUE au screenshot */}

                            <div className="story-footer">

                              {/* Barre de progression uniquement */}

                              <div className="story-progress">

                                <div className="story-progress-bar"></div>

                              </div>

                              

                              {/* Layout TikTok exactement comme le screenshot */}

                              <div className="story-caption">

                                <div className="caption-text">

                                  <p>{photoCaption || photoPreview}</p>

                                </div>

                                <div className="hashtags-section">

                                  <div className="story-hashtags">

                                    {photoHashtags || '#tiktok #photo #fyp'}

                                  </div>

                                </div>

                                {selectedSound !== 'Ajouter un son' && (

                                  <div className="story-sound-info">

                                    <Music size={12} fill="white" />

                                    <span>{selectedSound}</span>

                                  </div>

                                )}

                              </div>

                            </div>

                          </div>

                          {manualMediaFiles.length > 1 && (

                            <TiktokManualCarouselChrome

                              count={manualMediaFiles.length}

                              activeIndex={currentPhotoIndex}

                              onPrev={handlePreviousPhoto}

                              onNext={handleNextPhoto}

                              onDotClick={handleManualCarouselDotClick}

                            />

                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}



          {/* Section planification pour Image manuelle */}

          {showSchedulePicker && selectedPublishType === 'image-manual' && (

            <div className="schedule-calendar-panel">

              <div className="schedule-calendar-header">

                <button

                  type="button"

                  className="schedule-calendar-nav"

                  onClick={() => handleChangeWeek(-1)}

                >

                  <ChevronLeft size={18} />

                </button>



                <div className="schedule-calendar-range">

                  {formatWeekRange(scheduleWeekStart)}

                </div>



                <button

                  type="button"

                  className="schedule-calendar-nav"

                  onClick={() => handleChangeWeek(1)}

                >

                  <ChevronRight size={18} />

                </button>



                <button

                  type="button"

                  className="schedule-calendar-today"

                  onClick={() => setScheduleWeekStart(getStartOfWeek(new Date()))}

                >

                  Aujourd'hui

                </button>

              </div>



              <div className="schedule-calendar-grid">

                <div className="schedule-calendar-grid-head">

                  <div className="schedule-calendar-cell time-cell">GMT+1</div>

                  {weekDays.map((day) => (

                    <div key={day.toISOString()} className="schedule-calendar-cell header-cell">

                      <div>{WEEK_DAYS[day.getDay()]}</div>

                      <strong>{day.getDate()}</strong>

                    </div>

                  ))}

                </div>



                <div className="schedule-calendar-grid-body">

                  {HOURS.map((hour) => (

                    <div key={hour} className="schedule-calendar-row">

                      <div className="schedule-calendar-cell time-cell">{hour}</div>

                      {weekDays.map((day) => {

                        const hourNumber = parseInt(hour, 10);

                        const cellDate = new Date(day);

                        cellDate.setHours(hourNumber, 0, 0, 0);

                        const key = `${cellDate.toDateString()}-${hourNumber}`;

                        const events = eventsBySlot[key] || [];

                        const isSelected =

                          selectedScheduleAt &&

                          selectedScheduleAt.getTime() === cellDate.getTime();

                        return (

                          <button

                            key={`${day.toISOString()}-${hour}`}

                            type="button"

                            className={`schedule-calendar-cell slot-cell ${

                              isSelected ? 'selected' : ''

                            }`}

                            onClick={() => handleSelectScheduleCell(day, hourNumber.toString())}

                          >

                            {events.length > 0 && (

                              <div className="schedule-event-pill">

                                <span className={`pill-type ${events[0].type}`}>

                                  {events[0].type === 'video'

                                    ? 'Vidéo'

                                    : events[0].type === 'image'

                                    ? 'Photo'

                                    : 'Story'}

                                </span>

                                {events.length > 1 && (

                                  <span className="pill-count">+{events.length - 1}</span>

                                )}

                              </div>

                            )}

                          </button>

                        );

                      })}

                    </div>

                  ))}

                </div>

              </div>

            </div>

          )}





          {/* Section création manuelle de Vidéo */}

          {selectedPublishType === 'video-manual' && (

            <div className="story-creation-panel">

              <button 

                className="story-creation-close"

                onClick={() => {

                  setSelectedPublishType(null);

                  resetVideoState();

                }}

              >

                <X size={20} />

              </button>



              {/* Grille de médias - 4 emplacements */}

              <div className="story-media-grid">

                {[0, 1, 2].map((index) => (

                  <div key={index} className="story-media-slot">

                    {manualVideoFiles[index] ? (

                      <div className="story-media-preview">

                        {manualVideoFiles[index].type?.startsWith('video/') ? (

                          <video

                            className="story-media-video"

                            autoPlay

                            muted

                            loop

                            playsInline

                          >

                            <source src={URL.createObjectURL(manualVideoFiles[index])} />

                          </video>

                        ) : (

                          <img

                            className="story-media-image"

                            src={URL.createObjectURL(manualVideoFiles[index])}

                            alt={`Media ${index + 1}`}

                          />

                        )}

                        <button 

                          className="story-media-remove"

                          onClick={() => handleRemoveVideoManualMediaFile(index)}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div className="story-media-empty" onClick={handleOpenVideoManualMediaPicker}>

                        <div className="story-media-icon">

                          <Video size={32} />

                        </div>

                        <span className="story-media-text">Ajouter une vidéo</span>

                      </div>

                    )}

                  </div>

                ))}

                

                {/* 4ème emplacement avec bordure pointillée */}

                <div className="story-media-slot">

                  {manualVideoFiles[3] ? (

                    <div className="story-media-preview">

                      {manualVideoFiles[3].type?.startsWith('video/') ? (

                        <video

                          className="story-media-video"

                          autoPlay

                          muted

                          loop

                          playsInline

                        >

                          <source src={URL.createObjectURL(manualVideoFiles[3])} />

                        </video>

                      ) : (

                        <img

                          className="story-media-image"

                          src={URL.createObjectURL(manualVideoFiles[3])}

                          alt="Media 4"

                        />

                      )}

                      <button 

                        className="story-media-remove"

                        onClick={() => handleRemoveVideoManualMediaFile(3)}

                      >

                        <X size={14} />

                      </button>

                    </div>

                  ) : (

                    <div className="story-media-add" onClick={handleOpenVideoManualMediaPicker}>

                      <Plus size={32} />

                      <span>Ajouter</span>

                    </div>

                  )}

                </div>

              </div>



              <input

                ref={manualVideoInputRef}

                type="file"

                accept="video/*"

                multiple

                onChange={handleVideoManualMediaFileChange}

                style={{ display: 'none' }}

              />



              {/* Champs pour la description, hashtags et son */}

              {manualVideoFiles.length > 0 && (

                <div className="manual-content-fields" style={{ 

                  marginTop: '20px',

                  display: 'flex',

                  flexDirection: 'column',

                  gap: '16px'

                }}>

                  {/* Champ pour la description */}

                  <div className="manual-field-group">

                    <label className="manual-field-label" style={{

                      display: 'block',

                      fontSize: '14px',

                      fontWeight: '500',

                      color: '#374151',

                      marginBottom: '8px'

                    }}>

                      Description

                    </label>

                    <textarea

                      value={videoCaption}

                      onChange={(e) => setVideoCaption(e.target.value)}

                      placeholder="Écris une description pour ta vidéo..."

                      maxLength={500}

                      style={{

                        width: '100%',

                        minHeight: '80px',

                        padding: '12px',

                        border: '1px solid #e5e7eb',

                        borderRadius: '8px',

                        fontSize: '14px',

                        fontFamily: 'Inter, system-ui, sans-serif',

                        resize: 'vertical',

                        outline: 'none',

                        transition: 'border-color 0.2s'

                      }}

                      onFocus={(e) => e.target.style.borderColor = '#6366f1'}

                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}

                    />

                    <div style={{

                      fontSize: '12px',

                      color: '#9ca3af',

                      marginTop: '4px',

                      textAlign: 'right'

                    }}>

                      {videoCaption.length}/500

                    </div>

                  </div>



                  {/* Champ pour les hashtags */}

                  <div className="manual-field-group">

                    <label className="manual-field-label" style={{

                      display: 'block',

                      fontSize: '14px',

                      fontWeight: '500',

                      color: '#374151',

                      marginBottom: '8px'

                    }}>

                      Hashtags

                    </label>

                    <input

                      type="text"

                      value={videoHashtags}

                      onChange={(e) => setVideoHashtags(e.target.value)}

                      placeholder="#tiktok #video #fyp #viral"

                      maxLength={200}

                      style={{

                        width: '100%',

                        padding: '12px',

                        border: '1px solid #e5e7eb',

                        borderRadius: '8px',

                        fontSize: '14px',

                        fontFamily: 'Inter, system-ui, sans-serif',

                        outline: 'none',

                        transition: 'border-color 0.2s'

                      }}

                      onFocus={(e) => e.target.style.borderColor = '#6366f1'}

                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}

                    />

                    <div style={{

                      fontSize: '12px',

                      color: '#9ca3af',

                      marginTop: '4px',

                      textAlign: 'right'

                    }}>

                      {videoHashtags.length}/200

                    </div>

                  </div>



                  {/* Champ pour le son */}

                  <div className="manual-field-group">

                    <label className="manual-field-label" style={{

                      display: 'block',

                      fontSize: '14px',

                      fontWeight: '500',

                      color: '#374151',

                      marginBottom: '8px'

                    }}>

                      Son musical

                    </label>

                    

                    {/* Affichage du son sélectionné ou bouton pour ajouter */}

                    {selectedVideoSound ? (

                      <div style={{

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'space-between',

                        padding: '12px',

                        border: '1px solid #e5e7eb',

                        borderRadius: '8px',

                        backgroundColor: '#f8fafc'

                      }}>

                        <div style={{

                          display: 'flex',

                          alignItems: 'center',

                          gap: '8px'

                        }}>

                          <Music size={16} color="#6366f1" />

                          <div>

                            <div style={{

                              fontSize: '14px',

                              fontWeight: '500',

                              color: '#111827'

                            }}>

                              {selectedVideoSound.title}

                            </div>

                            <div style={{

                              fontSize: '12px',

                              color: '#6b7280'

                            }}>

                              {selectedVideoSound.artist} • {selectedVideoSound.duration}

                            </div>

                          </div>

                        </div>

                        <button

                          type="button"

                          onClick={handleRemoveVideoSound}

                          style={{

                            padding: '4px 8px',

                            border: '1px solid #ef4444',

                            borderRadius: '4px',

                            backgroundColor: '#ffffff',

                            color: '#ef4444',

                            fontSize: '12px',

                            cursor: 'pointer'

                          }}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div>

                        <input

                          type="text"

                          value={videoSoundQuery}

                          onChange={(e) => handleVideoSoundSearch(e.target.value)}

                          placeholder="Rechercher un son musical..."

                          style={{

                            width: '100%',

                            padding: '12px',

                            border: '1px solid #e5e7eb',

                            borderRadius: '8px',

                            fontSize: '14px',

                            fontFamily: 'Inter, system-ui, sans-serif',

                            outline: 'none',

                            transition: 'border-color 0.2s'

                          }}

                          onFocus={(e) => e.target.style.borderColor = '#6366f1'}

                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}

                        />

                        

                        {/* Résultats de recherche */}

                        {videoSoundResults.length > 0 && (

                          <div style={{

                            position: 'absolute',

                            top: '100%',

                            left: '0',

                            right: '0',

                            backgroundColor: '#ffffff',

                            border: '1px solid #e5e7eb',

                            borderRadius: '8px',

                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',

                            zIndex: 50,

                            maxHeight: '200px',

                            overflowY: 'auto'

                          }}>

                            {videoSoundResults.map((sound) => (

                              <button

                                key={sound.id}

                                type="button"

                                onClick={() => handleSelectVideoSound(sound)}

                                style={{

                                  width: '100%',

                                  padding: '12px',

                                  border: 'none',

                                  backgroundColor: 'transparent',

                                  textAlign: 'left',

                                  cursor: 'pointer',

                                  borderBottom: '1px solid #f3f4f6',

                                  transition: 'background-color 0.2s'

                                }}

                                onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}

                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}

                              >

                                <div style={{

                                  display: 'flex',

                                  alignItems: 'center',

                                  gap: '8px'

                                }}>

                                  <Music size={16} color="#6366f1" />

                                  <div>

                                    <div style={{

                                      fontSize: '14px',

                                      fontWeight: '500',

                                      color: '#111827'

                                    }}>

                                      {sound.title}

                                    </div>

                                    <div style={{

                                      fontSize: '12px',

                                      color: '#6b7280'

                                    }}>

                                      {sound.artist} • {sound.duration}

                                    </div>

                                  </div>

                                </div>

                              </button>

                            ))}

                          </div>

                        )}

                      </div>

                    )}

                  </div>



                  <button type="button" className="ai-action-btn tertiary" onClick={handleApplyVideoMetadata}>

                    Ajouter

                  </button>

                </div>

              )}



              <div className="tiktok-publish-actions" style={{ marginTop: 18 }}>

                <button

                  type="button"

                  className="tiktok-publish-primary"

                  onClick={handleVideoPublish}

                  disabled={manualVideoFiles.length === 0 && !videoPreview}

                >

                  <Send size={20} />

                  <span>Publier maintenant</span>

                </button>

                <div className="tiktok-schedule-block">

                  <div className="tiktok-schedule-title">

                    <Calendar size={18} />

                    <span>PLANIFIER POUR PLUS TARD</span>

                  </div>

                  <div className="tiktok-schedule-input">

                    <input

                      type="text"

                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}

                      readOnly

                      onClick={openVideoComposeSchedulePicker}

                    />

                    <button type="button" onClick={openVideoComposeSchedulePicker} aria-label="Ouvrir le calendrier">

                      <Calendar size={18} />

                    </button>

                  </div>

                  <div className="tiktok-publish-secondary-row">

                    <button

                      type="button"

                      className="tiktok-publish-secondary"

                      onClick={openVideoComposeSchedulePicker}

                      disabled={manualVideoFiles.length === 0 && !videoPreview}

                    >

                      <Calendar size={18} />

                      <span>Planifier</span>

                    </button>

                    <button

                      type="button"

                      className="tiktok-publish-tertiary"

                      onClick={handleVideoSaveDraft}

                      disabled={manualVideoFiles.length === 0 && !videoPreview}

                    >

                      <span>Garder en réserve</span>

                    </button>

                  </div>

                </div>

              </div>



              {showVideoComposeSchedulePicker && selectedPublishType === 'video-manual' && (

                <div style={{ marginTop: 12 }}>{renderScheduleCalendar(handleVideoSchedule, 'Planifier la vidéo')}</div>

              )}



              {scheduleMessage && selectedPublishType === 'video-manual' && (

                <div className="story-schedule-message">{scheduleMessage}</div>

              )}

            </div>

          )}



          {/* Section création IA de Vidéo */}

          {selectedPublishType === 'video-ai' && (

            <div className="story-creation-panel">

              <button 

                className="story-creation-close"

                onClick={() => {

                  setSelectedPublishType(null);

                  resetVideoState();

                }}

              >

                <X size={20} />

              </button>



                {/* Interface IA exactement comme le screenshot */}

                <div className="ai-interface-exact">

                  <div className="ai-header-exact">

                    <div className="ai-title-exact">

                      <Sparkles size={24} color="#6366f1" />

                    </div>

                  </div>



                  {/* Barre de génération IA moderne */}

                  <div className="publish-ai-form">

                    <div className="publish-ai-input-wrapper">

                      <Sparkles size={16} color="#6b7280" />

                      <input

                        type="text"

                        className="publish-ai-input"

                        value={videoPrompt}

                        onChange={(e) => setVideoPrompt(e.target.value)}

                        placeholder="Décrivez votre post, l'IA génère tout..."

                        maxLength={500}

                      />

                    </div>

                    <button

                      type="button"

                      className="publish-ai-submit"

                      onClick={handleVideoAiSubmit}

                      disabled={!videoPrompt.trim() || videoPrompt.length < 3 || isAiMediaGenerating}

                    >

                      <Sparkles size={16} />

                      <span>Générer</span>

                    </button>

                  </div>

                </div>



                {/* Aperçu de la vidéo générée */}

                {videoPreview && (

                  <div className="ai-story-preview">

                  <div className="manual-content-fields" style={{ marginBottom: '14px' }}>

                    <div className="manual-field-group">

                      <label className="manual-field-label">Caption</label>

                      <textarea

                        value={videoCaption}

                        onChange={(e) => setVideoCaption(e.target.value)}

                        placeholder="Caption"

                        rows={3}

                      />

                    </div>

                    <div className="manual-field-group">

                      <label className="manual-field-label">Hashtags</label>

                      <input

                        type="text"

                        value={videoHashtags}

                        onChange={(e) => setVideoHashtags(e.target.value)}

                        placeholder="#tiktok #video #fyp"

                      />

                    </div>

                    <button type="button" className="ai-action-btn tertiary" onClick={handleApplyVideoMetadata}>

                      Ajouter

                    </button>

                  </div>

                    <div className="ai-tiktok-preview">

                      {/* Format téléphone TikTok */}

                      <div className="tiktok-phone-frame">

                        <div className="tiktok-story-container">

                          {/* Vidéo générée par l'IA */}

                          <div className="story-media-container">

                            {(videoCover || videoMediaPreview) ? (

                              <PreviewVideo

                                className="story-preview-video"

                                src={videoCover || videoMediaPreview}

                                autoPlay

                                muted

                                loop

                                playsInline

                              />

                            ) : (

                              <div className="ai-generated-story">

                                <div className="ai-story-content">

                                  <div className="ai-story-text">{videoPreview}</div>

                                </div>

                              </div>

                            )}

                          </div>

                          

                          {/* Overlay TikTok authentique */}

                          <div className="story-overlay">

                            {/* Header TikTok simplifié sans icônes */}

                            <div className="story-header">

                              <div className="story-user-info">

                                <div className="story-avatar">

                                  <span>AI</span>

                                </div>

                                <div className="story-user-details">

                                  <div className="story-username">@ai_videos</div>

                                  <div className="story-time">il y a 1s</div>

                                </div>

                              </div>

                            </div>

                            

                            {/* Footer TikTok simplifié sans icônes */}

                            <div className="story-footer">

                              {/* Barre de progression uniquement */}

                              <div className="story-progress">

                                <div className="story-progress-bar"></div>

                              </div>

                            </div>

                            

                            {/* Légende de la story sans icônes */}

                            <div className="story-caption">

                              <p>{videoPreview}</p>

                              {selectedVideoSound && (

                                <div className="story-sound-info">

                                  <span>{selectedVideoSound.title}</span>

                                </div>

                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

              )}



              <div className="story-media-grid" style={{ marginTop: 18 }}>

                {[0, 1, 2].map((index) => (

                  <div key={`va-${index}`} className="story-media-slot">

                    {manualVideoFiles[index] ? (

                      <div className="story-media-preview">

                        {manualVideoFiles[index].type?.startsWith('video/') ? (

                          <video className="story-media-video" autoPlay muted loop playsInline>

                            <source src={URL.createObjectURL(manualVideoFiles[index])} />

                          </video>

                        ) : (

                          <img

                            className="story-media-image"

                            src={URL.createObjectURL(manualVideoFiles[index])}

                            alt={`Media ${index + 1}`}

                          />

                        )}

                        <button

                          type="button"

                          className="story-media-remove"

                          onClick={() => handleRemoveVideoManualMediaFile(index)}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div className="story-media-empty" onClick={handleOpenVideoManualMediaPicker} role="presentation">

                        <div className="story-media-icon">

                          <Video size={32} />

                        </div>

                        <span className="story-media-text">Ajouter une vidéo</span>

                      </div>

                    )}

                  </div>

                ))}

                <div className="story-media-slot">

                  {manualVideoFiles[3] ? (

                    <div className="story-media-preview">

                      {manualVideoFiles[3].type?.startsWith('video/') ? (

                        <video className="story-media-video" autoPlay muted loop playsInline>

                          <source src={URL.createObjectURL(manualVideoFiles[3])} />

                        </video>

                      ) : (

                        <img

                          className="story-media-image"

                          src={URL.createObjectURL(manualVideoFiles[3])}

                          alt="Media 4"

                        />

                      )}

                      <button

                        type="button"

                        className="story-media-remove"

                        onClick={() => handleRemoveVideoManualMediaFile(3)}

                      >

                        <X size={14} />

                      </button>

                    </div>

                  ) : (

                    <div className="story-media-add" onClick={handleOpenVideoManualMediaPicker} role="presentation">

                      <Plus size={32} />

                      <span>Ajouter</span>

                    </div>

                  )}

                </div>

              </div>



              <input

                ref={manualVideoInputRef}

                type="file"

                accept="video/*"

                multiple

                onChange={handleVideoManualMediaFileChange}

                style={{ display: 'none' }}

              />



              <div className="tiktok-publish-actions" style={{ marginTop: 18 }}>

                <button

                  type="button"

                  className="tiktok-publish-primary"

                  onClick={handleVideoPublish}

                  disabled={manualVideoFiles.length === 0 && !videoPreview}

                >

                  <Send size={20} />

                  <span>Publier maintenant</span>

                </button>

                <div className="tiktok-schedule-block">

                  <div className="tiktok-schedule-title">

                    <Calendar size={18} />

                    <span>PLANIFIER POUR PLUS TARD</span>

                  </div>

                  <div className="tiktok-schedule-input">

                    <input

                      type="text"

                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}

                      readOnly

                      onClick={openVideoComposeSchedulePicker}

                    />

                    <button type="button" onClick={openVideoComposeSchedulePicker} aria-label="Ouvrir le calendrier">

                      <Calendar size={18} />

                    </button>

                  </div>

                  <div className="tiktok-publish-secondary-row">

                    <button

                      type="button"

                      className="tiktok-publish-secondary"

                      onClick={openVideoComposeSchedulePicker}

                      disabled={manualVideoFiles.length === 0 && !videoPreview}

                    >

                      <Calendar size={18} />

                      <span>Planifier</span>

                    </button>

                    <button

                      type="button"

                      className="tiktok-publish-tertiary"

                      onClick={handleVideoSaveDraft}

                      disabled={manualVideoFiles.length === 0 && !videoPreview}

                    >

                      <span>Garder en réserve</span>

                    </button>

                  </div>

                </div>

              </div>



              {showVideoComposeSchedulePicker && selectedPublishType === 'video-ai' && (

                <div style={{ marginTop: 12 }}>{renderScheduleCalendar(handleVideoSchedule, 'Planifier la vidéo')}</div>

              )}

            </div>

          )}



          {/* Section création IA de Image */}

          {selectedPublishType === 'image-ai' && (

            <div className="story-creation-panel">

              <button 

                className="story-creation-close"

                onClick={() => {

                  setSelectedPublishType(null);

                  resetStoryState();

                }}

              >

                <X size={20} />

              </button>



              {/* Interface IA exactement comme le screenshot */}

              <div className="ai-interface-exact">

                {/* Barre de génération IA moderne */}

                <div className="publish-ai-form">

                  <div className="publish-ai-input-wrapper">

                    <Sparkles size={16} color="#6b7280" />

                    <input

                      type="text"

                      className="publish-ai-input"

                      value={photoPrompt}

                      onChange={(e) => setPhotoPrompt(e.target.value)}

                      placeholder="Décrivez votre post, l'IA génère tout..."

                      maxLength={500}

                    />

                  </div>

                  <button

                    type="button"

                    className="publish-ai-submit"

                    onClick={handlePhotoAiSubmit}

                    disabled={!photoPrompt.trim() || photoPrompt.length < 3 || isAiMediaGenerating}

                  >

                    <Sparkles size={16} />

                    <span>Générer</span>

                  </button>

                </div>

              </div>



              {/* Aperçu de l'image générée */}

              {photoPreview && (

                <div className="ai-story-preview">

                  <div className="manual-content-fields" style={{ marginBottom: '14px' }}>

                    <div className="manual-field-group">

                      <label className="manual-field-label">Caption</label>

                      <textarea

                        value={photoCaption}

                        onChange={(e) => setPhotoCaption(e.target.value)}

                        placeholder="Caption"

                        rows={3}

                      />

                    </div>

                    <div className="manual-field-group">

                      <label className="manual-field-label">Hashtags</label>

                      <input

                        type="text"

                        value={photoHashtags}

                        onChange={(e) => setPhotoHashtags(e.target.value)}

                        placeholder="#tiktok #photo #fyp"

                      />

                    </div>

                    <button type="button" className="ai-action-btn tertiary" onClick={handleApplyPhotoMetadata}>

                      Ajouter

                    </button>

                  </div>

                  <div className="ai-tiktok-preview">

                    {/* Format téléphone TikTok */}

                    <div className="tiktok-phone-frame">

                      <div className="tiktok-story-container">

                        {/* Image générée par l'IA */}

                        <div className="story-media-container">

                          {(photoCover || photoMediaPreview) ? (

                            <img

                              className="story-preview-image"

                              src={photoCover || photoMediaPreview}

                              alt="Aperçu photo générée"

                            />

                          ) : (

                            <div className="ai-generated-story">

                              <div className="ai-story-content">

                                <div className="ai-story-text">{photoPreview}</div>

                              </div>

                            </div>

                          )}

                          <div className="ai-story-overlay">

                            <div className="ai-story-effects">

                              {photoMode === 'trendy' && <span className="effect-badge">🔥 Trending</span>}

                              {photoMode === 'minimal' && <span className="effect-badge">✨ Minimal</span>}

                              {photoMode === 'vibrant' && <span className="effect-badge">🌈 Vibrant</span>}

                              {photoMode === 'professional' && <span className="effect-badge">💼 Pro</span>}

                            </div>

                          </div>

                        </div>

                          

                          {/* Overlay TikTok authentique */}

                          <div className="story-overlay">

                            {/* Header TikTok simplifié sans icônes */}

                            <div className="story-header">

                              <div className="story-user-info">

                                <div className="story-avatar">

                                  <span>AI</span>

                                </div>

                                <div className="story-user-details">

                                  <div className="story-username">@ai_photos</div>

                                  <div className="story-time">il y a 1s</div>

                                </div>

                              </div>

                            </div>

                            



                            {/* Footer TikTok - LITTÉRALEMENT IDENTIQUE au screenshot */}

                            <div className="story-footer">

                              {/* Barre de progression uniquement */}

                              <div className="story-progress">

                                <div className="story-progress-bar"></div>

                              </div>

                              

                              {/* Layout TikTok exactement comme le screenshot */}

                              <div className="story-caption">

                                <div className="caption-text">

                                  <p>{photoCaption || photoPreview}</p>

                                </div>

                                <div className="hashtags-section">

                                  <div className="story-hashtags">

                                    {photoHashtags || '#tiktok #photo #fyp'}

                                  </div>

                                </div>

                                {selectedSound !== 'Ajouter un son' && (

                                  <div className="story-sound-info">

                                    <Music size={12} fill="white" />

                                    <span>{selectedSound}</span>

                                  </div>

                                )}

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

              )}



              <div className="story-media-grid" style={{ marginTop: 18 }}>

                {[0, 1, 2].map((index) => (

                  <div key={`ia-img-${index}`} className="story-media-slot">

                    {manualMediaFiles[index] ? (

                      <div className="story-media-preview">

                        {manualMediaFiles[index].type?.startsWith('video/') ? (

                          <video className="story-media-video" autoPlay muted loop playsInline>

                            <source src={URL.createObjectURL(manualMediaFiles[index])} />

                          </video>

                        ) : (

                          <img

                            className="story-media-image"

                            src={URL.createObjectURL(manualMediaFiles[index])}

                            alt={`Media ${index + 1}`}

                          />

                        )}

                        <button

                          type="button"

                          className="story-media-remove"

                          onClick={() => handleRemoveManualMediaFile(index)}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div className="story-media-empty" onClick={handleOpenManualMediaPicker} role="presentation">

                        <div className="story-media-icon">

                          <Image size={32} />

                        </div>

                        <span className="story-media-text">Ajouter un média</span>

                      </div>

                    )}

                  </div>

                ))}

                <div className="story-media-slot">

                  {manualMediaFiles[3] ? (

                    <div className="story-media-preview">

                      {manualMediaFiles[3].type?.startsWith('video/') ? (

                        <video className="story-media-video" autoPlay muted loop playsInline>

                          <source src={URL.createObjectURL(manualMediaFiles[3])} />

                        </video>

                      ) : (

                        <img

                          className="story-media-image"

                          src={URL.createObjectURL(manualMediaFiles[3])}

                          alt="Media 4"

                        />

                      )}

                      <button

                        type="button"

                        className="story-media-remove"

                        onClick={() => handleRemoveManualMediaFile(3)}

                      >

                        <X size={14} />

                      </button>

                    </div>

                  ) : (

                    <div className="story-media-add" onClick={handleOpenManualMediaPicker} role="presentation">

                      <Plus size={32} />

                      <span>Ajouter</span>

                    </div>

                  )}

                </div>

              </div>



              <input

                ref={manualMediaInputRef}

                type="file"

                accept="image/*,video/*"

                multiple

                onChange={handleManualMediaFileChange}

                style={{ display: 'none' }}

              />



              <div className="tiktok-publish-actions" style={{ marginTop: 18 }}>

                <button

                  type="button"

                  className="tiktok-publish-primary"

                  onClick={handlePhotoPublish}

                  disabled={manualMediaFiles.length === 0 && !photoPreview}

                >

                  <Send size={20} />

                  <span>Publier maintenant</span>

                </button>

                <div className="tiktok-schedule-block">

                  <div className="tiktok-schedule-title">

                    <Calendar size={18} />

                    <span>PLANIFIER POUR PLUS TARD</span>

                  </div>

                  <div className="tiktok-schedule-input">

                    <input

                      type="text"

                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}

                      readOnly

                      onClick={handleOpenSchedulePickerPhoto}

                    />

                    <button type="button" onClick={handleOpenSchedulePickerPhoto} aria-label="Ouvrir le calendrier">

                      <Calendar size={18} />

                    </button>

                  </div>

                  <div className="tiktok-publish-secondary-row">

                    <button

                      type="button"

                      className="tiktok-publish-secondary"

                      onClick={handleOpenSchedulePickerPhoto}

                      disabled={manualMediaFiles.length === 0 && !photoPreview}

                    >

                      <Calendar size={18} />

                      <span>Planifier</span>

                    </button>

                    <button

                      type="button"

                      className="tiktok-publish-tertiary"

                      onClick={handlePhotoSaveDraft}

                      disabled={manualMediaFiles.length === 0 && !photoPreview}

                    >

                      <span>Garder en réserve</span>

                    </button>

                  </div>

                </div>

              </div>



              {showSchedulePicker && selectedPublishType === 'image-ai' && (

                <div style={{ marginTop: 12 }}>

                  {renderScheduleCalendar(handlePhotoSchedule, "Planifier l'image")}

                </div>

              )}



              {scheduleMessage && selectedPublishType === 'image-ai' && (

                <div className="story-schedule-message">{scheduleMessage}</div>

              )}

            </div>

          )}



          {/* Section création IA de Story */}

          {selectedPublishType === 'story-ai' && (

            <div className="story-creation-panel">

              <button 

                className="story-creation-close"

                onClick={() => {

                  setSelectedPublishType(null);

                  setEditingDraftFromListId(null);

                  setEditingPublishedFromCreateId(null);

                  resetStoryState();

                }}

              >

                <X size={20} />

              </button>



              {/* Interface IA exactement comme le screenshot */}

              <div className="ai-interface-exact">

                {/* Barre de génération IA moderne */}

                <div className="publish-ai-form">

                  <div className="publish-ai-input-wrapper">

                    <Sparkles size={16} color="#6b7280" />

                    <input

                      type="text"

                      className="publish-ai-input"

                      value={aiPrompt}

                      onChange={(e) => setAiPrompt(e.target.value)}

                      placeholder={`Décrivez votre ${creationKind === 'video' ? 'vidéo' : creationKind === 'image' ? 'image' : 'story'}, l'IA génère tout...`}

                      maxLength={500}

                    />

                  </div>

                  <button

                    type="button"

                    className="publish-ai-submit"

                    onClick={handleAiSubmit}

                    disabled={!aiPrompt.trim() || aiPrompt.length < 3 || isAiMediaGenerating}

                  >

                    <Sparkles size={16} />

                    <span>Générer</span>

                  </button>

                </div>

                {creationKind === 'story' && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
                    <button
                      type="button"
                      className={`ai-action-btn ${storyMediaType !== 'video' ? 'primary' : 'tertiary'}`}
                      onClick={() => setStoryMediaType('photo')}
                    >
                      <Image size={14} />
                      <span>Image</span>
                    </button>
                    <button
                      type="button"
                      className={`ai-action-btn ${storyMediaType === 'video' ? 'primary' : 'tertiary'}`}
                      onClick={() => setStoryMediaType('video')}
                    >
                      <Video size={14} />
                      <span>Vidéo</span>
                    </button>
                  </div>
                )}

              </div>



              {/* Aperçu IA directement sous la barre (comme demandé) */}

              {storyPreview && (

                <div style={{ marginTop: 18 }}>



                  <div className="ai-story-preview" style={{ marginTop: 0 }}>

                    <div className="ai-tiktok-preview">

                      <div className="tiktok-phone-frame">

                        <div className="tiktok-story-container">

                          <div className="story-media-container">

                            {(storyMediaPreview || storyCover) ? (
                              (creationKind === 'video' || storyAiMediaKind === 'video' || storyMediaType === 'video') ? (
                                <PreviewVideo
                                  className="story-preview-video"
                                  src={storyMediaPreview || storyCover}
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                              ) : (
                                <img
                                  className="story-preview-image"
                                  src={storyMediaPreview || storyCover}
                                  alt="Aperçu story générée"
                                />
                              )
                            ) : creationKind === 'video' ? (

                              <video className="story-preview-video" autoPlay muted loop playsInline>

                                <source src={storyMediaPreview || storyCover} />

                              </video>

                            ) : creationKind === 'image' ? (

                              <img className="story-preview-image" src={storyMediaPreview || storyCover} alt="Image preview" />

                            ) : (

                              <div className="ai-generated-story">

                                <div className="ai-story-content">

                                  <div className="ai-story-text">{storyPreview}</div>

                                </div>

                              </div>

                            )}



                            <div className="story-overlay">

                              <div className="story-header">

                                <div className="story-user-info">

                                  <div className="story-avatar">

                                    <span>AI</span>

                                  </div>

                                  <div className="story-user-details">

                                    <div className="story-username">@vous</div>

                                    <div className="story-time">il y a 1s</div>

                                  </div>

                                </div>

                              </div>



                              <div className="story-footer">

                                <div className="story-progress">

                                  <div className="story-progress-bar"></div>

                                </div>

                              </div>



                              <div className="story-caption">

                                <p>{storyCaption || storyPreview}</p>

                                {storyHashtags && <div className="story-hashtags">{storyHashtags}</div>}

                                {selectedSound !== 'Ajouter un son' && (

                                  <div className="story-sound-info">

                                    <span>{selectedSound}</span>

                                  </div>

                                )}

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              )}



              {/* Grille média (sélection manuelle) directement sous la barre */}

              <div className="story-media-grid" style={{ marginTop: 18 }}>

                {[0, 1, 2].map((index) => (

                  <div key={index} className="story-media-slot">

                    {manualMediaFiles[index] ? (

                      <div className="story-media-preview">

                        {manualMediaFiles[index].type?.startsWith('video/') ? (

                          <video

                            className="story-media-video"

                            autoPlay

                            muted

                            loop

                            playsInline

                          >

                            <source src={URL.createObjectURL(manualMediaFiles[index])} />

                          </video>

                        ) : (

                          <img

                            className="story-media-image"

                            src={URL.createObjectURL(manualMediaFiles[index])}

                            alt={`Media ${index + 1}`}

                          />

                        )}

                        <button

                          className="story-media-remove"

                          onClick={() => handleRemoveManualMediaFile(index)}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div className="story-media-empty" onClick={handleOpenManualMediaPicker}>

                        <div className="story-media-icon">

                          <Image size={32} />

                        </div>

                        <span className="story-media-text">Ajouter un média</span>

                      </div>

                    )}

                  </div>

                ))}



                <div className="story-media-slot">

                  {manualMediaFiles[3] ? (

                    <div className="story-media-preview">

                      {manualMediaFiles[3].type?.startsWith('video/') ? (

                        <video

                          className="story-media-video"

                          autoPlay

                          muted

                          loop

                          playsInline

                        >

                          <source src={URL.createObjectURL(manualMediaFiles[3])} />

                        </video>

                      ) : (

                        <img

                          className="story-media-image"

                          src={URL.createObjectURL(manualMediaFiles[3])}

                          alt="Media 4"

                        />

                      )}

                      <button

                        className="story-media-remove"

                        onClick={() => handleRemoveManualMediaFile(3)}

                      >

                        <X size={14} />

                      </button>

                    </div>

                  ) : (

                    <div className="story-media-add" onClick={handleOpenManualMediaPicker}>

                      <Plus size={32} />

                      <span>Ajouter</span>

                    </div>

                  )}

                </div>

              </div>



              <input

                ref={manualMediaInputRef}

                type="file"

                accept="image/*,video/*"

                multiple

                onChange={handleManualMediaFileChange}

                style={{ display: 'none' }}

              />



              {/* Aperçu story manuelle sous la grille (avant les boutons) */}

              {manualMediaFiles.length > 0 && (

                <div className="ai-story-preview" style={{ marginTop: 18 }}>

                  <div className="ai-tiktok-preview">

                    <div className="tiktok-phone-frame">

                      <div className="tiktok-story-container">

                        <div className="story-media-container">

                          <TiktokManualMediaCarousel

                            files={manualMediaFiles}

                            carouselRef={manualCarouselRef}

                            onSlideIndexChange={handleManualCarouselIndex}

                          />

                          <div className="story-overlay">

                            <div className="story-header">

                              <div className="story-user-info">

                                <div className="story-avatar">

                                  <span>U</span>

                                </div>

                                <div className="story-user-details">

                                  <div className="story-username">@vous</div>

                                  <div className="story-time">il y a 1s</div>

                                </div>

                              </div>

                            </div>

                            <div className="story-footer">

                              <div className="story-progress">

                                <div className="story-progress-bar"></div>

                              </div>

                            </div>

                            <div className="story-caption">

                              <p>{storyCaption || storyPreview || "Ta caption s'affiche ici"}</p>

                              {storyHashtags && <div className="story-hashtags">{storyHashtags}</div>}

                            </div>

                          </div>

                          {manualMediaFiles.length > 1 && (

                            <TiktokManualCarouselChrome

                              count={manualMediaFiles.length}

                              activeIndex={currentPhotoIndex}

                              onPrev={handlePreviousPhoto}

                              onNext={handleNextPhoto}

                              onDotClick={handleManualCarouselDotClick}

                            />

                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              )}



              {/* Actions sous la grille (création manuelle) - style exact screenshot */}



              {(storyPreview || manualMediaFiles.length > 0 || storyMediaPreview || storyCover || editingDraftFromListId || editingScheduledFromListId) && (

                <div style={{ marginTop: 14, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                  <div className="publish-ai-form">

                    <div className="publish-ai-input-wrapper">

                      <Edit3 size={16} color="#6b7280" />

                      <input

                        type="text"

                        className="publish-ai-input"

                        value={storyCaption}

                        onChange={(e) => setStoryCaption(e.target.value)}

                        placeholder="Écris la caption"

                      />

                    </div>

                  </div>

                  <div className="publish-ai-form">

                    <div className="publish-ai-input-wrapper">

                      <Hash size={16} color="#6b7280" />

                      <input

                        type="text"

                        className="publish-ai-input"

                        value={storyHashtags}

                        onChange={(e) => setStoryHashtags(e.target.value)}

                        placeholder={creationKind === 'video' ? '#tiktok #video #fyp' : creationKind === 'image' ? '#tiktok #image #fyp' : '#tiktok #story #fyp'}

                      />

                    </div>

                  </div>

                  <button type="button" className="tiktok-publish-primary tiktok-add-metadata-btn" onClick={handleApplyStoryMetadata}>

                    Ajouter

                  </button>

                </div>

              )}

              <div className="tiktok-publish-actions">

                <button

                  className="tiktok-publish-primary"

                  onClick={handleStoryPublish}

                  disabled={

                    manualMediaFiles.length === 0 && !storyPreview && !(storyMediaPreview || storyCover)

                  }

                >

                  <Send size={20} />

                  <span>Publier maintenant</span>

                </button>



                <div className="tiktok-schedule-block">

                  <div className="tiktok-schedule-title">

                    <Calendar size={18} />

                    <span>PLANIFIER POUR PLUS TARD</span>

                  </div>



                  <div className="tiktok-schedule-input">

                    <input

                      type="text"

                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}

                      readOnly

                      onClick={openStorySchedulePicker}

                    />

                    <button type="button" onClick={openStorySchedulePicker} aria-label="Ouvrir le calendrier">

                      <Calendar size={18} />

                    </button>

                  </div>



                  <div className="tiktok-publish-secondary-row">

                    <button

                      type="button"

                      className="tiktok-publish-secondary"

                      onClick={openStorySchedulePicker}

                      disabled={

                        manualMediaFiles.length === 0 && !storyPreview && !(storyMediaPreview || storyCover)

                      }

                    >

                      <Calendar size={18} />

                      <span>Planifier</span>

                    </button>

                    <button

                      type="button"

                      className="tiktok-publish-tertiary"

                      onClick={handleStorySaveDraft}

                      disabled={

                        manualMediaFiles.length === 0 && !storyPreview && !(storyMediaPreview || storyCover)

                      }

                    >

                      <span>Garder en réserve</span>

                    </button>

                  </div>

                </div>

              </div>







              {showStoryManualSchedulePicker && renderScheduleCalendar()}



              {scheduleMessage && (

                <div className="story-schedule-message">{scheduleMessage}</div>

              )}

            </div>

          )}



          {/* Section création manuelle de Story */}

          {selectedPublishType === 'story-manual' && (

            <div className="story-creation-panel">

              <button 

                className="story-creation-close"

                onClick={() => {

                  setSelectedPublishType(null);

                  resetStoryState();

                }}

              >

                <X size={20} />

              </button>



              {/* Grille de médias - 4 emplacements */}

              <div className="story-media-grid">

                {[0, 1, 2].map((index) => (

                  <div key={index} className="story-media-slot">

                    {manualMediaFiles[index] ? (

                      <div className="story-media-preview">

                        {manualMediaFiles[index].type?.startsWith('video/') ? (

                          <video

                            className="story-media-video"

                            autoPlay

                            muted

                            loop

                            playsInline

                          >

                            <source src={URL.createObjectURL(manualMediaFiles[index])} />

                          </video>

                        ) : (

                          <img

                            className="story-media-image"

                            src={URL.createObjectURL(manualMediaFiles[index])}

                            alt={`Media ${index + 1}`}

                          />

                        )}

                        <button 

                          className="story-media-remove"

                          onClick={() => handleRemoveManualMediaFile(index)}

                        >

                          <X size={14} />

                        </button>

                      </div>

                    ) : (

                      <div className="story-media-empty" onClick={handleOpenManualMediaPicker}>

                        <div className="story-media-icon">

                          <Image size={32} />

                        </div>

                        <span className="story-media-text">Ajouter un média</span>

                      </div>

                    )}

                  </div>

                ))}

                

                {/* 4ème emplacement avec bordure pointillée */}

                <div className="story-media-slot">

                  {manualMediaFiles[3] ? (

                    <div className="story-media-preview">

                      {manualMediaFiles[3].type?.startsWith('video/') ? (

                        <video

                          className="story-media-video"

                          autoPlay

                          muted

                          loop

                          playsInline

                        >

                          <source src={URL.createObjectURL(manualMediaFiles[3])} />

                        </video>

                      ) : (

                        <img

                          className="story-media-image"

                          src={URL.createObjectURL(manualMediaFiles[3])}

                          alt={`Media 4`}

                        />

                      )}

                      <button 

                        className="story-media-remove"

                        onClick={() => handleRemoveManualMediaFile(3)}

                      >

                        <X size={14} />

                      </button>

                    </div>

                  ) : (

                    <div className="story-media-add" onClick={handleOpenManualMediaPicker}>

                      <Plus size={32} />

                      <span>Ajouter</span>

                    </div>

                  )}

                </div>

              </div>



              <input

                ref={manualMediaInputRef}

                type="file"

                accept="image/*,video/*"

                multiple

                onChange={handleManualMediaFileChange}

                style={{ display: 'none' }}

              />



              {/* Aperçu de story TikTok automatique */}

              {manualMediaFiles.length > 0 && (

                <div className="story-preview-section">

                  <div className="story-preview-header">

                    <h4>Aperçu de votre Story</h4>

                  </div>

                  <div className="story-tiktok-preview">

                    {/* Format téléphone TikTok */}

                    <div className="tiktok-phone-frame">

                      <div className="tiktok-story-container">

                        {/* Image/vidéo de la story */}

                        <div className="story-media-container">

                          <TiktokManualMediaCarousel

                            files={manualMediaFiles}

                            carouselRef={manualCarouselRef}

                            onSlideIndexChange={handleManualCarouselIndex}

                          />

                          

                          {/* Overlay TikTok authentique */}

                          <div className="story-overlay">

                            {/* Header TikTok */}

                            <div className="story-header">

                              <div className="story-user-info">

                                <div className="story-avatar">

                                  <span>V</span>

                                </div>

                                <div className="story-user-details">

                                  <div className="story-username">@votrenom</div>

                                  <div className="story-time">il y a 1s</div>

                                </div>

                              </div>

                              <div className="story-header-actions">

                                <button type="button" className="story-more-btn">

                                  <MoreVertical size={20} color="white" />

                                </button>

                              </div>

                            </div>

                            

                            {/* Footer TikTok */}

                            <div className="story-footer">

                              <div className="story-actions">

                                <button type="button" className="story-action-btn">

                                  <Heart size={24} color="white" />

                                  <span>0</span>

                                </button>

                                <button type="button" className="story-action-btn">

                                  <MessageCircle size={24} color="white" />

                                  <span>0</span>

                                </button>

                                <button type="button" className="story-action-btn">

                                  <Share2 size={24} color="white" />

                                </button>

                                <button type="button" className="story-action-btn">

                                  <Music size={24} color="white" />

                                </button>

                              </div>

                              

                              {/* Barre de progression */}

                              <div className="story-progress">

                                <div className="story-progress-bar"></div>

                              </div>

                            </div>

                            

                            {/* Légende de la story */}

                            {(storyCaption || storyPreview || storyHashtags) && (

                              <div className="story-caption">

                                <p>{storyCaption || storyPreview}</p>

                                {storyHashtags && <div className="story-hashtags">{storyHashtags}</div>}

                              </div>

                            )}

                          </div>

                          {manualMediaFiles.length > 1 && (

                            <TiktokManualCarouselChrome

                              count={manualMediaFiles.length}

                              activeIndex={currentPhotoIndex}

                              onPrev={handlePreviousPhoto}

                              onNext={handleNextPhoto}

                              onDotClick={handleManualCarouselDotClick}

                            />

                          )}

                        </div>

                      </div>

                    </div>

                    

                    {/* Options de personnalisation */}

                    <div className="story-customization">

                      <div style={{ marginTop: 14, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                        <div className="publish-ai-form">

                          <div className="publish-ai-input-wrapper">

                            <Edit3 size={16} color="#6b7280" />

                            <input

                              type="text"

                              className="publish-ai-input"

                              value={storyCaption}

                              onChange={(e) => setStoryCaption(e.target.value)}

                              placeholder="Écris la caption"

                            />

                          </div>

                        </div>

                        <div className="publish-ai-form">

                          <div className="publish-ai-input-wrapper">

                            <Hash size={16} color="#6b7280" />

                            <input

                              type="text"

                              className="publish-ai-input"

                              value={storyHashtags}

                              onChange={(e) => setStoryHashtags(e.target.value)}

                              placeholder={creationKind === 'video' ? '#tiktok #video #fyp' : creationKind === 'image' ? '#tiktok #image #fyp' : '#tiktok #story #fyp'}

                            />

                          </div>

                        </div>

                      </div>

                      

                      <div className="customization-group">

                        <label>Musique</label>

                        <button

                          className="story-music-selector"

                          onClick={handleOpenSoundPicker}

                        >

                          <Music size={16} />

                          <span>{selectedSound}</span>

                          <ChevronDown size={14} />

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )}



              <div className="tiktok-publish-actions" style={{ marginTop: 18 }}>

                <button

                  type="button"

                  className="tiktok-publish-primary"

                  onClick={handleStoryPublish}

                  disabled={(manualMediaFiles.length === 0 && !storyPreview && !storyCaption && !storyHashtags) && !editingDraftFromListId && !editingScheduledFromListId}

                >

                  <Send size={20} />

                  <span>Publier maintenant</span>

                </button>



                <div className="tiktok-schedule-block">

                  <div className="tiktok-schedule-title">

                    <Calendar size={18} />

                    <span>PLANIFIER POUR PLUS TARD</span>

                  </div>



                  <div className="tiktok-schedule-input">

                    <input

                      type="text"

                      value={selectedScheduleAt ? formatSelectedDate(selectedScheduleAt) : 'Aucune date choisie'}

                      readOnly

                      onClick={openStorySchedulePicker}

                    />

                    <button type="button" onClick={openStorySchedulePicker} aria-label="Ouvrir le calendrier">

                      <Calendar size={18} />

                    </button>

                  </div>



                  <div className="tiktok-publish-secondary-row">

                    <button

                      type="button"

                      className="tiktok-publish-secondary"

                      onClick={openStorySchedulePicker}

                      disabled={(manualMediaFiles.length === 0 && !storyPreview && !storyCaption && !storyHashtags) && !editingDraftFromListId && !editingScheduledFromListId}

                    >

                      <Calendar size={18} />

                      <span>Planifier</span>

                    </button>

                    <button

                      type="button"

                      className="tiktok-publish-tertiary"

                      onClick={handleStorySaveDraft}

                      disabled={(manualMediaFiles.length === 0 && !storyPreview && !storyCaption && !storyHashtags) && !editingDraftFromListId && !editingScheduledFromListId}

                    >

                      <span>Garder en réserve</span>

                    </button>

                  </div>

                </div>

              </div>



              {showStoryManualSchedulePicker && selectedPublishType === 'story-manual' && (

                <div style={{ marginTop: 12 }}>{renderScheduleCalendar()}</div>

              )}



              {publishStatus && (

                <div className="story-publish-message">{publishStatus}</div>

              )}



              

            </div>

          )}          

        </section>

      )}



      {/* Section des posts */}

      <section className="dashboard-card dashboard-posts-card">

        <div className="dashboard-posts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <div>

            <h3>

              {activeTab === 'draft' ? 'Brouillons' : 

               activeTab === 'scheduled' ? 'Planifiés' : 

               'Fil d\'actualité'}

            </h3>

          </div>

          

          <div className="dashboard-posts-controls" style={{ marginLeft: 'auto' }}>

            <div className="tab-group">

              {tabs.map((tab) => (

                <button

                  key={tab.id}

                  type="button"

                  className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}

                  onClick={() => {

                    setShowDraftEditOptions(null);

                    setShowPublishedEditOptions(null);

                    setShowScheduledMoreOptions(null);

                    setShowEditOptions(null);

                    setEditingScheduled(null);

                    setEditedScheduledData({});

                    setActiveTab(tab.id);

                  }}

                >

                  {tab.label}

                </button>

              ))}

            </div>



            <div className="view-group">

              <button

                type="button"

                className={viewMode === 'desktop' ? 'view-button active' : 'view-button'}

                onClick={() => setViewMode('desktop')}

                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}

              >

                <Monitor size={16} />

                Desktop

              </button>

              <button

                type="button"

                className={viewMode === 'mobile' ? 'view-button active' : 'view-button'}

                onClick={() => setViewMode('mobile')}

                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}

              >

                <Smartphone size={16} />

                Mobile

              </button>

            </div>

          </div>

        </div>



        <div className="dashboard-posts-content">

          {filteredPosts.length === 0 ? (

            <div className="no-posts-message">

              <div className="no-posts-icon">

                {activeTab === 'scheduled' ? <Calendar size={48} color="#666" /> : <Video size={48} color="#666" />}

              </div>

              <p>{activeTab === 'scheduled' ? 'Planifiez votre premier contenu en utilisant le bouton de création' : 'Publiez votre premier contenu pour le voir ici'}</p>

            </div>

          ) : (

            <>

              {/* Mode galerie - tous les posts avec scroll tactile */}

              {galleryMode && (

                <div className="gallery-full-view">

                  <div className="gallery-back-button" onClick={() => {

                    setGalleryMode(false);

                  }} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>

                    <ChevronLeft size={24} />

                  </div>

                  <div className="gallery-posts-container">

                    {filteredPosts.map((post) => (

                      <div 

                        key={post.id} 

                        className={`tiktok-post-preview ${viewMode}${post.type === 'story' ? ' tiktok-post--story' : post.type === 'image' ? ' tiktok-post--photo' : ''}`}

                        style={{ marginBottom: '20px' }}

                      >

                        <div className="tiktok-video-container">

                          {post.type === 'story' ? (
                            <div className="tiktok-story-badge">Story</div>
                          ) : null}

                          {isPostVideoMedia(post) ? (

                            <video 

                              id={`tiktok-video-${post.id}`}

                              className="tiktok-video-player"

                              autoPlay={false}

                              muted={true}

                              loop={true}

                              playsInline={true}

                              poster="https://picsum.photos/400/800?blur=2"

                            >

                              <source src={post.contentPreview || "https://storage.googleapis.com/coverr-main/mp4/Footage.mp4"} type="video/mp4" />

                            </video>

                          ) : (

                            <img 

                              src={post.contentPreview || "https://picsum.photos/400/800"} 

                              alt={post.title}

                              className="tiktok-image-preview"

                            />

                          )}

                          

                          {/* Overlay TikTok */}

                          <div className="tiktok-video-overlay">

                            <div className="tiktok-user-section">

                              <div className="tiktok-user-info-row">

                                <div className="tiktok-avatar-container">

                                  <div className="tiktok-avatar-circle">

                                    <span className="tiktok-avatar-text">

                                      {post.userAvatar || (post.username || '@votrenom').charAt(1).toUpperCase()}

                                    </span>

                                    {post.verified && <div className="verified-badge">✓</div>}

                                  </div>

                                </div>

                                <div className="tiktok-user-details">

                                  <div className="tiktok-username-row">

                                    <span className="tiktok-username">

                                      {post.username || '@votrenom'}

                                    </span>

                                    {post.verified && <div className="verified-check">✓</div>}

                                  </div>

                                  <div className="tiktok-description">

                                    {post.description || post.title || 'Contenu TikTok'}

                                  </div>

                                  <div className="tiktok-hashtags">

                                    {(post.hashtags || '#tiktok #fyp #viral').split(' ').map((tag, index) => (

                                      <span key={index} className="hashtag">{tag}</span>

                                    ))}

                                  </div>

                                </div>

                              </div>

                            </div>

                            

                            <div className="tiktok-side-actions">

                              <div className="side-action">

                                <button className="action-button">

                                  <Heart size={28} fill={post.likes > 0 ? '#ff0050' : 'none'} color={post.likes > 0 ? '#ff0050' : 'white'} />

                                </button>

                                <span className="action-count">{formatCount(post.likes || 0)}</span>

                              </div>

                              <div className="side-action">

                                <button className="action-button">

                                  <MessageCircle size={28} />

                                </button>

                                <span className="action-count">{formatCount(post.comments || 0)}</span>

                              </div>

                              <div className="side-action">

                                <button className="action-button">

                                  <Share2 size={28} />

                                </button>

                                <span className="action-count">{formatCount(post.shares || 0)}</span>

                              </div>

                              <div className="side-action">

                                <button className="action-button">

                                  <Bookmark size={28} fill={post.bookmarked ? 'white' : 'none'} />

                                </button>

                              </div>

                            </div>

                            {/* Menu plus d'options */}

                            <div className="more-options">

                              <button 

                                type="button"

                                className="more-btn"

                                onClick={(e) => {

                                  e.stopPropagation();

                                  setShowPublishedEditOptions(showPublishedEditOptions === post.id ? null : post.id);

                                }}

                                title="Plus d'options"

                              >

                                <MoreVertical size={20} color="white" />

                              </button>

                              {showPublishedEditOptions === post.id && (

                                <div className="published-edit-dropdown">

                                  <button type="button" onClick={(e) => {

                                    e.stopPropagation();

                                    handleEditPublishedPost(post);

                                  }}>

                                    Modifier

                                  </button>

                                  <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePublishedPost(post.id);
                                  }}>

                                    Supprimer

                                  </button>

                                </div>

                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}



              {/* Interface de modification directe */}

              {editingPublished && (
                <div className="edit-post-overlay">
                  <div className="edit-post-container">
                    <div className="edit-post-header">
                      <h3>Modifier le post</h3>
                      <button 
                        className="close-edit-btn"
                        onClick={handleCancelEditPublished}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="edit-post-form">
                      <div className="form-group">
                        <label>Titre</label>
                        <input
                          type="text"
                          value={editedPublishedData.title || ''}
                          onChange={(e) => setEditedPublishedData(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                          placeholder="Titre du post"
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={editedPublishedData.description || ''}
                          onChange={(e) => setEditedPublishedData(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          placeholder="Description du post"
                          rows={3}
                        />
                      </div>
                      <div className="form-group">
                        <label>Hashtags</label>
                        <input
                          type="text"
                          value={editedPublishedData.hashtags || ''}
                          onChange={(e) => setEditedPublishedData(prev => ({
                            ...prev,
                            hashtags: e.target.value
                          }))}
                          placeholder="#tiktok #fyp #viral"
                        />
                      </div>
                      <div className="form-group">
                        <label>Son</label>
                        <input
                          type="text"
                          value={editedPublishedData.sound || ''}
                          onChange={(e) => setEditedPublishedData(prev => ({
                            ...prev,
                            sound: e.target.value
                          }))}
                          placeholder="Son original"
                        />
                      </div>
                      <div className="form-group">
                        <label>Visibilité</label>
                        <select
                          value={editedPublishedData.visibility || 'public'}
                          onChange={(e) => setEditedPublishedData(prev => ({
                            ...prev,
                            visibility: e.target.value
                          }))}
                        >
                          <option value="public">Public</option>
                          <option value="friends">Amis</option>
                          <option value="private">Privé</option>
                        </select>
                      </div>
                      <div className="edit-post-actions">
                        <button 
                          className="save-edit-btn"
                          onClick={() => handleSavePublishedChanges(editingPublished)}
                        >
                          Sauvegarder
                        </button>
                        <button 
                          className="cancel-edit-btn"
                          onClick={handleCancelEditPublished}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Affichage normal - seulement la dernière vidéo par défaut */}

              {!galleryMode && !editingPublished && (
                <div className="posts-grid">
                  {filteredPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`tiktok-post-preview ${viewMode}${post.type === 'story' ? ' tiktok-post--story' : post.type === 'image' ? ' tiktok-post--photo' : ''}`}
                      onClick={() => {
                        setSelectedPost(post);
                        setGalleryMode(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >

                      
                      <div className="tiktok-video-container">

                        {post.type === 'story' ? (
                          <div className="tiktok-story-badge">Story</div>
                        ) : null}

                        {isPostVideoMedia(post) ? (

                          <video 

                            id={`tiktok-video-${post.id}`}

                            className="tiktok-video-player"

                            autoPlay={viewMode === 'desktop'}

                            muted={true}

                            loop={true}

                            playsInline={true}

                            poster="https://picsum.photos/400/800?blur=2"

                          >

                            <source src={post.contentPreview || "https://storage.googleapis.com/coverr-main/mp4/Footage.mp4"} type="video/mp4" />

                          </video>

                        ) : (

                          <img 

                            src={post.contentPreview || "https://picsum.photos/400/800"} 

                            alt={post.title}

                            className="tiktok-image-preview"

                          />

                        )}

                        

                        {/* Overlay TikTok */}

                        <div className="tiktok-video-overlay">

                          <div className="tiktok-user-section">

                            <div className="tiktok-user-info-row">

                              <div className="tiktok-avatar-container">

                                <div className="tiktok-avatar-circle">

                                  <span className="tiktok-avatar-text">

                                    {post.userAvatar || (post.username || '@votrenom').charAt(1).toUpperCase()}

                                  </span>

                                  {post.verified && <div className="verified-badge">✓</div>}

                                </div>

                              </div>

                              <div className="tiktok-user-details">

                                <div className="tiktok-username-row">

                                  <span className="tiktok-username">

                                    {post.username || '@votrenom'}

                                  </span>

                                  {post.verified && <div className="verified-check">✓</div>}

                                </div>

                                <div className="tiktok-description">

                                  {post.description || post.title || 'Contenu TikTok'}

                                </div>

                                <div className="tiktok-hashtags">

                                  {(post.hashtags || '#tiktok #fyp #viral').split(' ').map((tag, index) => (

                                    <span key={index} className="hashtag">{tag}</span>

                                  ))}

                                </div>

                              </div>

                            </div>

                          </div>

                          

                          <div className="tiktok-side-actions">

                            <div className="side-action">

                              <button className="action-button">

                                <Heart size={28} fill={post.likes > 0 ? '#ff0050' : 'none'} color={post.likes > 0 ? '#ff0050' : 'white'} />

                              </button>

                              <span className="action-count">{formatCount(post.likes || 0)}</span>

                            </div>

                            <div className="side-action">

                              <button className="action-button">

                                <MessageCircle size={28} />

                              </button>

                              <span className="action-count">{formatCount(post.comments || 0)}</span>

                            </div>

                            <div className="side-action">

                              <button className="action-button">

                                <Share2 size={28} />

                              </button>

                              <span className="action-count">{formatCount(post.shares || 0)}</span>

                            </div>

                            <div className="side-action">

                              <button className="action-button">

                                <Bookmark size={28} fill={post.bookmarked ? 'white' : 'none'} />

                              </button>

                            </div>

                          </div>



                          {/* Menu plus d'options */}

                          <div className="more-options">

                            <button 

                              type="button"

                              className="more-btn"

                              onClick={(e) => {

                                e.stopPropagation();

                                setShowPublishedEditOptions(showPublishedEditOptions === post.id ? null : post.id);

                              }}

                              title="Plus d'options"

                            >

                              <MoreVertical size={20} color="white" />

                            </button>

                            {showPublishedEditOptions === post.id && (

                              <div className="published-edit-dropdown">

                                <button type="button" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPublishedPost(post);
                                }}>

                                  Modifier

                                </button>

                                <button type="button" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePublishedPost(post.id);
                                }}>

                                  Supprimer

                                </button>

                              </div>

                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}



                          </>

          )}

        </div>

      </section>

      {pendingDeleteTarget ? (
        <div className="tiktok-delete-modal-overlay" role="presentation" onClick={() => setPendingDeleteTarget(null)}>
          <div
            className="tiktok-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tiktok-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tiktok-delete-modal-icon">
              <AlertTriangle size={18} />
            </div>
            <h4 id="tiktok-delete-title">
              {pendingDeleteTarget.type === 'draft'
                ? 'Supprimer ce brouillon TikTok ?'
                : pendingDeleteTarget.type === 'scheduled'
                  ? 'Supprimer ce contenu planifié ?'
                  : 'Supprimer ce post TikTok ?'}
            </h4>
            <p>
              Cette action est definitive. Etes-vous sur de vouloir supprimer ce contenu, ou preferez-vous annuler pour le conserver ?
            </p>
            <div className="tiktok-delete-modal-actions">
              <button type="button" className="tiktok-delete-cancel" onClick={() => setPendingDeleteTarget(null)}>
                Annuler
              </button>
              <button type="button" className="tiktok-delete-confirm" onClick={handleConfirmDeletePost}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </>

  );

}

