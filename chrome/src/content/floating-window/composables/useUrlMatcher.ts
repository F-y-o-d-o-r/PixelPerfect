import type { LayerMetadata, UrlBinding } from '@/shared/types'

export function getNormalizedOrigin(): string {
  const host = window.location.hostname.replace(/^www\./, '')
  const port = window.location.port ? `:${window.location.port}` : ''
  return `${host}${port}`
}

export function getNormalizedUrlPath(): string {
  const origin = getNormalizedOrigin()
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return `${origin}${path}`
}

export function matchesUrlBinding(
  binding: UrlBinding,
  currentPath: string
): boolean {
  const origin = getNormalizedOrigin()
  if (binding.type === 'domain') {
    return currentPath.startsWith(binding.value) || binding.value === origin
  }
  if (binding.type === 'exact') {
    return binding.value === currentPath
  }
  if (binding.type === 'prefix') {
    return currentPath.startsWith(binding.value)
  }
  if (binding.type === 'pattern') {
    const escapedPattern = binding.value
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
    return new RegExp(`^${escapedPattern}$`).test(currentPath)
  }
  return true
}

export function getEffectiveScaleFactor(layer: LayerMetadata): number {
  if (layer.scaleMode === '1x') return 1
  if (layer.scaleMode === '2x') return 0.5
  const devicePixelRatio = window.devicePixelRatio || 1
  const viewportWidth =
    document.documentElement.clientWidth || window.innerWidth
  if (devicePixelRatio >= 1.5 && layer.naturalWidth >= viewportWidth * 1.4) {
    return 0.5
  }
  return 1
}

export function getLayerCssDimensions(layer: LayerMetadata): {
  width: number
  height: number
} {
  const scaleFactor = getEffectiveScaleFactor(layer)
  return {
    width: Math.round(layer.naturalWidth * scaleFactor),
    height: Math.round(layer.naturalHeight * scaleFactor),
  }
}
