import { Pencil, Trash2 } from 'lucide-react'
import { FB_BORDER, FB_SECONDARY } from './constants'

export function PostActions({ post, onEditPost, onDeletePost, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: light ? 6 : 4, zIndex: 2 }}>
      <button type="button" onClick={e => { e.stopPropagation(); onEditPost(post) }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: light ? 32 : 32, height: light ? 32 : 32, borderRadius: '50%', border: `1px solid ${light ? 'rgba(255,255,255,0.22)' : FB_BORDER}`, background: light ? 'rgba(0,0,0,0.62)' : '#f0f2f5', color: light ? '#fff' : FB_SECONDARY, backdropFilter: light ? 'blur(6px)' : 'none', boxShadow: light ? '0 4px 10px rgba(0,0,0,0.2)' : 'none' }}
        aria-label="Modifier" title="Modifier"><Pencil size={light ? 14 : 13} /></button>
      <button type="button" onClick={e => { e.stopPropagation(); onDeletePost(post.id) }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: light ? 32 : 32, height: light ? 32 : 32, borderRadius: '50%', border: `1px solid ${light ? 'rgba(255,255,255,0.22)' : FB_BORDER}`, background: light ? 'rgba(0,0,0,0.62)' : '#f0f2f5', color: light ? '#fff' : '#94a3b8', backdropFilter: light ? 'blur(6px)' : 'none', boxShadow: light ? '0 4px 10px rgba(0,0,0,0.2)' : 'none' }}
        aria-label="Supprimer" title="Supprimer"><Trash2 size={light ? 14 : 13} /></button>
    </div>
  )
}
