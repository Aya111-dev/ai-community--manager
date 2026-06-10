import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import LinkedinPostForm from './components/PostForm.jsx'
import LinkedinPostsList from './components/PostsList.jsx'
import LinkedinPostTypeSelector from './components/PostTypeSelector.jsx'
import LinkedinStrategyPlanner, { buildLinkedinPlan } from './components/StrategyPlanner.jsx'

const POSTS_STORAGE_KEY = 'linkedin_posts'
const LINKEDIN_STRATEGY_KEY = 'linkedin_strategy_plans'
const LINKEDIN_STRATEGY_META_KEY = 'linkedin_strategy_meta'

export default function LinkedinWorkspace({ meta, onBack }) {
  const [activeTab, setActiveTab] = useState('Publiés')
  const [deviceView, setDeviceView] = useState('Desktop')
  const [posts, setPosts] = useState(() => {
    if (typeof window === 'undefined') return []
    const saved = window.localStorage.getItem(POSTS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showStrategyPlanner, setShowStrategyPlanner] = useState(false)
  const [selectedPostType, setSelectedPostType] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [strategyTheme, setStrategyTheme] = useState(() => {
    if (typeof window === 'undefined') return ''
    const saved = window.localStorage.getItem(LINKEDIN_STRATEGY_META_KEY)
    return saved ? JSON.parse(saved).theme || '' : ''
  })
  const [strategyPostCount, setStrategyPostCount] = useState(() => {
    if (typeof window === 'undefined') return 3
    const saved = window.localStorage.getItem(LINKEDIN_STRATEGY_META_KEY)
    return saved ? JSON.parse(saved).postCount || 3 : 3
  })
  const [strategyPlans, setStrategyPlans] = useState(() => {
    if (typeof window === 'undefined') return Array.from({ length: 3 }, (_, index) => buildLinkedinPlan(index, ''))
    const saved = window.localStorage.getItem(LINKEDIN_STRATEGY_KEY)
    return saved ? JSON.parse(saved) : Array.from({ length: 3 }, (_, index) => buildLinkedinPlan(index, ''))
  })

  const platformName = meta?.name ?? 'LinkedIn'

  const closeComposer = () => {
    setShowCreateForm(false)
    setSelectedPostType(null)
    setSelectedPlan(null)
    setEditingPost(null)
  }

  const openCreateFlow = () => {
    setEditingPost(null)
    setSelectedPlan(null)
    setSelectedPostType(null)
    setShowCreateForm(prev => !prev)
    setShowStrategyPlanner(false)
  }

  const savePost = (postData, status) => {
    const nextPost = {
      id: editingPost?.id ?? Date.now(),
      ...postData,
      status,
      createdAt: editingPost?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    setPosts(prev => {
      if (!editingPost) return [nextPost, ...prev]
      return prev.map(post => (post.id === editingPost.id ? nextPost : post))
    })

    if (postData.strategyPlanId) {
      setStrategyPlans(prev => prev.map(plan => (
        plan.id === postData.strategyPlanId ? { ...plan, status: status === 'draft' ? 'draft' : 'scheduled' } : plan
      )))
    }

    closeComposer()
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setSelectedPlan(null)
    setSelectedPostType(post.type)
    setShowCreateForm(true)
    setShowStrategyPlanner(false)
  }

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  useEffect(() => {
    window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    window.localStorage.setItem(LINKEDIN_STRATEGY_KEY, JSON.stringify(strategyPlans))
  }, [strategyPlans])

  useEffect(() => {
    window.localStorage.setItem(LINKEDIN_STRATEGY_META_KEY, JSON.stringify({
      theme: strategyTheme,
      postCount: strategyPostCount,
    }))
  }, [strategyTheme, strategyPostCount])

  return (
    <main className="homepage-screen">
      <header className="header-card card animation-fade-in">
        <div className="header-left">
          <button
            type="button"
            className="platform-btn active"
            style={meta?.color ? { borderColor: meta.color, color: meta.color } : undefined}
            aria-label={`${platformName} selectionne`}
          >
            <span className="platform-icon" style={meta?.color ? { background: meta.color } : undefined}>
              {meta?.logoUrl ? <img src={meta.logoUrl} alt={`${platformName} logo`} /> : null}
            </span>
            <span>{platformName}</span>
          </button>

          {/* ✅ Arrow added to Retourner button */}
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
          <button
            type="button"
            className="btn-primary"
            onClick={openCreateFlow}
          >
            {showCreateForm ? 'Fermer' : '+ Creer un post'}
          </button>
          <button
            type="button"
            className="action-btn-secondary outline"
            onClick={() => {
              setShowStrategyPlanner(prev => !prev)
              if (showCreateForm) closeComposer()
            }}
          >
            Strategie
          </button>
        </div>
      </header>

      {showStrategyPlanner && (
        <LinkedinStrategyPlanner
          theme={strategyTheme}
          setTheme={setStrategyTheme}
          postCount={strategyPostCount}
          setPostCount={setStrategyPostCount}
          plans={strategyPlans}
          setPlans={setStrategyPlans}
          onCreatePost={(plan) => {
            setSelectedPlan(plan)
            setEditingPost(null)
            setSelectedPostType(plan.type)
            setShowCreateForm(true)
            setShowStrategyPlanner(false)
          }}
        />
      )}

      {showCreateForm && (
        <section
          className="create-post-section card"
          style={{ marginBottom: 20, overflow: 'visible', position: 'relative', zIndex: 20 }}
        >
          {selectedPostType ? (
            <LinkedinPostForm
              postType={selectedPostType}
              initialData={editingPost ?? selectedPlan}
              onPublish={(postData) => savePost(postData, 'published')}
              onSchedule={(postData) => savePost(postData, 'scheduled')}
              onDraft={(postData) => savePost(postData, 'draft')}
              onClose={closeComposer}
            />
          ) : (
            <LinkedinPostTypeSelector
              onSelectType={(type) => setSelectedPostType(type)}
              onClose={closeComposer}
            />
          )}
        </section>
      )}

      <section className="posts-card card" style={{ maxWidth: '100%', width: '100%', position: 'relative', zIndex: 1 }}>
        <LinkedinPostsList
          posts={posts}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          deviceView={deviceView}
          setDeviceView={setDeviceView}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
        />
      </section>
    </main>
  )
}