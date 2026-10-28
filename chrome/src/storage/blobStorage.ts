import { STORAGE_KEYS } from '@/shared/constants'
import type { BreakpointType } from '@/shared/types'

export function isExtensionContextValid(): boolean {
  try {
    return Boolean(
      typeof chrome !== 'undefined' &&
      chrome.runtime?.id &&
      chrome.storage?.local
    )
  } catch {
    return false
  }
}

function getLayerBlobStorageKey(layerId: string): string {
  return `${STORAGE_KEYS.BLOB_PREFIX}${layerId}`
}

function convertBlobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert Blob to Data URL'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function convertDataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex === -1) {
    return new Blob([], { type: 'image/png' })
  }
  const header = dataUrl.slice(0, commaIndex)
  const rawData = dataUrl.slice(commaIndex + 1)
  const mimeMatch = header.match(/^data:([^;,]+)/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
  const isBase64 = header.includes(';base64')

  if (!isBase64) {
    try {
      const decoded = decodeURIComponent(rawData)
      return new Blob([decoded], { type: mimeType })
    } catch {
      return new Blob([rawData], { type: mimeType })
    }
  }

  try {
    const cleanBase64 = rawData.replace(/\s+/g, '')
    const binaryString = atob(cleanBase64)
    const length = binaryString.length
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  } catch {
    try {
      const decoded = decodeURIComponent(rawData)
      return new Blob([decoded], { type: mimeType })
    } catch {
      return new Blob([], { type: mimeType })
    }
  }
}

export async function saveLayerBlob(id: string, blob: Blob): Promise<void> {
  if (!isExtensionContextValid()) return
  try {
    const dataUrl = await convertBlobToDataUrl(blob)
    const key = getLayerBlobStorageKey(id)
    await chrome.storage.local.set({ [key]: dataUrl })
  } catch {
    return
  }
}

export async function getLayerBlob(id: string): Promise<Blob | null> {
  if (!isExtensionContextValid()) return null
  try {
    const key = getLayerBlobStorageKey(id)
    const stored = await chrome.storage.local.get(key)
    const dataUrl = stored[key]
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return null
    }
    return convertDataUrlToBlob(dataUrl)
  } catch {
    return null
  }
}

export async function deleteLayerBlob(id: string): Promise<void> {
  if (!isExtensionContextValid()) return
  try {
    const key = getLayerBlobStorageKey(id)
    await chrome.storage.local.remove(key)
  } catch {
    return
  }
}

export function detectBreakpointByWidth(width: number): BreakpointType {
  if (width <= 540) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

export function isSvgBlob(blob: Blob): boolean {
  if (blob.type === 'image/svg+xml' || blob.type.includes('svg')) return true
  if (blob instanceof File && blob.name.toLowerCase().endsWith('.svg'))
    return true
  return false
}

export function normalizeImageBlob(blob: Blob, rawName?: string): Blob {
  const isSvg =
    isSvgBlob(blob) ||
    Boolean(rawName && rawName.toLowerCase().endsWith('.svg'))

  if (isSvg && blob.type !== 'image/svg+xml') {
    return new Blob([blob], { type: 'image/svg+xml' })
  }
  return blob
}

function parseSvgDimensions(
  svgText: string
): { width: number; height: number } | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, 'image/svg+xml')
    if (doc.querySelector('parsererror')) return null

    const svg = doc.querySelector('svg')
    if (!svg) return null

    const widthAttr = svg.getAttribute('width')?.trim()
    const heightAttr = svg.getAttribute('height')?.trim()
    const viewBoxAttr = svg.getAttribute('viewBox')?.trim()

    let width = NaN
    let height = NaN

    if (widthAttr && !widthAttr.endsWith('%')) {
      const parsed = parseFloat(widthAttr)
      if (!isNaN(parsed) && parsed > 0) width = parsed
    }

    if (heightAttr && !heightAttr.endsWith('%')) {
      const parsed = parseFloat(heightAttr)
      if (!isNaN(parsed) && parsed > 0) height = parsed
    }

    if ((isNaN(width) || isNaN(height)) && viewBoxAttr) {
      const parts = viewBoxAttr.split(/[\s,]+/).map(Number)
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        if (isNaN(width)) width = parts[2]
        if (isNaN(height)) height = parts[3]
      }
    }

    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      return { width: Math.round(width), height: Math.round(height) }
    }
  } catch {
    // Ignore XML parsing errors
  }
  return null
}

function inspectViaImageElement(
  blob: Blob
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      const naturalWidth = image.naturalWidth || image.width
      const naturalHeight = image.naturalHeight || image.height
      URL.revokeObjectURL(objectUrl)
      if (naturalWidth > 0 && naturalHeight > 0) {
        resolve({ naturalWidth, naturalHeight })
      } else {
        reject(new Error('Image has zero dimensions'))
      }
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image element'))
    }

    image.src = objectUrl
  })
}

export async function inspectImageBlob(blob: Blob): Promise<{
  naturalWidth: number
  naturalHeight: number
  breakpoint: BreakpointType
}> {
  let width = 0
  let height = 0

  if (isSvgBlob(blob)) {
    try {
      const text = await blob.text()
      const parsed = parseSvgDimensions(text)
      if (parsed) {
        width = parsed.width
        height = parsed.height
      }
    } catch {
      // Ignore text reading failure
    }

    if (!width || !height) {
      try {
        const dims = await inspectViaImageElement(blob)
        width = dims.naturalWidth
        height = dims.naturalHeight
      } catch {
        width = 1440
        height = 900
      }
    }
  } else {
    try {
      const bitmap = await createImageBitmap(blob)
      width = bitmap.width
      height = bitmap.height
      bitmap.close()
    } catch {
      const dims = await inspectViaImageElement(blob)
      width = dims.naturalWidth
      height = dims.naturalHeight
    }
  }

  const naturalWidth = Math.max(1, Math.round(width || 800))
  const naturalHeight = Math.max(1, Math.round(height || 600))

  return {
    naturalWidth,
    naturalHeight,
    breakpoint: detectBreakpointByWidth(naturalWidth),
  }
}
