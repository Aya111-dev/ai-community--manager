import { useEffect, useMemo, useRef, useState } from 'react'
import { Crop, Palette, Plus, RefreshCw, StretchHorizontal, Trash2, Type } from 'lucide-react'
import { FONT_OPTIONS } from './constants'
import { StyleSlider } from './StyleSlider'
import { TextCanvasEditor, getTextCanvasStyle, renderTextCanvas } from './TextCanvasEditor'
import { isVertical } from './utils'

const QUICK_TOOLS = [
  { id: 'crop', label: 'Recadrer', icon: Crop },
  { id: 'rotate', label: 'Pivoter', icon: RefreshCw },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const hsvToRgb = (h, s, v) => {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 1)
  const value = clamp(v, 0, 1)
  const chroma = value * saturation
  const segment = hue / 60
  const x = chroma * (1 - Math.abs((segment % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0

  if (segment >= 0 && segment < 1) [red, green, blue] = [chroma, x, 0]
  else if (segment < 2) [red, green, blue] = [x, chroma, 0]
  else if (segment < 3) [red, green, blue] = [0, chroma, x]
  else if (segment < 4) [red, green, blue] = [0, x, chroma]
  else if (segment < 5) [red, green, blue] = [x, 0, chroma]
  else [red, green, blue] = [chroma, 0, x]

  const match = value - chroma
  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  }
}

const rgbToHex = ({ r, g, b }) => `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`

const hexToRgb = (hex) => {
  if (typeof hex !== 'string') return null
  const normalized = hex.trim().replace('#', '')
  if (![3, 6].includes(normalized.length)) return null
  const expanded = normalized.length === 3 ? normalized.split('').map(char => char + char).join('') : normalized
  const parsed = Number.parseInt(expanded, 16)
  if (Number.isNaN(parsed)) return null

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  }
}

const rgbToHsv = ({ r, g, b }) => {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * (((blue - red) / delta) + 2)
    else hue = 60 * (((red - green) / delta) + 4)
  }

  if (hue < 0) hue += 360

  return {
    h: hue,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function StoryColorPicker({ value, onChange }) {
  const paletteRef = useRef(null)
  const hueRef = useRef(null)
  const [pickerState, setPickerState] = useState(() => {
    const rgb = hexToRgb(value) ?? { r: 255, g: 255, b: 255 }
    return rgbToHsv(rgb)
  })

  useEffect(() => {
    const rgb = hexToRgb(value)
    if (!rgb) return
    const next = rgbToHsv(rgb)
    setPickerState(current => (
      Math.abs(current.h - next.h) < 0.5 &&
      Math.abs(current.s - next.s) < 0.01 &&
      Math.abs(current.v - next.v) < 0.01
        ? current
        : next
    ))
  }, [value])

  const commitColor = (nextState) => {
    const safeState = {
      h: clamp(nextState.h, 0, 360),
      s: clamp(nextState.s, 0, 1),
      v: clamp(nextState.v, 0, 1),
    }
    setPickerState(safeState)
    onChange(rgbToHex(hsvToRgb(safeState.h, safeState.s, safeState.v)))
  }

  const updateFromPalette = (clientX, clientY) => {
    const rect = paletteRef.current?.getBoundingClientRect()
    if (!rect) return
    const saturation = clamp((clientX - rect.left) / rect.width, 0, 1)
    const valueLevel = 1 - clamp((clientY - rect.top) / rect.height, 0, 1)
    commitColor({ ...pickerState, s: saturation, v: valueLevel })
  }

  const updateFromHue = (clientY) => {
    const rect = hueRef.current?.getBoundingClientRect()
    if (!rect) return
    const hue = clamp(((clientY - rect.top) / rect.height) * 360, 0, 360)
    commitColor({ ...pickerState, h: hue })
  }

  const startTracking = (event, updater) => {
    updater(event.clientX, event.clientY)
    const move = (nextEvent) => updater(nextEvent.clientX, nextEvent.clientY)
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px', gap: 10, alignItems: 'stretch' }}>
      <div
        ref={paletteRef}
        onPointerDown={(event) => startTracking(event, updateFromPalette)}
        style={{
          position: 'relative',
          minHeight: 132,
          borderRadius: 14,
          cursor: 'crosshair',
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.4)',
          background: `linear-gradient(90deg, #ffffff 0%, hsl(${pickerState.h} 100% 50%) 100%)`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, #000000 100%)' }} />
        <span
          style={{
            position: 'absolute',
            left: `${pickerState.s * 100}%`,
            top: `${(1 - pickerState.v) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px rgba(15,23,42,0.35), 0 4px 12px rgba(15,23,42,0.25)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        ref={hueRef}
        onPointerDown={(event) => startTracking(event, (_, clientY) => updateFromHue(clientY))}
        style={{
          position: 'relative',
          borderRadius: 999,
          cursor: 'ns-resize',
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.4)',
          background: 'linear-gradient(180deg, #ff0000 0%, #ffff00 17%, #00ff00 34%, #00ffff 51%, #0000ff 68%, #ff00ff 84%, #ff0000 100%)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 1,
            right: 1,
            top: `calc(${(pickerState.h / 360) * 100}% - 4px)`,
            height: 8,
            borderRadius: 999,
            background: '#fff',
            boxShadow: '0 1px 6px rgba(15,23,42,0.3)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

const defaultPresentation = {
  mediaFit: 'cover',
  mediaScale: 1,
  mediaRotation: 0,
  mediaOffsetX: 50,
  mediaOffsetY: 50,
  mediaFrame: { left: 0, right: 0, top: 0, bottom: 0 },
  mediaViewport: { x: 8, y: 8, width: 84, height: 84, aspectRatio: 'free' },
  textLayers: [],
}

const CAROUSEL_ASPECT_OPTIONS = [
  { value: 'free', label: 'Libre' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '9:16', label: '9:16' },
]

const getAspectRatioValue = (aspectRatio) => {
  if (aspectRatio === '1:1') return 1
  if (aspectRatio === '4:5') return 4 / 5
  if (aspectRatio === '9:16') return 9 / 16
  return null
}

const clampViewport = (viewport = {}) => {
  const width = clamp(viewport.width ?? 84, 8, 100)
  const height = clamp(viewport.height ?? 84, 8, 100)
  const x = clamp(viewport.x ?? 8, 0, 100 - width)
  const y = clamp(viewport.y ?? 8, 0, 100 - height)

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    aspectRatio: viewport.aspectRatio ?? 'free',
  }
}

const applyViewportAspectRatio = (viewport, aspectRatio) => {
  if (aspectRatio === 'free') {
    return clampViewport({ ...viewport, aspectRatio })
  }

  const ratio = getAspectRatioValue(aspectRatio)
  if (!ratio) return clampViewport({ ...viewport, aspectRatio: 'free' })

  let width = clamp(viewport.width ?? 84, 8, 100)
  let height = width / ratio

  if (height > 100) {
    height = 100
    width = height * ratio
  }

  if ((viewport.y ?? 8) + height > 100) {
    height = 100 - (viewport.y ?? 8)
    width = height * ratio
  }

  if ((viewport.x ?? 8) + width > 100) {
    width = 100 - (viewport.x ?? 8)
    height = width / ratio
  }

  return clampViewport({
    ...viewport,
    width,
    height,
    aspectRatio,
  })
}

const createTextLayer = (overrides = {}) => ({
  id: overrides.id ?? `layer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  content: overrides.content ?? 'Double-click to edit',
  x: overrides.x ?? 50,
  y: overrides.y ?? 50,
  fontSize: overrides.fontSize ?? 24,
  color: overrides.color ?? '#ffffff',
  zIndex: overrides.zIndex ?? 1,
})

const getLegacyCarouselTextLayer = (styleSettings) => {
  const content = typeof styleSettings.overlayText === 'string' ? styleSettings.overlayText.trim() : ''
  if (!content) return []

  return [
    createTextLayer({
      id: 'legacy-overlay-text',
      content,
      x: styleSettings.overlayTextX ?? 50,
      y: styleSettings.overlayTextY ?? 84,
      color: styleSettings.overlayTextColor ?? '#ffffff',
      fontSize: 24,
    }),
  ]
}

const getCarouselTextLayers = (presentation, styleSettings) => {
  const layers = Array.isArray(presentation?.textLayers) && presentation.textLayers.length > 0
    ? presentation.textLayers
    : getLegacyCarouselTextLayer(styleSettings)

  return layers.map((layer, index) => createTextLayer({
    ...layer,
    zIndex: Number.isFinite(layer?.zIndex) ? layer.zIndex : index + 1,
  }))
}

export function StylePanel({ postType, cfg, styleSettings, updateStyle, isTextCanvasMode = false, caption, hashtags, allMedia, updateMediaItem }) {
  const vertical = isVertical(postType)
  const isStory = postType === 'story'
  const isCarousel = postType === 'carousel'
  const textCanvas = getTextCanvasStyle(styleSettings, isStory ? 'story' : 'post')
  const [activeTool, setActiveTool] = useState(null)
  const [selectedCarouselIndex, setSelectedCarouselIndex] = useState(0)
  const [previewMediaReady, setPreviewMediaReady] = useState(false)
  const [previewMediaFailed, setPreviewMediaFailed] = useState(false)
  const [cropFrame, setCropFrame] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  })
  const cropDragRef = useRef(null)
  const cropResizeRef = useRef(null)
  const textDragRef = useRef(null)
  const layerDragRef = useRef(null)
  const layerResizeRef = useRef(null)
  const [selectedTextLayerId, setSelectedTextLayerId] = useState(null)
  const [editingTextLayerId, setEditingTextLayerId] = useState(null)

  const previewTextStyle = { fontFamily: styleSettings.fontFamily }
  const previewOverlayText = typeof styleSettings.overlayText === 'string' ? styleSettings.overlayText.trim() : ''
  const mediaEntries = useMemo(
    () => allMedia.map((item, actualIndex) => item ? { item, actualIndex } : null).filter(Boolean),
    [allMedia],
  )

  useEffect(() => {
    if (selectedCarouselIndex > mediaEntries.length - 1) {
      setSelectedCarouselIndex(Math.max(0, mediaEntries.length - 1))
    }
  }, [mediaEntries.length, selectedCarouselIndex])

  const selectedEntry = postType === 'carousel' ? mediaEntries[selectedCarouselIndex] ?? null : mediaEntries[0] ?? null
  const primaryMedia = selectedEntry?.item ?? null
  const isVideoPreview = primaryMedia?.type === 'video'
  const canCropCurrentMedia = Boolean(primaryMedia) && !isVideoPreview && postType !== 'video' && postType !== 'reel'
  const showStoryBackground = !primaryMedia || previewMediaFailed

  useEffect(() => {
    setPreviewMediaReady(!isVideoPreview)
    setPreviewMediaFailed(false)
  }, [isVideoPreview, primaryMedia?.url])

  useEffect(() => {
    if (!canCropCurrentMedia && activeTool === 'crop') {
      setActiveTool(null)
    }
  }, [activeTool, canCropCurrentMedia])

  const targetPresentation = postType === 'carousel'
    ? { ...defaultPresentation, ...(primaryMedia?.presentation ?? {}) }
    : { ...defaultPresentation, ...styleSettings }
  const carouselTextLayers = isCarousel ? getCarouselTextLayers(targetPresentation, styleSettings) : []

  useEffect(() => {
    if (isCarousel) {
      const nextViewport = targetPresentation.mediaViewport ?? {
        x: targetPresentation.mediaFrame?.left ?? defaultPresentation.mediaViewport.x,
        y: targetPresentation.mediaFrame?.top ?? defaultPresentation.mediaViewport.y,
        width: 100 - ((targetPresentation.mediaFrame?.left ?? 0) + (targetPresentation.mediaFrame?.right ?? 0)),
        height: 100 - ((targetPresentation.mediaFrame?.top ?? 0) + (targetPresentation.mediaFrame?.bottom ?? 0)),
        aspectRatio: defaultPresentation.mediaViewport.aspectRatio,
      }
      setCropFrame(clampViewport(nextViewport))
      return
    }

    const nextFrame = targetPresentation.mediaFrame ?? defaultPresentation.mediaFrame
    setCropFrame({
      left: nextFrame.left ?? 0,
      right: nextFrame.right ?? 0,
      top: nextFrame.top ?? 0,
      bottom: nextFrame.bottom ?? 0,
    })
  }, [isCarousel, targetPresentation.mediaFrame, targetPresentation.mediaViewport, selectedCarouselIndex, postType])

  useEffect(() => {
    if (!isCarousel) return
    if (!carouselTextLayers.length) {
      setSelectedTextLayerId(null)
      setEditingTextLayerId(null)
      return
    }

    if (!carouselTextLayers.some(layer => layer.id === selectedTextLayerId)) {
      setSelectedTextLayerId(carouselTextLayers[carouselTextLayers.length - 1].id)
    }
  }, [carouselTextLayers, isCarousel, selectedTextLayerId])

  const mediaTransform = `scale(${targetPresentation.mediaScale ?? 1}) rotate(${targetPresentation.mediaRotation ?? 0}deg)`
  const mediaObjectPosition = `${targetPresentation.mediaOffsetX ?? 50}% ${targetPresentation.mediaOffsetY ?? 50}%`

  const updateTargetPresentation = (patch) => {
    if (postType === 'carousel') {
      if (selectedEntry && typeof updateMediaItem === 'function') {
        updateMediaItem(selectedEntry.actualIndex, current => ({
          ...current,
          presentation: {
            ...defaultPresentation,
            ...(current.presentation ?? {}),
            ...patch,
          },
        }))
      }
      return
    }

    Object.entries(patch).forEach(([key, value]) => updateStyle(key, value))
  }

  const handleToolClick = (toolId) => {
    if (toolId === 'rotate') {
      updateTargetPresentation({ mediaRotation: ((targetPresentation.mediaRotation ?? 0) + 90) % 360 })
      return
    }

    if (toolId === 'crop') {
      if (!canCropCurrentMedia) return
      updateTargetPresentation({ mediaFit: 'cover' })
      setActiveTool(current => current === toolId ? null : toolId)
    }
  }

  const updateCarouselTextLayers = (updater) => {
    const nextLayers = typeof updater === 'function' ? updater(carouselTextLayers) : updater
    updateTargetPresentation({ textLayers: nextLayers.map((layer, index) => createTextLayer({ ...layer, zIndex: layer.zIndex ?? index + 1 })) })
  }

  const addCarouselTextLayer = () => {
    const nextLayer = createTextLayer({
      x: 50,
      y: 50,
      fontSize: 24,
      color: styleSettings.overlayTextColor ?? '#ffffff',
      zIndex: carouselTextLayers.length + 1,
    })
    updateCarouselTextLayers(layers => [...layers, nextLayer])
    setSelectedTextLayerId(nextLayer.id)
    setEditingTextLayerId(nextLayer.id)
  }

  const deleteSelectedCarouselTextLayer = () => {
    if (!selectedTextLayerId) return
    updateCarouselTextLayers(layers => layers.filter(layer => layer.id !== selectedTextLayerId))
    setEditingTextLayerId(null)
    setSelectedTextLayerId(null)
  }

  const updateCarouselTextLayer = (layerId, patch) => {
    updateCarouselTextLayers(layers => layers.map(layer => (
      layer.id === layerId
        ? { ...layer, ...(typeof patch === 'function' ? patch(layer) : patch) }
        : layer
    )))
  }

  const handleOverlayTextEdit = () => {
    const nextText = window.prompt('Modifier le texte', styleSettings.overlayText ?? '')
    if (nextText === null) return
    updateStyle('overlayText', nextText)
  }

  const handleCropPointerDown = (event) => {
    if (activeTool !== 'crop' || !canCropCurrentMedia) return

    if (isCarousel) {
      const rect = event.currentTarget.parentElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
      cropDragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startViewportX: cropFrame.x,
        startViewportY: cropFrame.y,
        width: rect.width || 1,
        height: rect.height || 1,
        pointerId: event.pointerId,
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
      event.stopPropagation()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    cropDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: targetPresentation.mediaOffsetX ?? 50,
      startOffsetY: targetPresentation.mediaOffsetY ?? 50,
      width: rect.width || 1,
      height: rect.height || 1,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleCropPointerMove = (event) => {
    const drag = cropDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    if (isCarousel) {
      const nextViewport = clampViewport({
        ...cropFrame,
        x: drag.startViewportX + ((event.clientX - drag.startX) / drag.width) * 100,
        y: drag.startViewportY + ((event.clientY - drag.startY) / drag.height) * 100,
      })
      setCropFrame(nextViewport)
      updateTargetPresentation({ mediaViewport: nextViewport })
      return
    }

    const nextOffsetX = clamp(drag.startOffsetX - ((event.clientX - drag.startX) / drag.width) * 100, 0, 100)
    const nextOffsetY = clamp(drag.startOffsetY - ((event.clientY - drag.startY) / drag.height) * 100, 0, 100)

    updateTargetPresentation({
      mediaOffsetX: Number(nextOffsetX.toFixed(1)),
      mediaOffsetY: Number(nextOffsetY.toFixed(1)),
    })
  }

  const handleCropWheel = (event) => {
    if (activeTool !== 'crop' || !canCropCurrentMedia) return
    if (isCarousel) return
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.06 : 0.06
    const nextScale = clamp((targetPresentation.mediaScale ?? 1) + delta, 1, 2)
    updateTargetPresentation({ mediaScale: Number(nextScale.toFixed(2)) })
  }

  const handleCropHandlePointerDown = (corner, event) => {
    if (activeTool !== 'crop' || !canCropCurrentMedia) return
    const rect = isCarousel
      ? event.currentTarget.parentElement?.parentElement?.getBoundingClientRect()
      : event.currentTarget.parentElement?.getBoundingClientRect()
    cropResizeRef.current = {
      corner,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: rect?.width || 1,
      height: rect?.height || 1,
      frame: cropFrame,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.stopPropagation()
  }

  const handleCropHandlePointerMove = (event) => {
    const drag = cropResizeRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    if (isCarousel) {
      const deltaX = ((event.clientX - drag.startX) / drag.width) * 100
      const deltaY = ((event.clientY - drag.startY) / drag.height) * 100
      const minSize = 12
      const next = { ...drag.frame }

      if (drag.corner.includes('left')) {
        const maxLeft = drag.frame.x + drag.frame.width - minSize
        next.x = clamp(drag.frame.x + deltaX, 0, maxLeft)
        next.width = drag.frame.width + (drag.frame.x - next.x)
      }
      if (drag.corner.includes('right')) {
        next.width = clamp(drag.frame.width + deltaX, minSize, 100 - drag.frame.x)
      }
      if (drag.corner.includes('top')) {
        const maxTop = drag.frame.y + drag.frame.height - minSize
        next.y = clamp(drag.frame.y + deltaY, 0, maxTop)
        next.height = drag.frame.height + (drag.frame.y - next.y)
      }
      if (drag.corner.includes('bottom')) {
        next.height = clamp(drag.frame.height + deltaY, minSize, 100 - drag.frame.y)
      }

      const aspectRatio = drag.frame.aspectRatio ?? 'free'
      const aspectValue = getAspectRatioValue(aspectRatio)
      let constrained = next

      if (aspectValue) {
        if (drag.corner.includes('left') || drag.corner.includes('right')) {
          constrained.height = constrained.width / aspectValue
        } else {
          constrained.width = constrained.height * aspectValue
        }

        if (drag.corner.includes('left')) {
          constrained.x = drag.frame.x + drag.frame.width - constrained.width
        }
        if (drag.corner.includes('top')) {
          constrained.y = drag.frame.y + drag.frame.height - constrained.height
        }
      }

      const nextViewport = clampViewport(constrained)
      setCropFrame(nextViewport)
      updateTargetPresentation({ mediaViewport: nextViewport })
      return
    }

    const deltaX = ((event.clientX - drag.startX) / drag.width) * 100
    const deltaY = ((event.clientY - drag.startY) / drag.height) * 100
    const minWidth = 18
    const minHeight = 18
    const next = { ...drag.frame }

    if (drag.corner.includes('left')) next.left = clamp(drag.frame.left + deltaX, 2, 100 - drag.frame.right - minWidth)
    if (drag.corner.includes('right')) next.right = clamp(drag.frame.right - deltaX, 2, 100 - next.left - minWidth)
    if (drag.corner.includes('top')) next.top = clamp(drag.frame.top + deltaY, 2, 100 - drag.frame.bottom - minHeight)
    if (drag.corner.includes('bottom')) next.bottom = clamp(drag.frame.bottom - deltaY, 2, 100 - next.top - minHeight)

    setCropFrame(next)
    updateTargetPresentation({ mediaFrame: next })
  }

  const handleCropPointerUp = (event) => {
    if (cropDragRef.current?.pointerId === event.pointerId) {
      cropDragRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }

    if (cropResizeRef.current?.pointerId === event.pointerId) {
      cropResizeRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

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

  const handleLayerPointerDown = (layerId, event) => {
    if (!isCarousel || editingTextLayerId === layerId) return
    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    const layer = carouselTextLayers.find(entry => entry.id === layerId)
    if (!layer || !rect) return

    layerDragRef.current = {
      layerId,
      startX: event.clientX,
      startY: event.clientY,
      startLayerX: layer.x,
      startLayerY: layer.y,
      width: rect.width || 1,
      height: rect.height || 1,
      pointerId: event.pointerId,
    }
    setSelectedTextLayerId(layerId)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.stopPropagation()
  }

  const handleLayerPointerMove = (event) => {
    const drag = layerDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const nextX = clamp(drag.startLayerX + ((event.clientX - drag.startX) / drag.width) * 100, 5, 95)
    const nextY = clamp(drag.startLayerY + ((event.clientY - drag.startY) / drag.height) * 100, 5, 95)
    updateCarouselTextLayer(drag.layerId, {
      x: Number(nextX.toFixed(2)),
      y: Number(nextY.toFixed(2)),
    })
  }

  const handleLayerPointerUp = (event) => {
    if (layerDragRef.current?.pointerId === event.pointerId) {
      layerDragRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  const handleLayerResizePointerDown = (layerId, event) => {
    const rect = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect()
    const layer = carouselTextLayers.find(entry => entry.id === layerId)
    if (!layer || !rect) return

    layerResizeRef.current = {
      layerId,
      startX: event.clientX,
      startFontSize: layer.fontSize,
      width: rect.width || 1,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.stopPropagation()
  }

  const handleLayerResizePointerMove = (event) => {
    const drag = layerResizeRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const nextFontSize = clamp(drag.startFontSize + ((event.clientX - drag.startX) / drag.width) * 120, 12, 72)
    updateCarouselTextLayer(drag.layerId, { fontSize: Number(nextFontSize.toFixed(1)) })
  }

  const handleLayerResizePointerUp = (event) => {
    if (layerResizeRef.current?.pointerId === event.pointerId) {
      layerResizeRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  if (isCarousel) {
    const selectedLayer = carouselTextLayers.find(layer => layer.id === selectedTextLayerId) ?? null
    const activeAspectRatio = cropFrame.aspectRatio ?? targetPresentation.mediaViewport?.aspectRatio ?? 'free'

    return (
      <aside style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'sticky',
        top: 12,
        alignSelf: 'start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Palette size={18} color="#7c3aed" />
          <div>
            <div style={{ fontWeight: 700, color: '#111827' }}>Carousel editor</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Canvas fixe, viewport de crop, et calques texte persistants.</div>
          </div>
        </div>

        {primaryMedia && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_TOOLS.filter(tool => tool.id !== 'crop' || canCropCurrentMedia).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleToolClick(id)}
                title={label}
                style={{
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: activeTool === id ? '#ede9fe' : '#fff',
                  border: activeTool === id ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: activeTool === id ? '#6d28d9' : '#111827',
                }}
              >
                <Icon size={16} strokeWidth={2.1} />
              </button>
            ))}
            <button
              type="button"
              onClick={addCarouselTextLayer}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: '#fff', border: '1px solid #e5e7eb', color: '#111827', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={15} />
              Texte
            </button>
            <button
              type="button"
              onClick={deleteSelectedCarouselTextLayer}
              disabled={!selectedLayer}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: selectedLayer ? '#fff' : '#f3f4f6', border: '1px solid #e5e7eb', color: selectedLayer ? '#b91c1c' : '#9ca3af', fontWeight: 600, cursor: selectedLayer ? 'pointer' : 'not-allowed' }}
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          </div>
        )}

        {mediaEntries.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {mediaEntries.map(({ item, actualIndex }, index) => (
              <button
                key={item.id ?? actualIndex}
                type="button"
                onClick={() => {
                  setSelectedCarouselIndex(index)
                  setEditingTextLayerId(null)
                }}
                style={{
                  width: 46,
                  height: 46,
                  minWidth: 46,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#e5e7eb',
                  border: index === selectedCarouselIndex ? '2px solid #7c3aed' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title={`Slide ${index + 1}`}
              >
                {item.type === 'video'
                  ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                  : <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calques texte</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Cliquez pour sélectionner, double-cliquez pour éditer, glissez pour déplacer.</div>
          {selectedLayer && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Taille</span>
                <input type="range" min="12" max="72" value={selectedLayer.fontSize} onChange={e => updateCarouselTextLayer(selectedLayer.id, { fontSize: Number(e.target.value) })} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Couleur</span>
                <input type="color" value={selectedLayer.color} onChange={e => updateCarouselTextLayer(selectedLayer.id, { color: e.target.value })} style={{ width: 48, height: 34, padding: 0, border: 'none', background: 'transparent' }} />
              </label>
            </>
          )}
          {activeTool === 'crop' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Aspect ratio</span>
              <select
                value={activeAspectRatio}
                onChange={e => {
                  const nextViewport = applyViewportAspectRatio(cropFrame, e.target.value)
                  setCropFrame(nextViewport)
                  updateTargetPresentation({ mediaViewport: nextViewport })
                }}
                style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 12px', background: '#fff', color: '#111827' }}
              >
                {CAROUSEL_ASPECT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <StyleSlider
          label="Largeur du post"
          value={styleSettings.cardWidth}
          min={60}
          max={100}
          suffix="%"
          onChange={e => updateStyle('cardWidth', Number(e.target.value))}
        />

        <StyleSlider
          label="Hauteur du média"
          value={styleSettings.mediaHeight}
          min={180}
          max={520}
          suffix=" px"
          onChange={e => updateStyle('mediaHeight', Number(e.target.value))}
        />

        <div style={{ padding: 16, borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: '#111827' }}>Canvas</div>
            <StretchHorizontal size={16} color="#94a3b8" />
          </div>

          <div style={{ width: `${styleSettings.cardWidth}%`, minWidth: 220, maxWidth: '100%', margin: '0 auto', background: '#ffffff', borderRadius: 18, border: '1px solid #e5e7eb', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>U</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Vous</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{cfg.label}</div>
              </div>
            </div>

            {caption && (
              <div style={{ padding: '0 16px 12px', ...previewTextStyle, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {caption}
              </div>
            )}

            <div
              style={{ height: styleSettings.mediaHeight, background: '#cbd5e1', overflow: 'hidden', position: 'relative' }}
              onPointerMove={handleLayerPointerMove}
              onPointerUp={handleLayerPointerUp}
              onPointerCancel={handleLayerPointerUp}
              onClick={() => {
                setSelectedTextLayerId(null)
                setEditingTextLayerId(null)
              }}
            >
              {primaryMedia && (
                isVideoPreview ? (
                  <video
                    src={primaryMedia.url}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${targetPresentation.mediaRotation ?? 0}deg)`, background: '#000' }}
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={primaryMedia.url}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${targetPresentation.mediaRotation ?? 0}deg)` }}
                  />
                )
              )}

              {carouselTextLayers
                .slice()
                .sort((a, b) => a.zIndex - b.zIndex)
                .map(layer => {
                  const isSelected = layer.id === selectedTextLayerId
                  const isEditing = layer.id === editingTextLayerId

                  return (
                    <div
                      key={layer.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedTextLayerId(layer.id)
                      }}
                      onDoubleClick={(event) => {
                        event.stopPropagation()
                        setSelectedTextLayerId(layer.id)
                        setEditingTextLayerId(layer.id)
                      }}
                      onPointerDown={event => handleLayerPointerDown(layer.id, event)}
                      style={{
                        position: 'absolute',
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20 + layer.zIndex,
                        minWidth: 32,
                        minHeight: 20,
                        outline: isSelected ? '1px dashed rgba(255,255,255,0.9)' : 'none',
                        outlineOffset: 4,
                        cursor: isEditing ? 'text' : 'grab',
                      }}
                    >
                      <div
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onInput={event => updateCarouselTextLayer(layer.id, { content: event.currentTarget.textContent ?? '' })}
                        onBlur={() => setEditingTextLayerId(null)}
                        style={{
                          color: layer.color,
                          fontSize: layer.fontSize,
                          fontFamily: styleSettings.fontFamily,
                          fontWeight: 800,
                          lineHeight: 1.2,
                          textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                          textAlign: 'center',
                          maxWidth: '220px',
                          whiteSpace: 'pre-wrap',
                          padding: '2px 4px',
                          borderRadius: 6,
                          background: isEditing ? 'rgba(15,23,42,0.35)' : 'transparent',
                          outline: 'none',
                        }}
                      >
                        {layer.content}
                      </div>
                      {isSelected && !isEditing && (
                        <span
                          onPointerDown={event => handleLayerResizePointerDown(layer.id, event)}
                          onPointerMove={handleLayerResizePointerMove}
                          onPointerUp={handleLayerResizePointerUp}
                          onPointerCancel={handleLayerResizePointerUp}
                          style={{ position: 'absolute', right: -8, bottom: -8, width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid #3b82f6', cursor: 'nwse-resize' }}
                        />
                      )}
                    </div>
                  )
                })}

              {activeTool === 'crop' && canCropCurrentMedia && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${cropFrame.y}%`, background: 'rgba(17,24,39,0.4)' }} />
                  <div style={{ position: 'absolute', top: `${cropFrame.y}%`, left: 0, width: `${cropFrame.x}%`, height: `${cropFrame.height}%`, background: 'rgba(17,24,39,0.4)' }} />
                  <div style={{ position: 'absolute', top: `${cropFrame.y}%`, left: `${cropFrame.x + cropFrame.width}%`, right: 0, height: `${cropFrame.height}%`, background: 'rgba(17,24,39,0.4)' }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, top: `${cropFrame.y + cropFrame.height}%`, bottom: 0, background: 'rgba(17,24,39,0.4)' }} />
                  <div
                    onPointerDown={handleCropPointerDown}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerUp}
                    onPointerCancel={handleCropPointerUp}
                    style={{ position: 'absolute', left: `${cropFrame.x}%`, top: `${cropFrame.y}%`, width: `${cropFrame.width}%`, height: `${cropFrame.height}%`, border: '2px solid rgba(255,255,255,0.92)', boxShadow: '0 0 0 999px rgba(17,24,39,0.05) inset', cursor: 'move' }}
                  >
                    {[
                      { key: 'top-left', left: -7, top: -7, cursor: 'nwse-resize' },
                      { key: 'top-right', right: -7, top: -7, cursor: 'nesw-resize' },
                      { key: 'bottom-left', left: -7, bottom: -7, cursor: 'nesw-resize' },
                      { key: 'bottom-right', right: -7, bottom: -7, cursor: 'nwse-resize' },
                    ].map((handle) => (
                      <span
                        key={handle.key}
                        onPointerDown={(event) => handleCropHandlePointerDown(handle.key, event)}
                        onPointerMove={handleCropHandlePointerMove}
                        onPointerUp={handleCropPointerUp}
                        onPointerCancel={handleCropPointerUp}
                        style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '3px solid #3b82f6', ...handle }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hashtags && (
              <div style={{ padding: '12px 16px 16px', color: '#2563eb', fontSize: 14 }}>
                {hashtags}
              </div>
            )}
          </div>
        </div>
      </aside>
    )
  }

  if (isTextCanvasMode) {
    return (
      <aside style={{
        background: isStory ? '#ffffff' : '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        padding: isStory ? 14 : 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'sticky',
        top: 12,
        alignSelf: 'start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Palette size={18} color="#7c3aed" />
          <div>
            <div style={{ fontWeight: 700, color: '#111827' }}>{isStory ? 'Story texte' : 'Post texte'}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Texte centré, fond coloré, édition directe dans le canvas.</div>
          </div>
        </div>

        <TextCanvasEditor mode={isStory ? 'story' : 'post'} styleSettings={styleSettings} updateStyle={updateStyle} />

        {!isStory && (
          <div style={{ padding: 16, borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>Aperçu</div>
              <StretchHorizontal size={16} color="#94a3b8" />
            </div>

            <div style={{ width: `${styleSettings.cardWidth}%`, minWidth: 220, maxWidth: '100%', margin: '0 auto', background: '#ffffff', borderRadius: 18, border: '1px solid #e5e7eb', overflow: 'hidden', position: 'relative' }}>
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>U</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Vous</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{cfg.label}</div>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                {renderTextCanvas(textCanvas, { aspectRatio: '1 / 1', minHeight: styleSettings.mediaHeight, borderRadius: 18, fontScale: 0.72 })}
              </div>

              {hashtags && (
                <div style={{ padding: '0 16px 16px', color: '#2563eb', fontSize: 14 }}>
                  {hashtags}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    )
  }

  return (
    <aside style={{
      background: isStory ? '#ffffff' : '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 18,
      padding: isStory ? 14 : 18,
      display: 'flex',
      flexDirection: 'column',
      gap: isStory ? 12 : 14,
      position: 'sticky',
      top: 12,
      alignSelf: 'start',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Palette size={18} color="#7c3aed" />
        <div>
          <div style={{ fontWeight: 700, color: '#111827' }}>{isStory ? 'Story editor' : 'Design flexible'}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{isStory ? 'Texte et couleur directement sur votre media.' : 'Changez le style du post avant de l\'enregistrer.'}</div>
        </div>
      </div>

      {primaryMedia && (
        <div style={{ display: 'flex', gap: 8 }}>
          {QUICK_TOOLS.filter(tool => tool.id !== 'crop' || canCropCurrentMedia).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleToolClick(id)}
            title={label}
            style={{
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeTool === id ? '#ede9fe' : '#fff',
              border: activeTool === id ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
              borderRadius: '50%',
              cursor: 'pointer',
              color: activeTool === id ? '#6d28d9' : '#111827',
            }}
          >
            <Icon size={16} strokeWidth={2.1} />
          </button>
          ))}
        </div>
      )}

      {postType === 'carousel' && mediaEntries.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {mediaEntries.map(({ item, actualIndex }, index) => (
            <button
              key={item.id ?? actualIndex}
              type="button"
              onClick={() => setSelectedCarouselIndex(index)}
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                borderRadius: 10,
                overflow: 'hidden',
                background: '#e5e7eb',
                border: index === selectedCarouselIndex ? '2px solid #7c3aed' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
              }}
              title={`Slide ${index + 1}`}
            >
              {item.type === 'video'
                ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                : <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </button>
          ))}
        </div>
      )}

      {!isStory && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police</span>
          <div style={{ position: 'relative' }}>
            <Type size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: 12 }} />
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
      )}

      {isStory && (
        <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texte story</div>
          <textarea
            value={styleSettings.overlayText ?? ''}
            onChange={e => updateStyle('overlayText', e.target.value)}
            placeholder="Ajouter un texte"
            rows={3}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 12px', background: '#fff', color: '#111827', resize: 'vertical', lineHeight: 1.4 }}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police du texte</span>
            <div style={{ position: 'relative' }}>
              <Type size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: 12 }} />
              <select
                value={styleSettings.overlayTextFontFamily}
                onChange={e => updateStyle('overlayTextFontFamily', e.target.value)}
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
                  <option key={`story-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </label>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Couleur</span>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: styleSettings.overlayTextColor ?? '#ffffff', border: '2px solid rgba(15,23,42,0.12)', boxShadow: '0 1px 4px rgba(15,23,42,0.1)' }} />
            </div>
            <StoryColorPicker value={styleSettings.overlayTextColor ?? '#ffffff'} onChange={color => updateStyle('overlayTextColor', color)} />
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Glissez le texte dans l'aperçu pour le placer.</div>
        </div>
      )}

      {!vertical && (
        <>
          <StyleSlider
            label="Largeur du post"
            value={styleSettings.cardWidth}
            min={60}
            max={100}
            suffix="%"
            onChange={e => updateStyle('cardWidth', Number(e.target.value))}
          />

          <StyleSlider
            label="Hauteur du média"
            value={styleSettings.mediaHeight}
            min={180}
            max={520}
            suffix=" px"
            onChange={e => updateStyle('mediaHeight', Number(e.target.value))}
          />
        </>
      )}

      {!isStory && (
      <div style={{
        padding: isStory ? 12 : 16,
        borderRadius: 18,
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#111827' }}>Aperçu en direct</div>
          <StretchHorizontal size={16} color="#94a3b8" />
        </div>

        <div style={{
          width: vertical ? 188 : `${styleSettings.cardWidth}%`,
          height: vertical ? 334 : 'auto',
          minWidth: vertical ? 'unset' : 220,
          maxWidth: '100%',
          margin: '0 auto',
          background: vertical ? '#050505' : '#ffffff',
          borderRadius: 18,
          border: vertical ? '1px solid rgba(15,23,42,0.12)' : '1px solid #e5e7eb',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: vertical ? '0 18px 40px rgba(15,23,42,0.22)' : 'none',
        }}>
          {!vertical && (
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                fontWeight: 700,
                flexShrink: 0,
              }}>U</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Vous</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{cfg.label}</div>
              </div>
            </div>
          )}

          {!vertical && caption && (
            <div style={{ padding: '0 16px 12px', ...previewTextStyle, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {caption}
            </div>
          )}

          {(primaryMedia || vertical) && (
            <div style={{
              ...(vertical
                ? { position: 'absolute', inset: 0 }
                : { height: styleSettings.mediaHeight }
              ),
              background: vertical ? '#050505' : '#cbd5e1',
              overflow: 'hidden',
              position: 'relative',
              cursor: activeTool === 'crop' ? 'grab' : 'default',
            }}>
              {showStoryBackground && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#111827',
                  }}
                />
              )}
              <div
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                onWheel={handleCropWheel}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
              >
                {primaryMedia && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${targetPresentation.mediaFrame?.left ?? 0}%`,
                      right: `${targetPresentation.mediaFrame?.right ?? 0}%`,
                      top: `${targetPresentation.mediaFrame?.top ?? 0}%`,
                      bottom: `${targetPresentation.mediaFrame?.bottom ?? 0}%`,
                      overflow: 'hidden',
                    }}
                  >
                    {isVideoPreview ? (
                      <video
                        key={primaryMedia.url}
                        src={primaryMedia.url}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: targetPresentation.mediaFit ?? 'cover',
                          objectPosition: mediaObjectPosition,
                          transform: mediaTransform,
                          opacity: 1,
                          transition: 'opacity 0.2s ease',
                          background: '#000',
                        }}
                        muted
                        controls
                        autoPlay
                        loop
                        playsInline
                        preload="auto"
                        onLoadedData={() => setPreviewMediaReady(true)}
                        onCanPlay={() => setPreviewMediaReady(true)}
                        onError={() => {
                          setPreviewMediaFailed(true)
                          setPreviewMediaReady(false)
                        }}
                      />
                    ) : (
                      <img
                        src={primaryMedia.url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: targetPresentation.mediaFit ?? 'cover', objectPosition: mediaObjectPosition, transform: mediaTransform }}
                        onError={() => setPreviewMediaFailed(true)}
                      />
                    )}
                  </div>
                )}

                {activeTool === 'crop' && canCropCurrentMedia && (
                  <>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.34)' }} />
                    <div style={{ position: 'absolute', left: `${cropFrame.left}%`, right: `${cropFrame.right}%`, top: `${cropFrame.top}%`, bottom: `${cropFrame.bottom}%`, border: '2px solid rgba(255,255,255,0.92)', boxShadow: '0 0 0 999px rgba(17,24,39,0.2) inset' }}>
                      {[
                        { key: 'top-left', left: -7, top: -7, cursor: 'nwse-resize' },
                        { key: 'top-right', right: -7, top: -7, cursor: 'nesw-resize' },
                        { key: 'bottom-left', left: -7, bottom: -7, cursor: 'nesw-resize' },
                        { key: 'bottom-right', right: -7, bottom: -7, cursor: 'nwse-resize' },
                      ].map((handle) => (
                        <span
                          key={handle.key}
                          onPointerDown={(event) => handleCropHandlePointerDown(handle.key, event)}
                          onPointerMove={handleCropHandlePointerMove}
                          onPointerUp={handleCropPointerUp}
                          onPointerCancel={handleCropPointerUp}
                          style={{
                            position: 'absolute',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: '#fff',
                            border: '3px solid #3b82f6',
                            cursor: handle.cursor,
                            ...handle,
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {previewOverlayText && (
                <div
                  onPointerDown={handleTextPointerDown}
                  onPointerMove={handleTextPointerMove}
                  onPointerUp={handleTextPointerUp}
                  onPointerCancel={handleTextPointerUp}
                  onDoubleClick={handleOverlayTextEdit}
                  style={{
                    position: 'absolute',
                    left: `${styleSettings.overlayTextX ?? 50}%`,
                    top: `${styleSettings.overlayTextY ?? 84}%`,
                    transform: 'translate(-50%, -50%)',
                    color: styleSettings.overlayTextColor ?? '#fff',
                    fontFamily: styleSettings.overlayTextFontFamily ?? styleSettings.fontFamily,
                    fontSize: vertical ? 20 : 16,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                    cursor: 'grab',
                    textAlign: 'center',
                    maxWidth: '85%',
                    zIndex: 3,
                    whiteSpace: 'pre-wrap',
                  }}
                  title="Glissez pour déplacer, double-cliquez pour modifier"
                >
                  {previewOverlayText}
                </div>
              )}
            </div>
          )}

          {!vertical && hashtags && (
            <div style={{ padding: '12px 16px 16px', color: '#2563eb', fontSize: 14 }}>
              {hashtags}
            </div>
          )}

          {vertical && (
            <div style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 2,
            }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: '#ede9fe',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                fontWeight: 700,
                fontSize: 10,
                flexShrink: 0,
              }}>U</div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                Vous
              </span>
            </div>
          )}
        </div>
      </div>
      )}
    </aside>
  )
}
