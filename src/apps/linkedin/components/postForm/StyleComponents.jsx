import { Sparkles, Type } from 'lucide-react'
import { FONT_OPTIONS } from './constants'

export function StyleSlider({ label, value, min, max, step = 1, suffix = '', onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{label}</span>
        <span>{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        style={{ accentColor: '#0a66c2' }}
      />
    </label>
  )
}

export function LinkedinStylePanel({ cfg, styleSettings, updateStyle, caption, hashtags, articleLink, media }) {
  const Icon = cfg.icon
  return (
    <aside style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 18,
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      position: 'sticky',
      top: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sparkles size={18} color="#0a66c2" />
        <div>
          <div style={{ fontWeight: 700, color: '#111827' }}>Design flexible</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Ajustez la forme du post avant de le publier.</div>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police</span>
        <div style={{ position: 'relative' }}>
          <Type size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
          <select
            value={styleSettings.fontFamily}
            onChange={e => updateStyle('fontFamily', e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: 12,
              padding: '10px 14px 10px 36px',
              background: '#fff',
              color: '#111827',
            }}
          >
            {FONT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </label>

      <StyleSlider
        label="Largeur du post"
        value={styleSettings.cardWidth}
        min={65}
        max={100}
        suffix="%"
        onChange={e => updateStyle('cardWidth', Number(e.target.value))}
      />

      <StyleSlider
        label="Hauteur du media"
        value={styleSettings.mediaHeight}
        min={220}
        max={520}
        suffix=" px"
        onChange={e => updateStyle('mediaHeight', Number(e.target.value))}
      />

      <div style={{
        padding: 16,
        borderRadius: 18,
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
      }}>
        <div style={{ fontWeight: 700, color: '#111827', marginBottom: 12 }}>Apercu en direct</div>
        <div style={{
          width: `${styleSettings.cardWidth}%`,
          minWidth: 220,
          maxWidth: '100%',
          margin: '0 auto',
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a66c2',
              fontWeight: 800,
              flexShrink: 0,
            }}>U</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Votre profil</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{cfg.label}</div>
            </div>
          </div>

          {caption && (
            <div style={{ padding: '0 16px 4px', fontFamily: styleSettings.fontFamily, color: '#334155', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {caption}
            </div>
          )}

          {hashtags && (
            <div style={{ padding: '0 16px 12px', color: '#0a66c2', fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>
              {hashtags}
            </div>
          )}

          {articleLink && (
            <div style={{ margin: '0 16px 12px', border: '1px solid #dbe2ea', borderRadius: 16, padding: 12, background: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Article</div>
              <div style={{ fontFamily: styleSettings.fontFamily, color: '#0a66c2', fontWeight: 700, wordBreak: 'break-all' }}>{articleLink}</div>
            </div>
          )}

          {media?.url && (
            <div style={{ height: styleSettings.mediaHeight, background: '#cbd5e1' }}>
              {cfg.isVideo ? (
                <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted controls />
              ) : (
                <img src={media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}