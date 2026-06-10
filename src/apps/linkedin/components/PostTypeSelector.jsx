import { AlignLeft, BookOpenText, Image, Video, X } from 'lucide-react'

import { useViewportWidth } from './postsList/utils'

const POST_TYPES = [
  { id: 'text', label: 'Text', icon: AlignLeft },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'article', label: 'Article', icon: BookOpenText },
]

/** Sous cette largeur : grille 2×2 au lieu de 4 colonnes (évite les pastilles écrasées). */
const COMPACT_TYPE_GRID_MAX = 640

export default function LinkedinPostTypeSelector({ onSelectType, onClose }) {
  const viewportWidth = useViewportWidth()
  const compactGrid = viewportWidth <= COMPACT_TYPE_GRID_MAX

  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      padding: compactGrid ? '18px 16px 22px' : '22px 24px 28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: compactGrid ? 18 : 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compactGrid ? 10 : 14, flex: 1, minWidth: 0 }}>
          <div style={{
            width: compactGrid ? 44 : 54,
            height: compactGrid ? 44 : 54,
            borderRadius: '50%',
            background: '#ddd6fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6d28d9',
            fontSize: compactGrid ? 16 : 18,
            fontWeight: 700,
            flexShrink: 0,
          }}>U</div>
          <span style={{
            fontSize: compactGrid ? 15 : 18,
            fontWeight: 500,
            color: '#64748b',
            lineHeight: 1.35,
          }}>
            Que souhaitez-vous publier ?
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            color: '#94a3b8',
            borderRadius: 10,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={compactGrid ? 22 : 24} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: compactGrid ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
        gap: compactGrid ? 12 : 16,
      }}>
        {POST_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectType(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compactGrid ? 10 : 12,
              minHeight: compactGrid ? 112 : 106,
              padding: compactGrid ? '20px 12px' : '20px 16px',
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: 22,
              color: '#64748b',
              fontSize: compactGrid ? 15 : 16,
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
            <Icon size={compactGrid ? 26 : 28} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
