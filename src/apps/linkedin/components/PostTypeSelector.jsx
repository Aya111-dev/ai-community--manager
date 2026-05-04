import { AlignLeft, BookOpenText, Image, Video, X } from 'lucide-react'

const POST_TYPES = [
  { id: 'text', label: 'Text', icon: AlignLeft },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'article', label: 'Article', icon: BookOpenText },
]

export default function LinkedinPostTypeSelector({ onSelectType, onClose }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      padding: '22px 24px 28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: '#ddd6fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6d28d9',
            fontSize: 18,
            fontWeight: 700,
          }}>U</div>
          <span style={{ fontSize: 18, fontWeight: 500, color: '#64748b' }}>
            Que souhaitez-vous publier ?
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ color: '#94a3b8', borderRadius: 10, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 14,
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
              gap: 12,
              minHeight: 106,
              padding: '18px 14px',
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: 22,
              color: '#64748b',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#93c5fd'
              e.currentTarget.style.background = '#eff6ff'
              e.currentTarget.style.color = '#0a66c2'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <Icon size={28} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
