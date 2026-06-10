import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'

import { TABS, DEVICE_VIEWS, FB_BG, FB_BORDER, FB_TEXT, FB_SECONDARY, FB_BLUE, FB_PHONE_INSPECTOR_MAX } from './postsList/constants'
import { useViewportWidth } from './postsList/useViewportWidth'
import { ModalPortal } from './postsList/ModalPortal'
import { StoryCard, StoryCreateCard, ReelCard } from './postsList/StoryReelCards'
import { FeedPostCard } from './postsList/FeedPostCard'
import { StoryViewerPopup } from './postsList/StoryViewerPopup'
import { ReelViewerPopup } from './postsList/ReelViewerPopup'
import { FeedPostPopup } from './postsList/FeedPostPopup'

/* ── MAIN EXPORT ── */
export default function PostsList({ posts, activeTab, setActiveTab, deviceView, setDeviceView, onCreatePost, onCreatePostType, onEditPost, onDeletePost }) {
  const statusMap = { Publiés: 'published', Planifiés: 'scheduled', Brouillons: 'draft' }
  const filtered = posts.filter(post => post.status === statusMap[activeTab])
  const storyPosts = filtered.filter(post => post.type === 'story')
  const reelPosts = filtered.filter(post => post.type === 'reel')
  const feedPosts = filtered.filter(post => post.type !== 'reel' && post.type !== 'story')
  const isEmpty = filtered.length === 0
  const viewportWidth = useViewportWidth()
  const isMobile = deviceView === 'Mobile'
  const isSmallScreen = viewportWidth < 768
  const fbPhoneInspector = viewportWidth <= FB_PHONE_INSPECTOR_MAX
  const showMobileShell = isMobile && !isSmallScreen
  const contentMaxWidth = isMobile ? 430 : 1120
  const pageContentMaxWidth = showMobileShell ? contentMaxWidth : (isSmallScreen ? '100%' : contentMaxWidth)

  // ── Popup state
  const [popupPost, setPopupPost] = useState(null)
  const [popupType, setPopupType] = useState(null) // 'story' | 'reel' | 'feed'

  const openPopup = (post) => {
    const type = post.type === 'story' ? 'story' : post.type === 'reel' ? 'reel' : 'feed'
    setPopupPost(post)
    setPopupType(type)
  }
  const closePopup = () => {
    setPopupPost(null)
    setPopupType(null)
  }

  const handleEditFromPopup = (post) => {
    closePopup()
    onEditPost(post)
  }
  const handleDeleteFromPopup = (id) => {
    closePopup()
    onDeletePost(id)
  }

  // ── Feed column (shared between mobile & desktop)
  const cardStyle = isMobile
    ? { background: '#fff', borderRadius: 0, border: 'none', overflow: 'hidden', borderBottom: `6px solid ${FB_BG}`, marginBottom: 0 }
    : { background: '#fff', borderRadius: 10, border: `1px solid ${FB_BORDER}`, overflow: 'hidden', marginBottom: 12 }

  const feedWrap = isMobile
    ? { width: '100%' }
    : { width: '100%', maxWidth: 680, margin: '0 auto', padding: isSmallScreen ? '12px 12px 0' : '16px 16px 0', boxSizing: 'border-box' }

  const FeedColumn = (
    <div style={feedWrap}>

      {/* Stories */}
      <div style={{ ...cardStyle, marginBottom: isMobile ? 0 : 12, borderBottom: isMobile ? `6px solid ${FB_BG}` : undefined, padding: isMobile ? '10px 0 8px' : '12px 0 10px' }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 12px 2px', scrollbarWidth: 'none', alignItems: 'flex-start' }}>
          <StoryCreateCard isMobile={isMobile} onCreateStory={() => onCreatePostType?.('story')} />
          {storyPosts.map(post => (
            <StoryCard key={post.id} post={post} onEditPost={onEditPost} onDeletePost={onDeletePost} onOpen={openPopup} />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div style={{ background: '#fff', borderRadius: isMobile ? 0 : 10, border: `1px solid ${FB_BORDER}`, padding: '48px 24px', textAlign: 'center', color: FB_SECONDARY }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📭</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: FB_TEXT, marginBottom: 8 }}>Aucun post dans cet onglet</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>Créez un post puis gérez-le ici.</div>
        </div>
      )}

      {/* Feed posts */}
      {feedPosts.map((post, index) => (
        <div key={post.id}>
          <div style={cardStyle}>
            <FeedPostCard post={post} deviceView={deviceView} compact onEditPost={onEditPost} onDeletePost={onDeletePost} onOpen={openPopup} />
          </div>
        </div>
      ))}

      {/* Reels */}
      {reelPosts.length > 0 && (
        <div style={{ ...cardStyle, padding: '14px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: FB_TEXT }}>Reels</span>
            <button style={{ fontSize: 13, color: FB_BLUE, fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>Voir tout</button>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 14px 4px', scrollbarWidth: 'none' }}>
            {reelPosts.map(post => (
              <ReelCard key={post.id} post={post} onEditPost={onEditPost} onDeletePost={onDeletePost} onOpen={openPopup} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', background: FB_BG, minHeight: '100vh' }}>

      {/* ── Popups — rendered via Portal into document.body so that
           position:fixed is always relative to the TRUE viewport,
           not broken by any ancestor transform/filter/overflow ── */}
      <ModalPortal isOpen={!!popupPost}>
        {popupPost && popupType === 'story' && (
          <StoryViewerPopup
            post={popupPost}
            allStories={storyPosts.length > 0 ? storyPosts : [popupPost]}
            onClose={closePopup}
            onEditPost={handleEditFromPopup}
            onDeletePost={handleDeleteFromPopup}
          />
        )}
        {popupPost && popupType === 'reel' && (
          <ReelViewerPopup
            post={popupPost}
            onClose={closePopup}
            onEditPost={handleEditFromPopup}
            onDeletePost={handleDeleteFromPopup}
          />
        )}
        {popupPost && popupType === 'feed' && (
          <FeedPostPopup
            post={popupPost}
            onClose={closePopup}
            onEditPost={handleEditFromPopup}
            onDeletePost={handleDeleteFromPopup}
            deviceView={deviceView}
          />
        )}
      </ModalPortal>

      {/* ── Controls bar — always full-width, never shifts ── */}
      <div style={{ width: '100%', background: '#fff', borderBottom: `1px solid ${FB_BORDER}`, padding: fbPhoneInspector ? '10px 12px' : '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: fbPhoneInspector ? 'stretch' : 'center', gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ fontSize: fbPhoneInspector ? 18 : 20, fontWeight: 800, color: FB_TEXT }}>
          {activeTab === 'Publiés' ? 'Fil d\'actualité' : activeTab}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: fbPhoneInspector ? '100%' : 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 999,
              background: FB_BG,
              padding: '4px',
              gap: 2,
              flexWrap: fbPhoneInspector ? 'nowrap' : 'wrap',
              width: fbPhoneInspector ? '100%' : 'auto',
              maxWidth: '100%',
              ...(fbPhoneInspector ? { overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' } : {}),
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 999,
                  padding: fbPhoneInspector ? '7px 12px' : '7px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: tab === activeTab ? '#fff' : 'transparent',
                  color: tab === activeTab ? FB_TEXT : FB_SECONDARY,
                  boxShadow: tab === activeTab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: fbPhoneInspector ? '100%' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: 999, background: FB_BG, padding: '4px', gap: 2, width: fbPhoneInspector ? '100%' : 'auto', minWidth: 0 }}>
              {DEVICE_VIEWS.map(view => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setDeviceView(view)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    background: view === deviceView ? '#fff' : 'transparent',
                    color: view === deviceView ? FB_TEXT : FB_SECONDARY,
                    boxShadow: view === deviceView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                    flex: 1,
                  }}
                >
                  {view === 'Mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
                  {view}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body — full width on both mobile & desktop ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: FB_BG, padding: showMobileShell ? '24px 16px 32px' : 0 }}>
        <div style={{ width: '100%', maxWidth: pageContentMaxWidth }}>
          {showMobileShell ? (
            <div style={{ borderRadius: 28, overflow: 'hidden', border: `1px solid ${FB_BORDER}`, boxShadow: '0 22px 70px rgba(15,23,42,0.16)', background: '#fff' }}>
              {FeedColumn}
            </div>
          ) : (
            FeedColumn
          )}
        </div>
      </div>


    </div>
  )
}
