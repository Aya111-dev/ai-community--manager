import { X, Image, Video, LayoutGrid, Film, Camera } from 'lucide-react'

const POST_TYPES = [
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Vidéo', icon: Video },
  { id: 'carousel', label: 'Carousel', icon: LayoutGrid },
  { id: 'reel', label: 'Reel', icon: Film },
  { id: 'story', label: 'Story', icon: Camera },
]

export default function PostTypeSelector({ onSelectType, onClose }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '20px 24px 28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#ede9fe', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#7c3aed', fontSize: 14, fontWeight: 700,
          }}>U</div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
            Que souhaitez-vous publier&nbsp;?
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            color: '#9ca3af', borderRadius: 8, padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Post type grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {POST_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelectType(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '24px 16px',
              background: '#f9fafb',
              border: '1.5px solid #e5e7eb',
              borderRadius: 14,
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.15s',
              cursor: 'pointer',
              gridColumn: id === 'story' ? 'span 1' : 'span 1',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f5f3ff'
              e.currentTarget.style.borderColor = '#c4b5fd'
              e.currentTarget.style.color = '#7c3aed'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.color = '#374151'
            }}
          >
            <Icon size={26} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
