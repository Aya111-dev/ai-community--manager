import { useRef, useState, useEffect, useCallback } from 'react'
import { AlignLeft, AlignCenter, AlignRight, ImagePlus, Type } from 'lucide-react'

const FONT_OPTIONS = [
  { value: 'Inter, sans-serif',      label: 'Inter'      },
  { value: 'Poppins, sans-serif',    label: 'Poppins'    },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Georgia, serif',         label: 'Georgia'    },
  { value: 'Arial, sans-serif',      label: 'Arial'      },
]

const GRADIENTS = [
  'linear-gradient(145deg,#c026d3,#e11d48)',
  'linear-gradient(145deg,#7c3aed,#2563eb)',
  'linear-gradient(145deg,#0ea5e9,#10b981)',
  'linear-gradient(145deg,#f59e0b,#ef4444)',
  'linear-gradient(145deg,#111827,#374151)',
  'linear-gradient(145deg,#1e1b4b,#312e81)',
  'linear-gradient(145deg,#064e3b,#065f46)',
  'linear-gradient(145deg,#831843,#9f1239)',
  '#ffffff',
  '#000000',
]

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// ─── read-only renderer ───────────────────────────────────────────────────────
export function getTextCanvasStyle(styleSettings = {}) {
  return {
    enabled:    Boolean(styleSettings.textCanvasEnabled),
    text:       styleSettings.textCanvasText ?? '',
    fontFamily: styleSettings.textCanvasFontFamily ?? 'Inter, sans-serif',
    fontSize:   clamp(styleSettings.textCanvasFontSize ?? 20, 10, 56),
    color:      styleSettings.textCanvasColor ?? '#ffffff',
    fontWeight: styleSettings.textCanvasBold ? 800 : 500,
    x:          styleSettings.textCanvasX ?? 50,
    y:          styleSettings.textCanvasY ?? 50,
    align:      styleSettings.textCanvasAlign ?? 'center',
  }
}

export function renderTextCanvas(textCanvas) {
  if (!textCanvas?.enabled || !textCanvas?.text?.trim()) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      <div style={{
        position: 'absolute',
        left: `${textCanvas.x ?? 50}%`, top: `${textCanvas.y ?? 50}%`,
        transform: 'translate(-50%,-50%)',
        color: textCanvas.color, fontFamily: textCanvas.fontFamily,
        fontSize: textCanvas.fontSize, fontWeight: textCanvas.fontWeight,
        textAlign: textCanvas.align, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxWidth: '80%', textShadow: '0 1px 4px rgba(0,0,0,0.5)', direction: 'ltr',
      }}>
        {textCanvas.text}
      </div>
    </div>
  )
}

// ─── Gradient picker — cycles through gradients on each click ────────────────
function GradientPicker({ value, onChange }) {
  const current = value ?? GRADIENTS[0]
  const idx = GRADIENTS.indexOf(current)

  return (
    <button
      type="button"
      onClick={() => onChange(GRADIENTS[(idx + 1) % GRADIENTS.length])}
      title="Changer le fond"
      style={{
        width: 28, height: 28, borderRadius: '50%',
        background: current,
        border: '2px solid rgba(255,255,255,0.3)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
        cursor: 'pointer', flexShrink: 0,
      }}
    />
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
export function StoryCanvas({ styleSettings, updateStyle, mediaUrl, mediaKind, onMediaUpload, editing, setEditing, textDivRef, fileRef }) {
  const tc        = getTextCanvasStyle(styleSettings)
  const canvasRef = useRef(null)
  const dragState = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Only sync DOM from state when editing STARTS (to seed initial text), never during typing
  useEffect(() => {
    if (editing && textDivRef?.current) {
      textDivRef.current.textContent = styleSettings.textCanvasText ?? ''
      textDivRef.current.focus()
      const range = document.createRange()
      const sel   = window.getSelection()
      range.selectNodeContents(textDivRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing]) // ← intentionally NOT depending on styleSettings.textCanvasText

  const onPointerDown = useCallback((e) => {
    if (!tc.enabled || editing) return
    e.preventDefault(); e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: tc.x, origY: tc.y, rect }
    setDragging(true)
  }, [tc.enabled, tc.x, tc.y, editing])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const d = dragState.current; if (!d) return
      updateStyle({
        textCanvasX: clamp(d.origX + ((e.clientX - d.startX) / d.rect.width) * 100, 5, 95),
        textCanvasY: clamp(d.origY + ((e.clientY - d.startY) / d.rect.height) * 100, 5, 95),
      })
    }
    const onUp = () => { dragState.current = null; setDragging(false) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragging, updateStyle])

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const url  = URL.createObjectURL(file)
    const type = file.type.startsWith('video') ? 'video' : 'image'
    onMediaUpload?.(file, url, type)
    e.target.value = ''
  }

  const bgStyle = !mediaUrl
    ? { background: styleSettings.storyBackground ?? GRADIENTS[0] }
    : {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div ref={canvasRef}
        onClick={() => { if (tc.enabled && !editing) setEditing(true) }}
        style={{
          position: 'relative', aspectRatio: '9/16', width: '100%',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          cursor: tc.enabled && !editing ? 'pointer' : 'default',
          userSelect: 'none', ...bgStyle,
        }}
      >
        {mediaUrl && (
          mediaKind === 'video'
            ? <video src={mediaUrl} muted autoPlay loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={mediaUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {editing && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)', zIndex: 1, pointerEvents: 'none' }} />}

        {tc.enabled && (
          <div onPointerDown={onPointerDown}
            style={{ position: 'absolute', left: `${tc.x}%`, top: `${tc.y}%`, transform: 'translate(-50%,-50%)', zIndex: 2, touchAction: 'none', cursor: editing ? 'text' : 'grab' }}
          >
            <div
              ref={textDivRef}
              contentEditable={editing ? 'true' : 'false'}
              suppressContentEditableWarning
              onPointerDown={e => { if (editing) e.stopPropagation() }}
              onBlur={e => {
                const text = e.currentTarget.textContent?.trim() ?? ''
                if (!text) {
                  updateStyle({ textCanvasText: '', textCanvasEnabled: false })
                } else {
                  updateStyle('textCanvasText', text)
                }
                setEditing(false)
              }}
              style={{
                color: tc.color, fontFamily: tc.fontFamily, fontSize: tc.fontSize, fontWeight: tc.fontWeight,
                textAlign: tc.align, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxWidth: 130, minWidth: 24, outline: 'none', padding: '2px 5px', borderRadius: 4,
                background: editing ? 'rgba(0,0,0,0.22)' : 'transparent',
                border: editing ? '1.5px dashed rgba(255,255,255,0.4)' : '1.5px dashed transparent',
                caretColor: tc.color, textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                direction: 'ltr', unicodeBidi: 'plaintext',
              }}
            />
          </div>
        )}

        {!tc.enabled && !mediaUrl && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', padding: '0 20px' }}>
              Choisissez un fond ou ajoutez du texte →
            </span>
          </div>
        )}
      </div>

      <button type="button" onClick={() => fileRef?.current?.click()}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f3f4f6', color: '#374151', borderRadius: 10, padding: '8px 0', fontWeight: 600, fontSize: 12, border: '1px solid #e5e7eb', width: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6' }}
      >
        <ImagePlus size={13} />
        {mediaUrl ? 'Changer le média' : 'Ajouter un média'}
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// ─── Controls (right slim panel) ─────────────────────────────────────────────
export function StoryControls({ styleSettings, updateStyle, editing, setEditing, onAddText, onRemoveText }) {
  const tc = getTextCanvasStyle(styleSettings)
  const Divider = () => <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '2px 0' }} />

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      background: 'rgba(10,10,10,0.88)',
      borderRadius: 14, padding: '10px 8px',
      width: 40, flexShrink: 0,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      height: '100%', overflowY: 'auto',
    }}>

      {/* Gradient picker — single swatch that opens popover */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GradientPicker
          value={styleSettings.storyBackground ?? GRADIENTS[0]}
          onChange={v => updateStyle('storyBackground', v)}
        />
      </div>

      <Divider />

      {tc.enabled ? (
        <>
          {/* font */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <select value={tc.fontFamily} onChange={e => updateStyle('textCanvasFontFamily', e.target.value)} title="Police"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 6, fontSize: 11, outline: 'none', cursor: 'pointer', padding: '4px 2px', width: 34, height: 80, textAlign: 'center' }}
            >
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value} style={{ color: '#111', background: '#fff', writingMode: 'horizontal-tb' }}>{f.label}</option>)}
            </select>
          </div>

          <Divider />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>Aa</span>
            <input type="range" min="10" max="48" value={tc.fontSize}
              onChange={e => updateStyle('textCanvasFontSize', Number(e.target.value))}
              style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 80, accentColor: '#a78bfa', cursor: 'pointer' }}
            />
            <span style={{ color: '#fff', fontSize: 9 }}>{tc.fontSize}</span>
          </div>

          <Divider />

          <button type="button" onClick={() => updateStyle('textCanvasBold', !styleSettings.textCanvasBold)} title="Gras"
            style={{ color: styleSettings.textCanvasBold ? '#a78bfa' : '#fff', background: styleSettings.textCanvasBold ? 'rgba(167,139,250,0.15)' : 'transparent', fontWeight: 900, fontSize: 14, padding: '6px 0', borderRadius: 7, lineHeight: 1, border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
          >B</button>

          {[{ val: 'left', Icon: AlignLeft }, { val: 'center', Icon: AlignCenter }, { val: 'right', Icon: AlignRight }].map(({ val, Icon }) => (
            <button key={val} type="button" onClick={() => updateStyle('textCanvasAlign', val)} title={val}
              style={{ color: tc.align === val ? '#a78bfa' : '#6b7280', background: tc.align === val ? 'rgba(167,139,250,0.15)' : 'transparent', padding: '6px 0', borderRadius: 7, display: 'flex', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', width: '100%' }}
            ><Icon size={13} /></button>
          ))}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'center' }} title="Couleur du texte">
            <div style={{ width: 23, height: 23, borderRadius: '50%', background: tc.color, border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 0 0 2px #a78bfa', cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <input type="color" value={tc.color} onChange={e => updateStyle('textCanvasColor', e.target.value)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', padding: 0, border: 'none' }}
              />
            </div>
          </div>

          <Divider />

          <button type="button" onClick={onRemoveText} title="Supprimer le texte"
            style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)', padding: '7px 0', borderRadius: 7, display: 'flex', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.2)', width: '100%' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </>
      ) : (
        <button type="button" onClick={onAddText} title="Ajouter du texte"
          style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '10px 0', borderRadius: 10, display: 'flex', justifyContent: 'center', border: '1px solid rgba(167,139,250,0.2)', width: '100%' }}
        ><Type size={14} /></button>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function TextCanvasEditor({
  styleSettings, updateStyle, mediaUrl, mediaKind, onMediaUpload,
  renderControlsOnly,
  editing: editingProp, setEditing: setEditingProp,
  textDivRef: textDivRefProp, fileRef: fileRefProp,
  onAddText, onRemoveText,
}) {
  const _textDivRef = useRef(null)
  const _fileRef    = useRef(null)
  const [_editing, _setEditing] = useState(false)
  const editing    = editingProp    !== undefined ? editingProp    : _editing
  const setEditing = setEditingProp !== undefined ? setEditingProp : _setEditing
  const textDivRef = textDivRefProp !== undefined ? textDivRefProp : _textDivRef
  const fileRef    = fileRefProp    !== undefined ? fileRefProp    : _fileRef

  if (renderControlsOnly) {
    return (
      <StoryControls
        styleSettings={styleSettings} updateStyle={updateStyle}
        editing={editing} setEditing={setEditing}
        onAddText={onAddText} onRemoveText={onRemoveText}
      />
    )
  }

  return (
    <StoryCanvas
      styleSettings={styleSettings} updateStyle={updateStyle}
      mediaUrl={mediaUrl} mediaKind={mediaKind}
      onMediaUpload={onMediaUpload}
      editing={editing} setEditing={setEditing}
      textDivRef={textDivRef} fileRef={fileRef}
    />
  )
}