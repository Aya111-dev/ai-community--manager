import { ArrowLeft, Plus, Calendar } from 'lucide-react'

const postTypeLabels = {
  image: 'Image',
  video: 'Vidéo',
  carousel: 'Carousel',
  reel: 'Reel',
  story: 'Story',
}

export default function Header({ view, onBack, onCreatePost, selectedPostType }) {
  const isForm = view === 'form'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {/* Facebook badge */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: isForm ? '#1877F2' : '#fff',
          color: isForm ? '#fff' : '#1877F2',
          border: isForm ? 'none' : '1.5px solid #e5e7eb',
          borderRadius: 999,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'default',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isForm ? '#fff' : '#1877F2'}>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>

        {isForm && (
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#6b7280', fontSize: 14, fontWeight: 500,
              padding: '6px 10px', borderRadius: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={16} />
            Retourner
          </button>
        )}

        {/* Platform tabs - only when not in form */}
        {!isForm && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { name: 'Instagram', color: '#E1306C', icon: instagramIcon },
              { name: 'X', color: '#000', icon: xIcon },
              { name: 'LinkedIn', color: '#0A66C2', icon: linkedinIcon },
              { name: 'TikTok', color: '#000', icon: tiktokIcon },
            ].map(platform => (
              <button key={platform.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1.5px solid #e5e7eb', borderRadius: 999,
                padding: '7px 14px', fontSize: 14, fontWeight: 500,
                color: '#374151', background: '#fff',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d1d5db'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                {platform.icon()}
                {platform.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 7,
          border: '1.5px solid #f9a8d4',
          background: '#fdf2f8',
          color: '#ec4899',
          borderRadius: 999,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
        }}>
          <Calendar size={15} strokeWidth={2} />
          Stratégie
        </button>

        <button
          onClick={onCreatePost}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#7c3aed',
            color: '#fff',
            borderRadius: 999,
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          <Plus size={16} strokeWidth={2.5} />
          Créer un post
        </button>
      </div>
    </div>
  )
}

function instagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F58529"/>
          <stop offset="0.5" stopColor="#DD2A7B"/>
          <stop offset="1" stopColor="#8134AF"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1" fill="#DD2A7B"/>
    </svg>
  )
}

function xIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#000">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L2.25 2.25h7.022l4.26 5.635L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  )
}

function linkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function tiktokIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#000">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
    </svg>
  )
}
