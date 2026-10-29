import { FREE_LIMITS } from '@/shared/constants'
import { reorderItemsById } from './reorder'
import type { Folder, LayerMetadata, ScaleMode } from '@/shared/types'
import {
  deleteLayerBlob,
  getLayerBlob,
  inspectImageBlob,
  normalizeImageBlob,
  saveLayerBlob,
} from '@/storage/blobStorage'
import {
  activeLayer, autoSelectLayerForUrl, currentFolder, currentFolderLayers,
  currentUrlPath, ensureLayerObjectUrl, folders, getNextFolderName,
  initStorage, layerObjectUrls, layers, persistFolders, persistLayers,
  persistWindowState, registerLayerObjectUrl, revokeLayerObjectUrl,
  showToast, statusToast, isShortcutsModalOpen, isKeyboardControlActive,
  uiStrings, visibleFolders, windowState,
} from './storageState'
import { getLayerCssDimensions, getNormalizedUrlPath } from './useUrlMatcher'

export function getFolderLayerCount(folderId: string): number {
  return layers.value.filter((layer) => layer.folderId === folderId).length
}

export async function addFolder(name?: string): Promise<Folder | null> {
  if (visibleFolders.value.length >= FREE_LIMITS.maxFolders) {
    const limit = String(FREE_LIMITS.maxFolders)
    showToast(uiStrings.value.toastLimitFolders.replace('{count}', limit))
    return null
  }
  const folderName = name?.trim() || getNextFolderName(folders.value)
  const newFolder: Folder = {
    id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: folderName,
    urlBinding: { type: 'exact', value: getNormalizedUrlPath() },
    createdAt: Date.now(),
  }
  folders.value = [...folders.value, newFolder]
  await persistFolders()
  return newFolder
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) return
  folders.value = folders.value.map((f) => f.id === folderId ? { ...f, name: trimmed } : f)
  await persistFolders()
}

export async function removeFolder(folderId: string): Promise<void> {
  if (folders.value.length <= 1) {
    showToast(uiStrings.value.toastCannotDeleteLastFolder)
    return
  }

  const layersToRemove = layers.value.filter((l) => l.folderId === folderId)
  for (const layer of layersToRemove) {
    revokeLayerObjectUrl(layer.id)
    await deleteLayerBlob(layer.id)
  }
  layers.value = layers.value.filter((l) => l.folderId !== folderId)
  folders.value = folders.value.filter((f) => f.id !== folderId)

  if (windowState.activeFolderId === folderId || !folders.value.some((f) => f.id === windowState.activeFolderId)) {
    windowState.activeFolderId = folders.value[0]?.id ?? ''
  }
  if (layersToRemove.some((l) => l.id === windowState.activeLayerId)) {
    windowState.activeLayerId = currentFolderLayers.value[0]?.id ?? null
  }
  await Promise.all([persistLayers(), persistFolders()])
  showToast(uiStrings.value.toastPageDeleted)
}

export async function moveLayerToFolder(layerId: string, targetFolderId: string): Promise<void> {
  const layer = layers.value.find((l) => l.id === layerId)
  if (!layer || layer.folderId === targetFolderId) return
  const wasActiveLayer = windowState.activeLayerId === layerId
  await updateLayer(layerId, { folderId: targetFolderId })
  if (wasActiveLayer) {
    windowState.activeLayerId = currentFolderLayers.value[0]?.id ?? null
  }
  showToast(uiStrings.value.toastLayerMoved)
}

export async function reorderLayers(
  sourceId: string,
  targetId: string,
  pos: 'before' | 'after' = 'before'
): Promise<void> {
  if (sourceId === targetId) return
  layers.value = reorderItemsById(layers.value, sourceId, targetId, pos)
  await persistLayers()
}

export async function reorderFolders(
  sourceId: string,
  targetId: string,
  pos: 'before' | 'after' = 'before'
): Promise<void> {
  if (sourceId === targetId) return
  folders.value = reorderItemsById(folders.value, sourceId, targetId, pos)
  await persistFolders()
}

export async function addLayerFromBlob(
  rawBlob: Blob,
  rawName?: string
): Promise<LayerMetadata | null> {
  const targetFolder = currentFolder.value ?? folders.value[0]
  if (!targetFolder) return null
  const targetFolderId = targetFolder.id

  const folderLayers = layers.value.filter(
    (layer) => layer.folderId === targetFolderId
  )
  if (folderLayers.length >= FREE_LIMITS.maxLayersPerFolder) {
    showToast(uiStrings.value.toastLimitFolderLayers.replace('{count}', String(FREE_LIMITS.maxLayersPerFolder)))
    return null
  }
  if (layers.value.length >= FREE_LIMITS.maxTotalLayers) {
    showToast(uiStrings.value.toastLimitTotalLayers.replace('{count}', String(FREE_LIMITS.maxTotalLayers)))
    return null
  }

  const blob = normalizeImageBlob(rawBlob, rawName)
  let inspection: Awaited<ReturnType<typeof inspectImageBlob>>
  try {
    inspection = await inspectImageBlob(blob)
  } catch {
    showToast(uiStrings.value.toastUploadFailed)
    return null
  }

  const { naturalWidth, naturalHeight, breakpoint } = inspection

  const id = `lyr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  await saveLayerBlob(id, blob)
  registerLayerObjectUrl(id, blob)

  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  const centeredX = Math.round((clientWidth - naturalWidth) / 2)
  const currentScrollY = Math.round(window.scrollY || 0)

  const initialScaleMode: ScaleMode = targetFolder.defaultScaleMode ?? '1x'

  const layer: LayerMetadata = {
    id,
    name:
      rawName?.trim() ||
      `Mockup ${folderLayers.length + 1} (${naturalWidth}×${naturalHeight})`,
    folderId: targetFolderId,
    urlBinding: {
      type: 'exact',
      value: getNormalizedUrlPath(),
    },
    x: centeredX,
    y: currentScrollY,
    opacity: 0.5,
    visible: true,
    locked: true,
    scaleMode: initialScaleMode,
    blendMode: 'normal',
    naturalWidth,
    naturalHeight,
    breakpoint,
    createdAt: Date.now(),
  }

  layers.value = [...layers.value, layer]
  windowState.activeFolderId = targetFolderId
  windowState.activeLayerId = layer.id

  folders.value = folders.value.map((f) =>
    f.id === targetFolderId ? { ...f, lastActiveLayerId: layer.id } : f
  )

  await Promise.all([persistLayers(), persistFolders(), persistWindowState()])

  showToast(
    uiStrings.value.toastMockupAdded
      .replace('{width}', String(naturalWidth))
      .replace('{height}', String(naturalHeight))
  )
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

function getCenteredLayerX(layer: LayerMetadata): number {
  const { width } = getLayerCssDimensions(layer)
  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  return Math.round((clientWidth - width) / 2)
}

export async function centerActiveLayerX(): Promise<void> {
  const layer = activeLayer.value
  if (!layer) return
  const x = getCenteredLayerX(layer)
  await updateLayer(layer.id, { x })
  showToast(uiStrings.value.toastSnappedCenterX.replace('{x}', String(x)))
}

export async function alignActiveLayerTop(): Promise<void> {
  const layer = activeLayer.value
  if (!layer) return
  await updateLayer(layer.id, { y: 0 })
  showToast(uiStrings.value.toastSnappedTopY)
}

export async function centerActiveLayerTop(): Promise<void> {
  const layer = activeLayer.value
  if (!layer) return
  const x = getCenteredLayerX(layer)
  await updateLayer(layer.id, { x, y: 0 })
  showToast(uiStrings.value.toastSnappedTopCenter.replace('{x}', String(x)))
}

export async function resetActiveLayerPosition(): Promise<void> {
  if (!activeLayer.value) return
  await updateLayer(activeLayer.value.id, {
    x: 0,
    y: 0,
    scaleMode: '1x',
    blendMode: 'normal',
    opacity: 0.5,
  })
  showToast(uiStrings.value.toastOriginReset)
}

export const snapActiveLayerCenterX = centerActiveLayerX
export const snapActiveLayerTopY = alignActiveLayerTop
export const snapActiveLayerTopCenter = centerActiveLayerTop
export const resetActiveLayerOrigin = resetActiveLayerPosition

export async function setScaleMode(mode: ScaleMode): Promise<void> {
  if (activeLayer.value) {
    await updateLayer(activeLayer.value.id, { scaleMode: mode })
  }
  const folder = currentFolder.value
  if (folder) {
    folders.value = folders.value.map((f) =>
      f.id === folder.id ? { ...f, defaultScaleMode: mode } : f
    )
    await persistFolders()
  }
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
    isShortcutsModalOpen,
    isKeyboardControlActive,
    initStorage,
    autoSelectLayerForUrl,
    getFolderLayerCount,
    addFolder,
    renameFolder,
    removeFolder,
    moveLayerToFolder,
    reorderFolders,
    reorderLayers,
    addLayerFromBlob,
    updateLayer,
    removeLayer,
    centerActiveLayerX,
    alignActiveLayerTop,
    centerActiveLayerTop,
    resetActiveLayerPosition,
    snapActiveLayerCenterX,
    snapActiveLayerTopY,
    snapActiveLayerTopCenter,
    resetActiveLayerOrigin,
    setScaleMode,
    getLayerBlob,
    ensureLayerObjectUrl,
    showToast,
  }
}
