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

export function normalizeTab(tab) {
  const value = String(tab).toLowerCase()
  if (value.includes('publi')) return 'Publies'
  if (value.includes('planifi')) return 'Planifies'
  return 'Brouillons'
}

export function getMetricSeed(post, offset = 0) {
  const source = String(post.id ?? `${post.type ?? 'post'}-${post.caption ?? ''}`)
  return source.split('').reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1 + offset), 0)
}

export function getNumericValue(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function getPostEngagement(post) {
  const engagement = post.engagement ?? {}
  const likes = getNumericValue(engagement.likes) ?? getNumericValue(post.likes) ?? ((getMetricSeed(post, 3) % 90) + 18)
  const comments = getNumericValue(engagement.comments) ?? getNumericValue(post.commentsCount) ?? ((getMetricSeed(post, 5) % 9) + 1)
  const reposts = getNumericValue(engagement.shares) ?? getNumericValue(post.shares) ?? ((getMetricSeed(post, 7) % 5) + 1)
  return { likes, comments, reposts }
}

export function formatRelative(date) {
  if (!date) return 'now'
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}
