import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import PostForm from '../facebook/components/PostForm.jsx'
import PostsList from '../facebook/components/PostsList.jsx'
import PostTypeSelector from '../facebook/components/PostTypeSelector.jsx'
import { createPost, updatePost, deletePost, getPosts } from '../../services/api.js'

async function resolveMediaUrl(item) {
  if (!item) return item
  const url = item.url || ''
  if (!url.startsWith('blob:')) return item
  if (item.file instanceof File) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ ...item, url: reader.result, file: null })
      reader.onerror = () => resolve({ ...item, file: null })
      reader.readAsDataURL(item.file)
    })
  }
  return { ...item, file: null }
}

async function resolvePostMedia(postData) {
  if (!Array.isArray(postData.media) || postData.media.length === 0) return postData
  const resolvedMedia = await Promise.all(postData.media.map(resolveMediaUrl))
  return { ...postData, media: resolvedMedia }
}

export default function PlatformWorkspace({ meta, onBack, posts: postsProp, setPosts: setPostsProp }) {
  // ─── FIX: internal fallback so buttons never crash when posts/setPosts
  //     are not passed from outside (e.g. App.jsx missing the props).
  const storageKey = `platform_posts_${meta?.id ?? 'default'}`
  const [internalPosts, setInternalPosts] = useState(() => {
    if (postsProp !== undefined) return []
    if (typeof window === 'undefined') return []
    try {
      const saved = window.localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const posts = postsProp !== undefined ? postsProp : internalPosts
  const setPosts = setPostsProp !== undefined
    ? setPostsProp
    : (updater) => {
        setInternalPosts(prev => {
          const next = typeof updater === 'function' ? updater(prev) : updater
          try { window.localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore */ }
          return next
        })
      }
  // ──────────────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState('Publiés')
  const [deviceView, setDeviceView] = useState('Mobile')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPostType, setSelectedPostType] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const composerRef = useRef(null)

  const platformName = meta?.name ?? 'Plateforme'

  const closeComposer = () => {
    setShowCreateForm(false)
    setSelectedPostType(null)
    setEditingPost(null)
  }

  const openCreateFlow = () => {
    setEditingPost(null)
    setSelectedPostType(null)
    setShowCreateForm(prev => !prev)
  }

  const openCreateFlowForType = (type) => {
    setEditingPost(null)
    setSelectedPostType(type)
    setShowCreateForm(true)
  }

  const savePost = async (postData, status) => {
    const resolvedData = await resolvePostMedia(postData)
    const payload = {
      platform: meta?.id,
      type: resolvedData.type,
      caption: resolvedData.caption,
      description: resolvedData.description || postData.aiPrompt || '',
      hashtags: resolvedData.hashtags,
      status,
      scheduledDate: resolvedData.scheduledDate,
      media: resolvedData.media,
      meta: { style: resolvedData.style, link: resolvedData.link, engagement: resolvedData.engagement },
    }

    try {
      const saved = editingPost?._id || editingPost?.id
        ? await updatePost(editingPost._id || editingPost.id, payload)
        : await createPost(payload)

      const nextPost = {
        ...resolvedData,
        ...saved,
        id: saved.id || saved._id,
        status: saved.status || status,
        createdAt: saved.createdAt ?? editingPost?.createdAt ?? new Date(),
        updatedAt: saved.updatedAt ?? new Date(),
      }

      setPosts(prev => (
        editingPost
          ? prev.map(p => ((p.id === editingPost.id || p._id === editingPost._id) ? nextPost : p))
          : [nextPost, ...prev]
      ))
      closeComposer()
    } catch (error) {
      console.error('Erreur sauvegarde post:', error)
      alert(error.message || 'Impossible de sauvegarder le post')
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setSelectedPostType(post.type)
    setShowCreateForm(true)
  }

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId && p._id !== postId))
    } catch (error) {
      console.error('Erreur suppression:', error)
      setPosts(prev => prev.filter(p => p.id !== postId && p._id !== postId))
    }
  }

  useEffect(() => {
    if (!meta?.id) return
    getPosts({ platform: meta.id })
      .then((loaded) => {
        if (Array.isArray(loaded) && loaded.length > 0) {
          setPosts(loaded.map(p => ({ ...p, id: p.id || p._id })))
        }
      })
      .catch(() => { /* backend indisponible : localStorage conservé */ })
  }, [meta?.id])

  useEffect(() => {
    if (!showCreateForm || !selectedPostType) return
    const composer = composerRef.current
    if (!composer) return
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const focusTimer = window.setTimeout(() => {
      const firstField = composer.querySelector('textarea, input, select, button')
      firstField?.focus()
    }, 250)
    return () => window.clearTimeout(focusTimer)
  }, [showCreateForm, selectedPostType, editingPost])

  return (
    <main className="homepage-screen">
      <header className="header-card card animation-fade-in">
        <div className="header-left">
          <button
            type="button"
            className="platform-btn active"
            style={meta?.color ? { borderColor: meta.color, color: meta.color } : undefined}
            aria-label={`${platformName} sélectionné`}
          >
            <span className="platform-icon" style={meta?.color ? { background: meta.color } : undefined}>
              {meta?.logoUrl ? <img src={meta.logoUrl} alt={`${platformName} logo`} /> : null}
            </span>
            <span>{platformName}</span>
          </button>

          <button
            type="button"
            className="action-btn-secondary outline"
            onClick={() => onBack?.()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retourner
          </button>
        </div>

        <div className="header-actions">
          <button type="button" className="btn-primary" onClick={openCreateFlow}>
            {showCreateForm ? 'Fermer' : '+ Créer un post'}
          </button>
          <button type="button" className="action-btn-secondary outline">
            Stratégie
          </button>
        </div>
      </header>

      {showCreateForm && (
        <section
          ref={composerRef}
          className="create-post-section card"
          style={{ marginBottom: 20, overflow: 'visible', position: 'relative', zIndex: 20 }}
        >
          {selectedPostType ? (
            <PostForm
              postType={selectedPostType}
              platform={meta?.id}
              initialData={editingPost}
              onPublish={(postData) => savePost(postData, 'published')}
              onSchedule={(postData) => savePost(postData, 'scheduled')}
              onDraft={(postData) => savePost(postData, 'draft')}
              onClose={closeComposer}
            />
          ) : (
            <PostTypeSelector
              onSelectType={(type) => setSelectedPostType(type)}
              onClose={closeComposer}
            />
          )}
        </section>
      )}

      <section className="posts-card card" style={{ maxWidth: '100%', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="posts-list">
          <PostsList
            posts={posts}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            deviceView={deviceView}
            setDeviceView={setDeviceView}
            onCreatePost={openCreateFlow}
            onCreatePostType={openCreateFlowForType}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        </div>
      </section>
    </main>
  )
}
