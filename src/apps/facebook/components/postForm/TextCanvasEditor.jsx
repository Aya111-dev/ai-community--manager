import { Bold, Type } from 'lucide-react'

const BACKGROUND_OPTIONS = [
  '#1877f2',
  '#1f2937',
  '#7c3aed',
  '#ef4444',
  '#f97316',
  '#059669',
  '#0f766e',
  '#db2777',
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function getTextCanvasStyle(styleSettings = {}, mode = 'post') {
  return {
    enabled: Boolean(styleSettings.textCanvasEnabled),
    text: typeof styleSettings.textCanvasText === 'string' ? styleSettings.textCanvasText : 'Commencez a ecrire',
    fontFamily: styleSettings.textCanvasFontFamily ?? styleSettings.fontFamily ?? 'Inter, sans-serif',
    fontSize: clamp(styleSettings.textCanvasFontSize ?? (mode === 'story' ? 54 : 46), 20, 92),
    color: styleSettings.textCanvasColor ?? '#FFFFFF',
    background: styleSettings.textCanvasBackground ?? '#1877f2',
    fontWeight: styleSettings.textCanvasBold ? 800 : 500,
  }
}

export function renderTextCanvas(textCanvas, options = {}) {
  const {
    aspectRatio = '1 / 1',
    minHeight = 320,
    borderRadius = 18,
    fontScale = 1,
  } = options

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        aspectRatio,
        minHeight,
        width: '100%',
        background: textCanvas.background,
        borderRadius,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '88%',
          color: textCanvas.color,
          fontFamily: textCanvas.fontFamily,
          fontSize: textCanvas.fontSize * fontScale,
          fontWeight: textCanvas.fontWeight,
          lineHeight: 1.18,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          margin: 0,
        }}
      >
        {textCanvas.text}
      </div>
    </div>
  )
}

export function TextCanvasEditor({ mode = 'post', styleSettings, updateStyle }) {
  const textCanvas = getTextCanvasStyle(styleSettings, mode)
  const aspectRatio = mode === 'story' ? '9 / 16' : '1 / 1'
  const minHeight = mode === 'story' ? 420 : 320

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texte principal</div>
          <button
            type="button"
            onClick={() => updateStyle('textCanvasBold', !styleSettings.textCanvasBold)}
            style={{
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: styleSettings.textCanvasBold ? '#ede9fe' : '#fff',
              border: styleSettings.textCanvasBold ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
              borderRadius: '50%',
              cursor: 'pointer',
              color: styleSettings.textCanvasBold ? '#6d28d9' : '#111827',
            }}
            title="Gras"
          >
            <Bold size={16} />
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
            aspectRatio,
            minHeight,
            width: '100%',
            background: textCanvas.background,
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={event => updateStyle('textCanvasText', event.currentTarget.textContent ?? '')}
            style={{
              width: '100%',
              maxWidth: '88%',
              color: textCanvas.color,
              fontFamily: textCanvas.fontFamily,
              fontSize: textCanvas.fontSize,
              fontWeight: textCanvas.fontWeight,
              lineHeight: 1.18,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              outline: 'none',
              caretColor: textCanvas.color,
              cursor: 'text',
            }}
          >
            {textCanvas.text}
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police</span>
          <div style={{ position: 'relative' }}>
            <Type size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: 12 }} />
            <select
              value={styleSettings.textCanvasFontFamily ?? styleSettings.fontFamily}
              onChange={e => updateStyle('textCanvasFontFamily', e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 14px 10px 36px', background: '#fff', color: '#111827' }}
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Poppins, sans-serif">Poppins</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="Arial, sans-serif">Arial</option>
            </select>
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taille</span>
          <input
            type="range"
            min="20"
            max="92"
            value={textCanvas.fontSize}
            onChange={e => updateStyle('textCanvasFontSize', Number(e.target.value))}
          />
        </label>

        <div style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fond</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            {BACKGROUND_OPTIONS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => updateStyle('textCanvasBackground', color)}
                style={{
                  height: 34,
                  borderRadius: 10,
                  background: color,
                  border: textCanvas.background === color ? '3px solid #111827' : '1px solid rgba(15,23,42,0.08)',
                  cursor: 'pointer',
                }}
                aria-label={`Background ${color}`}
              />
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Couleur du texte</span>
          <input
            type="color"
            value={textCanvas.color}
            onChange={e => updateStyle('textCanvasColor', e.target.value)}
            style={{ width: 48, height: 34, padding: 0, border: 'none', background: 'transparent' }}
          />
        </label>
      </div>
    </div>
  )
}
