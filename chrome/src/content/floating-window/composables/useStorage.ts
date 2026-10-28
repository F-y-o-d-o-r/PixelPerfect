import { FREE_LIMITS } from '@/shared/constants'
import type {
  Folder,
  LayerMetadata,
  ScaleMode,
} from '@/shared/types'
import {
  deleteLayerBlob,
  getLayerBlob,
  inspectImageBlob,
  saveLayerBlob,
} from '@/storage/db'
import {
  activeLayer,
  autoSelectLayerForUrl,
  currentFolder,
  currentFolderLayers,
  currentUrlPath,
  ensureLayerObjectUrl,
  folders,
  initStorage,
  layerObjectUrls,
  layers,
  persistFolders,
  persistLayers,
  registerLayerObjectUrl,
  revokeLayerObjectUrl,
  showToast,
  statusToast,
  uiStrings,
  visibleFolders,
  windowState,
} from './storageState'
import {
  getLayerCssDimensions,
  getNormalizedUrlPath,
} from './useUrlMatcher'

export function getFolderLayerCount(folderId: string): number {
  return layers.value.filter((layer) => layer.folderId === folderId).length
}

export async function addFolder(name?: string): Promise<Folder | null> {
  if (visibleFolders.value.length >= FREE_LIMITS.maxFolders) {
    showToast(`Free limit: up to ${FREE_LIMITS.maxFolders} folders`)
    return null
  }
  const folderNumber = visibleFolders.value.length + 1
  const newFolder: Folder = {
    id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name?.trim() || `Page ${folderNumber}`,
    urlBinding: {
      type: 'exact',
      value: getNormalizedUrlPath(),
    },
    createdAt: Date.now(),
  }
  folders.value = [...folders.value, newFolder]
  await persistFolders()
  return newFolder
}

export async function renameFolder(
  folderId: string,
  newName: string
): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) return
  folders.value = folders.value.map((folder) =>
    folder.id === folderId ? { ...folder, name: trimmed } : folder
  )
  await persistFolders()
}

export async function removeFolder(folderId: string): Promise<void> {
  const layersToRemove = layers.value.filter(
    (layer) => layer.folderId === folderId
  )
  for (const layer of layersToRemove) {
    revokeLayerObjectUrl(layer.id)
    await deleteLayerBlob(layer.id)
  }
  layers.value = layers.value.filter((layer) => layer.folderId !== folderId)
  folders.value = folders.value.filter((folder) => folder.id !== folderId)
  if (windowState.activeFolderId === folderId) {
    windowState.activeFolderId = null
  }
  if (layersToRemove.some((layer) => layer.id === windowState.activeLayerId)) {
    windowState.activeLayerId = currentFolderLayers.value[0]?.id ?? null
  }
  await Promise.all([persistLayers(), persistFolders()])
}

export async function addLayerFromBlob(
  blob: Blob,
  rawName?: string
): Promise<LayerMetadata | null> {
  const folderLayers = currentFolderLayers.value
  if (folderLayers.length >= FREE_LIMITS.maxLayersPerFolder) {
    showToast(
      `Free limit: ${FREE_LIMITS.maxLayersPerFolder} mockups per folder (${FREE_LIMITS.maxFolders}×${FREE_LIMITS.maxLayersPerFolder})`
    )
    return null
  }
  if (layers.value.length >= FREE_LIMITS.maxTotalLayers) {
    showToast(`Free limit reached (${FREE_LIMITS.maxTotalLayers} mockups)`)
    return null
  }

  const { naturalWidth, naturalHeight, breakpoint } =
    await inspectImageBlob(blob)

  const id = `lyr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  await saveLayerBlob(id, blob)
  registerLayerObjectUrl(id, blob)

  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  const centeredX = Math.round((clientWidth - naturalWidth) / 2)
  const currentScrollY = Math.round(window.scrollY || 0)

  const layer: LayerMetadata = {
    id,
    name:
      rawName?.trim() ||
      `Mockup ${folderLayers.length + 1} (${naturalWidth}×${naturalHeight})`,
    folderId: windowState.activeFolderId,
    urlBinding: {
      type: 'exact',
      value: getNormalizedUrlPath(),
    },
    x: centeredX,
    y: currentScrollY,
    opacity: 0.5,
    visible: true,
    locked: true,
    scaleMode: '1x',
    naturalWidth,
    naturalHeight,
    breakpoint,
    createdAt: Date.now(),
  }

  layers.value = [...layers.value, layer]
  windowState.activeLayerId = layer.id
  await persistLayers()
  showToast(`Mockup added (${naturalWidth}×${naturalHeight})`)
  return layer
}

export async function updateLayer(
  layerId: string,
  patch: Partial<Omit<LayerMetadata, 'id' | 'createdAt'>>
): Promise<void> {
  layers.value = layers.value.map((layer) =>
    layer.id === layerId ? { ...layer, ...patch } : layer
  )
  await persistLayers()
}

export async function removeLayer(layerId: string): Promise<void> {
  revokeLayerObjectUrl(layerId)
  await deleteLayerBlob(layerId)
  layers.value = layers.value.filter((layer) => layer.id !== layerId)
  if (windowState.activeLayerId === layerId) {
    windowState.activeLayerId = currentFolderLayers.value[0]?.id ?? null
  }
  await persistLayers()
}

export async function snapActiveLayerTopCenter(): Promise<void> {
  const layer = activeLayer.value
  if (!layer) return
  const { width } = getLayerCssDimensions(layer)
  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  const x = Math.round((clientWidth - width) / 2)
  await updateLayer(layer.id, { x, y: 0 })
  showToast(`Snapped to top-center (X: ${x}, Y: 0)`)
}

export async function resetActiveLayerOrigin(): Promise<void> {
  const layer = activeLayer.value
  if (!layer) return
  await updateLayer(layer.id, { x: 0, y: 0, scaleMode: '1x', opacity: 0.5 })
  showToast(uiStrings.value.toastOriginReset)
}

export async function setScaleMode(mode: ScaleMode): Promise<void> {
  const layer = activeLayer.value
  if (!layer) return
  await updateLayer(layer.id, { scaleMode: mode })
}

export function useStorage() {
  return {
    layers,
    folders,
    layerObjectUrls,
    visibleFolders,
    currentFolder,
    currentFolderLayers,
    activeLayer,
    windowState,
    uiStrings,
    currentUrlPath,
    statusToast,
    initStorage,
    autoSelectLayerForUrl,
    getFolderLayerCount,
    addFolder,
    renameFolder,
    removeFolder,
    addLayerFromBlob,
    updateLayer,
    removeLayer,
    snapActiveLayerTopCenter,
    resetActiveLayerOrigin,
    setScaleMode,
    getLayerBlob,
    ensureLayerObjectUrl,
    showToast,
  }
}
