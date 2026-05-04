import { useEffect, useState } from 'react'

export function useViewportWidth() {
  const getWidth = () => (typeof window === 'undefined' ? 1280 : window.innerWidth)
  const [viewportWidth, setViewportWidth] = useState(getWidth)

  useEffect(() => {
    const handleResize = () => setViewportWidth(getWidth())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewportWidth
}
