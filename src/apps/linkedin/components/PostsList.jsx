import { Monitor, Smartphone } from 'lucide-react'

import { TABS, DEVICE_VIEWS, CARD_BORDER, TEXT, SUBTLE, LI_PHONE_INSPECTOR_MAX } from './postsList/constants'
import { useViewportWidth, normalizeTab } from './postsList/utils'
import { PostCard } from './postsList/PostComponents'

export default function LinkedinPostsList({
  posts,
  activeTab,
  setActiveTab,
  deviceView,
  setDeviceView,
  onEditPost,
  onDeletePost,
}) {
  const normalizedActiveTab = normalizeTab(activeTab)
  const statusMap = { Publies: 'published', Planifies: 'scheduled', Brouillons: 'draft' }
  const filtered = posts.filter(post => post.status === statusMap[normalizedActiveTab])

  const viewportWidth = useViewportWidth()
  const isMobile = deviceView === 'Mobile'
  const isSmallScreen = viewportWidth < 768
  const liPhoneInspector = viewportWidth <= LI_PHONE_INSPECTOR_MAX
  const showMobileShell = isMobile && !isSmallScreen
  const contentMaxWidth = isMobile ? 430 : 1120

  const cardStyle = isMobile
    ? { background: '#fff', borderRadius: 0, border: 'none', overflow: 'hidden', borderBottom: `6px solid #fff`, marginBottom: 0 }
    : { background: '#fff', borderRadius: 10, border: `1px solid ${CARD_BORDER}`, overflow: 'hidden', marginBottom: 12 }

  const feedWrap = isMobile
    ? { width: '100%' }
    : { width: '100%', maxWidth: 680, margin: '0 auto', padding: isSmallScreen ? '12px 12px 0' : '16px 16px 0', boxSizing: 'border-box' }

  const FeedColumn = (
    <div style={feedWrap}>
      {filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: isMobile ? 0 : 10, border: `1px solid ${CARD_BORDER}`, padding: '48px 24px', textAlign: 'center', color: SUBTLE }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📭</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
            {normalizedActiveTab === 'Publies' ? 'Aucun post publié'
              : normalizedActiveTab === 'Planifies' ? 'Aucun post planifié'
              : 'Aucun brouillon'}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>Créez un post et il apparaîtra ici.</div>
        </div>
      )}

      {filtered.map((post) => (
        <div key={post.id} style={cardStyle}>
          <PostCard
            post={post}
            deviceView={deviceView}
            onEditPost={onEditPost}
            onDeletePost={onDeletePost}
          />
        </div>
      ))}
    </div>
  )

  const MobileShellWrapped = (
    <div style={{ borderRadius: 28, overflow: 'hidden', border: `1px solid ${CARD_BORDER}`, boxShadow: '0 22px 70px rgba(15,23,42,0.16)', background: '#fff' }}>
      <div>{FeedColumn}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', background: '#fff', minHeight: '100vh' }}>

      {/* Controls bar */}
      <div style={{
        width: '100%', background: '#fff', borderBottom: `1px solid ${CARD_BORDER}`,
        padding: isSmallScreen ? '10px 12px' : '10px 16px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: isSmallScreen ? 'stretch' : 'center',
        gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 40,
      }}>

        {/* ✅ "LinkedIn Feed" → "Fil d'actualité" */}
        <div style={{ fontSize: isSmallScreen ? 18 : 20, fontWeight: 800, color: TEXT }}>
          {normalizedActiveTab === 'Publies' ? "Fil d'actualité" : normalizedActiveTab}
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          width: liPhoneInspector ? '100%' : (isSmallScreen ? '100%' : 'auto'),
          ...(liPhoneInspector ? { flexDirection: 'column', justifyContent: 'center', alignItems: 'center' } : {}),
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              background: '#f1f5f9',
              padding: '4px',
              gap: 2,
              flexWrap: liPhoneInspector ? 'nowrap' : 'wrap',
              width: liPhoneInspector ? 'fit-content' : (isSmallScreen ? '100%' : 'auto'),
              maxWidth: '100%',
              ...(liPhoneInspector ? {
                marginLeft: 'auto',
                marginRight: 'auto',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
              } : {}),
            }}
          >
            {TABS.map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                style={{
                  cursor: 'pointer', borderRadius: 999, padding: liPhoneInspector ? '7px 12px' : '7px 16px', fontSize: 13, fontWeight: 600,
                  border: 'none', transition: 'all 0.15s', flex: liPhoneInspector ? '0 0 auto' : (isSmallScreen ? 1 : '0 0 auto'),
                  whiteSpace: 'nowrap',
                  background: tab === normalizedActiveTab ? '#fff' : 'transparent',
                  color: tab === normalizedActiveTab ? TEXT : SUBTLE,
                  boxShadow: tab === normalizedActiveTab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            width: liPhoneInspector ? '100%' : (isSmallScreen ? '100%' : 'auto'),
            ...(liPhoneInspector ? { justifyContent: 'center' } : {}),
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              background: '#f1f5f9',
              padding: '4px',
              gap: 2,
              width: liPhoneInspector ? 'fit-content' : (isSmallScreen ? '100%' : 'auto'),
              maxWidth: '100%',
              ...(liPhoneInspector ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
            }}>
              {DEVICE_VIEWS.map(view => (
                <button key={view} type="button" onClick={() => setDeviceView(view)}
                  style={{
                    cursor: 'pointer', borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 600,
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, transition: 'all 0.15s', flex: 1,
                    background: view === deviceView ? '#fff' : 'transparent',
                    color: view === deviceView ? TEXT : SUBTLE,
                    boxShadow: view === deviceView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {view === 'Mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}{view}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ White page body */}
      <div style={{
        width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: '#fff',
        padding: showMobileShell ? '24px 16px 32px' : 0,
      }}>
        <div style={{ width: '100%', maxWidth: contentMaxWidth }}>
          {showMobileShell ? MobileShellWrapped : FeedColumn}
        </div>
      </div>

    </div>
  )
}