import { useRef, useState } from 'react'
import { Image as ImageIcon, Video, Plus } from 'lucide-react'
import { ImageEditButtons, EditedImage, useImageEdits } from '../../../../components/ImageEditor'

const mediaSlotStyle = (aspect) => ({
  aspectRatio: aspect,
  background: '#f3f4f6',
  border: '1.5px dashed #d1d5db',
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  color: '#9ca3af',
  fontSize: 12,
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 0.15s, background 0.15s',
})

// FIX: check both item.type === 'video' and MIME type via file
const isVideoMedia = (media) => {
  if (!media) return false
  if (media.type === 'video') return true
  if (typeof media.file?.type === 'string' && media.file.type.startsWith('video/')) return true
  return false
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function StoryCanvas({ cfg, mediaItem, styleSettings, updateStyle, fileRefs, handleFileChange, removeMedia }) {
  const textDragRef = useRef(null)
  // FIX: use url (blob URL set on upload) — previewUrl is not set by handleFileChange
  const mediaSrc = mediaItem?.url || mediaItem?.previewUrl || ''
  const overlayText = typeof styleSettings.overlayText === 'string' ? styleSettings.overlayText.trim() : ''

  const handleTextPointerDown = (event) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    textDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startTextX: styleSettings.overlayTextX ?? 50,
      startTextY: styleSettings.overlayTextY ?? 84,
      width: rect?.width || 1,
      height: rect?.height || 1,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.stopPropagation()
  }

  const handleTextPointerMove = (event) => {
    const drag = textDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const nextTextX = clamp(drag.startTextX + ((event.clientX - drag.startX) / drag.width) * 100, 6, 94)
    const nextTextY = clamp(drag.startTextY + ((event.clientY - drag.startY) / drag.height) * 100, 8, 92)

    updateStyle('overlayTextX', Number(nextTextX.toFixed(1)))
    updateStyle('overlayTextY', Number(nextTextY.toFixed(1)))
  }

  const handleTextPointerUp = (event) => {
    if (textDragRef.current?.pointerId === event.pointerId) {
      textDragRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  return (
    <div
      style={{
        ...mediaSlotStyle(cfg.mediaAspect),
        maxHeight: 340,
        width: 180,
        background: '#050505',
        border: mediaSrc ? '1px solid rgba(15,23,42,0.12)' : '1.5px dashed #d1d5db',
      }}
      onClick={() => !mediaSrc && fileRefs.current[0]?.click()}
    >
      {mediaSrc ? (
        <>
          {/* FIX: use isVideoMedia() to properly detect video from newly uploaded files */}
          {isVideoMedia(mediaItem) ? (
            <video
              src={mediaSrc}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, background: '#000' }}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={mediaSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          )}
          {overlayText && (
            <div
              onPointerDown={handleTextPointerDown}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
              onPointerCancel={handleTextPointerUp}
              style={{
                position: 'absolute',
                left: `${styleSettings.overlayTextX ?? 50}%`,
                top: `${styleSettings.overlayTextY ?? 84}%`,
                transform: 'translate(-50%, -50%)',
                color: styleSettings.overlayTextColor ?? '#fff',
                fontFamily: styleSettings.overlayTextFontFamily ?? styleSettings.fontFamily,
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1.2,
                textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                textAlign: 'center',
                maxWidth: '85%',
                zIndex: 3,
                whiteSpace: 'pre-wrap',
                cursor: 'grab',
              }}
              title="Glissez pour déplacer le texte"
            >
              {overlayText}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeMedia(0) }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 4,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            ×
          </button>
        </>
      ) : (
        <>
          <ImageIcon size={32} color="#d1d5db" />
          <span style={{ fontSize: 13, color: '#9ca3af' }}>{cfg.mediaLabel}</span>
        </>
      )}
      {/* FIX: story accepts both image and video */}
      <input
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        ref={el => { fileRefs.current[0] = el }}
        onChange={e => handleFileChange(0, e)}
      />
    </div>
  )
}

export function MediaUploader({ postType, cfg, mediaFiles, allMedia, styleSettings, updateStyle, fileRefs, handleFileChange, removeMedia, addExtraSlot, isVertical, getEdit, setEdit }) {
  if (postType === 'story') {
    return (
      <StoryCanvas
        cfg={cfg}
        mediaItem={mediaFiles[0]}
        styleSettings={styleSettings}
        updateStyle={updateStyle}
        fileRefs={fileRefs}
        handleFileChange={handleFileChange}
        removeMedia={removeMedia}
      />
    )
  }

  return (
    <>
      {postType === 'carousel' ? (
        <div style={{
          border: '1.5px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          {allMedia.map((m, idx) => (
            <div
              key={idx}
              style={{ ...mediaSlotStyle('1/1'), width: 'calc(25% - 8px)', flexShrink: 0 }}
              onClick={() => !m && fileRefs.current[idx]?.click()}
            >
              {m ? (
                <>
                  {/* FIX: properly render video vs image in carousel slots */}
                  {isVideoMedia(m)
                    ? <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, background: '#0f172a' }} muted playsInline autoPlay loop preload="metadata" />
                    : <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMedia(idx) }}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 2,
                      background: 'rgba(0,0,0,0.5)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon size={22} color="#d1d5db" />
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Ajouter un média</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                ref={el => { fileRefs.current[idx] = el }}
                onChange={e => handleFileChange(idx, e)}
              />
            </div>
          ))}
          <div
            onClick={addExtraSlot}
            style={{
              ...mediaSlotStyle('1/1'),
              width: 'calc(25% - 8px)',
              flexShrink: 0,
              background: '#f5f3ff',
              border: '1.5px dashed #c4b5fd',
              color: '#7c3aed',
              cursor: 'pointer',
            }}
          >
            <Plus size={22} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Ajouter</span>
          </div>
        </div>
      ) : (
        <div
          style={{ ...mediaSlotStyle(cfg.mediaAspect), maxHeight: isVertical ? 340 : 260, width: isVertical ? 180 : '100%' }}
          onClick={() => !mediaFiles[0] && fileRefs.current[0]?.click()}
          onMouseEnter={e => {
            if (!mediaFiles[0]) { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.background = '#f5f3ff' }
            else { const b = e.currentTarget.querySelector('.img-edit-btns'); if (b) b.style.opacity = '1' }
          }}
          onMouseLeave={e => {
            if (!mediaFiles[0]) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f3f4f6' }
            else { const b = e.currentTarget.querySelector('.img-edit-btns'); if (b) b.style.opacity = '0' }
          }}
        >
          {mediaFiles[0] ? (
            <>
              {isVideoMedia(mediaFiles[0]) ? (
                <video src={mediaFiles[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, background: '#0f172a' }} controls={!isVertical} muted playsInline autoPlay loop={isVertical} preload="metadata" />
              ) : (
                <EditedImage src={mediaFiles[0].url} edit={getEdit(0)} />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeMedia(0) }}
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
              >×</button>
              <div className="img-edit-btns" style={{ opacity: 0, transition: 'opacity 0.15s' }}>
                <ImageEditButtons idx={0} mediaSrc={mediaFiles[0].url} edit={getEdit(0)} setEdit={setEdit} isVideo={isVideoMedia(mediaFiles[0])} />
              </div>
            </>
          ) : (
            <>
              {cfg.isVideo ? <Video size={32} color="#d1d5db" /> : <ImageIcon size={32} color="#d1d5db" />}
              <span style={{ fontSize: 13, color: '#9ca3af' }}>{cfg.mediaLabel}</span>
            </>
          )}
          <input
            type="file"
            accept={cfg.isVideo ? 'video/*' : 'image/*,video/*'}
            style={{ display: 'none' }}
            ref={el => { fileRefs.current[0] = el }}
            onChange={e => handleFileChange(0, e)}
          />
        </div>
      )}
    </>
  )
}