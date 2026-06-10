import { useEffect, useRef, useState } from 'react'

export default function PreviewVideo({
  src,
  style,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  playsInline = true,
}) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    const el = ref.current
    if (!el || !src) return undefined

    const playVideo = () => {
      setReady(true)
      if (autoPlay) {
        el.play().catch(() => {})
      }
    }

    el.load()
    el.addEventListener('loadeddata', playVideo)
    el.addEventListener('canplay', playVideo)

    return () => {
      el.removeEventListener('loadeddata', playVideo)
      el.removeEventListener('canplay', playVideo)
    }
  }, [src, autoPlay])

  if (!src) return null

  return (
    <video
      ref={ref}
      key={src}
      src={src}
      className={className}
      style={{ ...style, opacity: ready ? (style?.opacity ?? 1) : 0.4 }}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline={playsInline}
      preload="auto"
    />
  )
}
