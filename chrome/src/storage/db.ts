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

async function convertDataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
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

export async function inspectImageBlob(blob: Blob): Promise<{
  naturalWidth: number
  naturalHeight: number
  breakpoint: BreakpointType
}> {
  const bitmap = await createImageBitmap(blob)
  const naturalWidth = bitmap.width
  const naturalHeight = bitmap.height
  bitmap.close()

  return {
    naturalWidth,
    naturalHeight,
    breakpoint: detectBreakpointByWidth(naturalWidth),
  }
}
