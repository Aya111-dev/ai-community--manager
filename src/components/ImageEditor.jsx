import { useRef, useState, useCallback, useEffect } from 'react'
import { Crop, RotateCw, Check, X } from 'lucide-react'

// ─── Shared hook: stores per-image edits (crop + rotation) ───────────────────
export function useImageEdits(count = 1) {
  const [edits, setEdits] = useState(() => Array.from({ length: count }, () => ({ rotation: 0, crop: null })))

  const setEdit = useCallback((idx, patch) => {
    setEdits(prev => {
      const next = [...prev]
      next[idx] = { ...(next[idx] ?? { rotation: 0, crop: null }), ...patch }
      return next
    })
  }, [])

  const getEdit = useCallback((idx) => edits[idx] ?? { rotation: 0, crop: null }, [edits])

  // Grow array if count increases
  useEffect(() => {
    setEdits(prev => {
      if (prev.length >= count) return prev
      return [...prev, ...Array.from({ length: count - prev.length }, () => ({ rotation: 0, crop: null }))]
    })
  }, [count])

  return { edits, setEdit, getEdit }
}

// ─── Applies crop+rotation as CSS on the image container ─────────────────────
export function getImageStyle(edit) {
  if (!edit) return {}
  const { rotation = 0, crop = null } = edit
  const base = { transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s' }
  if (!crop) return base
  // Crop is stored as percentages: { x, y, w, h }
  return {
    ...base,
    objectFit: 'none',
    objectPosition: `-${crop.x}% -${crop.y}%`,
    width: `${(100 / crop.w) * 100}%`,
    height: `${(100 / crop.h) * 100}%`,
    maxWidth: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
  }
}

// ─── Crop overlay UI ─────────────────────────────────────────────────────────
function CropOverlay({ src, rotation, onConfirm, onCancel }) {
  const containerRef = useRef(null)
  const [sel, setSel] = useState({ x: 10, y: 10, w: 80, h: 80 })
  const dragRef = useRef(null)

  const toPercent = useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { px: 0, py: 0 }
    return {
      px: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      py: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }, [])

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    const { px, py } = toPercent(e.clientX, e.clientY)
    dragRef.current = { startX: px, startY: py, mode: 'draw' }
    setSel({ x: px, y: py, w: 0, h: 0 })
  }, [toPercent])

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return
      const { px, py } = toPercent(e.clientX, e.clientY)
      if (d.mode === 'draw') {
        setSel({
          x: Math.min(px, d.startX),
          y: Math.min(py, d.startY),
          w: Math.abs(px - d.startX),
          h: Math.abs(py - d.startY),
        })
      }
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [toPercent])

  const valid = sel.w > 5 && sel.h > 5

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>Sélectionnez la zone à conserver</p>
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        style={{ position: 'relative', maxWidth: '70vw', maxHeight: '65vh', cursor: 'crosshair', userSelect: 'none', overflow: 'hidden', borderRadius: 8 }}
      >
        <img
          src={src}
          alt=""
          style={{ display: 'block', maxWidth: '70vw', maxHeight: '65vh', transform: `rotate(${rotation}deg)`, objectFit: 'contain' }}
          draggable={false}
        />
        {/* Dark overlay outside selection */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
        {/* Selection box */}
        <div style={{
          position: 'absolute',
          left: `${sel.x}%`, top: `${sel.y}%`,
          width: `${sel.w}%`, height: `${sel.h}%`,
          border: '2px solid #fff',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => valid && onConfirm(sel)}
          disabled={!valid}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: valid ? '#6366f1' : '#4b5563', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: valid ? 'pointer' : 'not-allowed' }}
        >
          <Check size={15} /> Confirmer
        </button>
        <button
          onClick={onCancel}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13 }}
        >
          <X size={15} /> Annuler
        </button>
      </div>
    </div>
  )
}

// ─── The edit buttons shown on hover over a media card ───────────────────────
export function ImageEditButtons({ idx, mediaSrc, edit, setEdit, isVideo = false, accentColor = '#6366f1' }) {
  const [cropping, setCropping] = useState(false)

  if (isVideo || !mediaSrc) return null

  return (
    <>
      {/* Crop button */}
      <button
        title="Recadrer"
        onClick={(e) => { e.stopPropagation(); setCropping(true) }}
        style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 5,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          borderRadius: 8, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(4px)',
          border: edit?.crop ? `2px solid ${accentColor}` : '2px solid transparent',
        }}
      >
        <Crop size={13} />
      </button>

      {/* Rotate button */}
      <button
        title="Pivoter 90°"
        onClick={(e) => { e.stopPropagation(); setEdit(idx, { rotation: ((edit?.rotation ?? 0) + 90) % 360 }) }}
        style={{
          position: 'absolute', bottom: 8, left: 44, zIndex: 5,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          borderRadius: 8, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(4px)',
          border: (edit?.rotation ?? 0) !== 0 ? `2px solid ${accentColor}` : '2px solid transparent',
        }}
      >
        <RotateCw size={13} />
      </button>

      {/* Crop reset button */}
      {edit?.crop && (
        <button
          title="Réinitialiser le recadrage"
          onClick={(e) => { e.stopPropagation(); setEdit(idx, { crop: null }) }}
          style={{
            position: 'absolute', bottom: 8, left: 80, zIndex: 5,
            background: 'rgba(239,68,68,0.8)', color: '#fff',
            borderRadius: 8, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={13} />
        </button>
      )}

      {/* Crop overlay modal */}
      {cropping && (
        <CropOverlay
          src={mediaSrc}
          rotation={edit?.rotation ?? 0}
          onConfirm={(crop) => { setEdit(idx, { crop }); setCropping(false) }}
          onCancel={() => setCropping(false)}
        />
      )}
    </>
  )
}

// ─── Wrapper that applies edit transforms to an image ────────────────────────
export function EditedImage({ src, edit, style = {}, alt = '' }) {
  const { rotation = 0, crop = null } = edit ?? {}

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>
      <img
        src={src}
        alt={alt}
        style={{
          position: 'absolute',
          transformOrigin: 'center center',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.2s',
          ...(crop ? {
            // Use clip-path to simulate crop
            width: `${(1 / (crop.w / 100)) * 100}%`,
            height: `${(1 / (crop.h / 100)) * 100}%`,
            left: `${-(crop.x / crop.w) * 100}%`,
            top: `${-(crop.y / crop.h) * 100}%`,
            maxWidth: 'none',
          } : {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }),
        }}
        draggable={false}
      />
    </div>
  )
}