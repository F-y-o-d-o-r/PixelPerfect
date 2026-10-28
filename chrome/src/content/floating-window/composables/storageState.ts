import { computed, reactive, ref, watch } from 'vue'
import {
  DEFAULT_FLOATING_WINDOW_STATE,
  STORAGE_KEYS,
} from '@/shared/constants'
import { getUiStrings } from '@/i18n/locales'
import type {
  FloatingWindowState,
  Folder,
  LayerMetadata,
} from '@/shared/types'
import { getLayerBlob, isExtensionContextValid } from '@/storage/db'
import { getNormalizedUrlPath } from './useUrlMatcher'

export const layers = ref<LayerMetadata[]>([])
export const folders = ref<Folder[]>([])
export const layerObjectUrls = reactive<Record<string, string>>({})
export const windowState = reactive<FloatingWindowState>({
  ...DEFAULT_FLOATING_WINDOW_STATE,
})
export const currentUrlPath = ref<string>(getNormalizedUrlPath())
export const statusToast = ref<string | null>(null)

let toastTimer: ReturnType<typeof setTimeout> | null = null
let isStorageInitialized = false

export const uiStrings = computed(() => getUiStrings(windowState.locale))

export const visibleFolders = computed(() => folders.value)

export const currentFolder = computed<Folder | null>(() => {
  if (folders.value.length === 0) return null
  return (
    folders.value.find((folder) => folder.id === windowState.activeFolderId) ??
    folders.value[0]
  )
})

export const currentFolderLayers = computed(() => {
  const activeId = currentFolder.value?.id
  if (!activeId) return []
  return layers.value.filter((layer) => layer.folderId === activeId)
})

export const activeLayer = computed(
  () =>
    layers.value.find((layer) => layer.id === windowState.activeLayerId) ?? null
)

export function registerLayerObjectUrl(layerId: string, blob: Blob): string {
  const existingUrl = layerObjectUrls[layerId]
  if (existingUrl) {
    URL.revokeObjectURL(existingUrl)
  }
  const objectUrl = URL.createObjectURL(blob)
  layerObjectUrls[layerId] = objectUrl
  return objectUrl
}

export function revokeLayerObjectUrl(layerId: string): void {
  const existingUrl = layerObjectUrls[layerId]
  if (existingUrl) {
    URL.revokeObjectURL(existingUrl)
    delete layerObjectUrls[layerId]
  }
}

export async function ensureLayerObjectUrl(
  layerId: string
): Promise<string | null> {
  if (layerObjectUrls[layerId]) {
    return layerObjectUrls[layerId]
  }
  const blob = await getLayerBlob(layerId)
  if (!blob) return null
  return registerLayerObjectUrl(layerId, blob)
}

async function hydrateAllLayerObjectUrls(): Promise<void> {
  for (const layer of layers.value) {
    await ensureLayerObjectUrl(layer.id)
  }
}

export function showToast(message: string, durationMs = 2400): void {
  statusToast.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    statusToast.value = null
  }, durationMs)
}

export async function persistLayers(): Promise<void> {
  if (!isExtensionContextValid()) return
  try {
    const rawLayers: LayerMetadata[] = JSON.parse(JSON.stringify(layers.value))
    await chrome.storage.local.set({ [STORAGE_KEYS.LAYERS]: rawLayers })
  } catch {
    return
  }
}

export async function persistFolders(): Promise<void> {
  if (!isExtensionContextValid()) return
  try {
    const rawFolders: Folder[] = JSON.parse(JSON.stringify(folders.value))
    await chrome.storage.local.set({ [STORAGE_KEYS.FOLDERS]: rawFolders })
  } catch {
    return
  }
}

export async function persistWindowState(): Promise<void> {
  if (!isExtensionContextValid()) return
  try {
    const serializedState: FloatingWindowState = JSON.parse(
      JSON.stringify(windowState)
    )
    await chrome.storage.local.set({
      [STORAGE_KEYS.FLOATING_WINDOW]: serializedState,
    })
  } catch {
    return
  }
}

function rememberActiveLayerForFolder(folderId: string): void {
  const activeLayerId = windowState.activeLayerId
  const layerBelongsToFolder = layers.value.some(
    (layer) => layer.id === activeLayerId && layer.folderId === folderId
  )
  if (!layerBelongsToFolder) return
  folders.value = folders.value.map((folder) =>
    folder.id === folderId
      ? { ...folder, lastActiveLayerId: activeLayerId }
      : folder
  )
  persistFolders()
}

function pickLayerIdForFolder(folderId: string): string | null {
  const folderLayers = layers.value.filter((layer) => layer.folderId === folderId)
  const currentLayer = folderLayers.find(
    (layer) => layer.id === windowState.activeLayerId
  )
  if (currentLayer) return currentLayer.id
  const rememberedLayerId = folders.value.find(
    (folder) => folder.id === folderId
  )?.lastActiveLayerId
  const rememberedLayer = folderLayers.find(
    (layer) => layer.id === rememberedLayerId
  )
  return (rememberedLayer ?? folderLayers[0])?.id ?? null
}

watch(
  () => windowState.activeFolderId,
  (nextFolderId, previousFolderId) => {
    if (previousFolderId) rememberActiveLayerForFolder(previousFolderId)
    if (nextFolderId) windowState.activeLayerId = pickLayerIdForFolder(nextFolderId)
  },
  { flush: 'sync' }
)

export function autoSelectLayerForUrl(): void {
  const normalizedPath = getNormalizedUrlPath()
  currentUrlPath.value = normalizedPath

  const folderLayers = currentFolderLayers.value
  if (folderLayers.length === 0) return

  const isActiveLayerInCurrentFolder = folderLayers.some(
    (layer) => layer.id === windowState.activeLayerId
  )
  if (!isActiveLayerInCurrentFolder) {
    windowState.activeLayerId = folderLayers[0].id
  }
}

function registerCrossTabStorageSyncListener(): void {
  if (!isExtensionContextValid() || !chrome.storage?.onChanged) return

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return

    if (changes[STORAGE_KEYS.LAYERS]?.newValue) {
      const updatedLayers = changes[STORAGE_KEYS.LAYERS].newValue
      if (Array.isArray(updatedLayers)) {
        layers.value = updatedLayers
        hydrateAllLayerObjectUrls()
      }
    }

    if (changes[STORAGE_KEYS.FOLDERS]?.newValue) {
      const updatedFolders = changes[STORAGE_KEYS.FOLDERS].newValue
      if (Array.isArray(updatedFolders)) {
        folders.value = updatedFolders
      }
    }
  })
}

export async function initStorage(): Promise<void> {
  if (isStorageInitialized) return
  isStorageInitialized = true
  currentUrlPath.value = getNormalizedUrlPath()

  if (isExtensionContextValid()) {
    try {
      const storedData = await chrome.storage.local.get([
        STORAGE_KEYS.LAYERS,
        STORAGE_KEYS.FOLDERS,
        STORAGE_KEYS.FLOATING_WINDOW,
      ])

      if (Array.isArray(storedData[STORAGE_KEYS.LAYERS])) {
        layers.value = storedData[STORAGE_KEYS.LAYERS]
      }
      if (Array.isArray(storedData[STORAGE_KEYS.FOLDERS])) {
        folders.value = storedData[STORAGE_KEYS.FOLDERS]
      }

      if (storedData[STORAGE_KEYS.FLOATING_WINDOW]) {
        Object.assign(
          windowState,
          DEFAULT_FLOATING_WINDOW_STATE,
          storedData[STORAGE_KEYS.FLOATING_WINDOW]
        )
        windowState.visible = true
        windowState.vimMode = 'locked'
      }

      if (folders.value.length === 0) {
        const defaultFolder: Folder = {
          id: `fld_${Date.now()}_default`,
          name: 'Page 1',
          urlBinding: {
            type: 'exact',
            value: currentUrlPath.value,
          },
          createdAt: Date.now(),
        }
        folders.value = [defaultFolder]
        windowState.activeFolderId = defaultFolder.id
        await persistFolders()
      } else if (!folders.value.some((f) => f.id === windowState.activeFolderId)) {
        windowState.activeFolderId = folders.value[0].id
      }
    } catch {
      return
    }
  }

  await hydrateAllLayerObjectUrls()
  autoSelectLayerForUrl()
  registerCrossTabStorageSyncListener()
}

watch(
  () => ({
    minimized: windowState.minimized,
    showHotkeys: windowState.showHotkeys,
    position: { ...windowState.position },
    viewMode: windowState.viewMode,
    activeFolderId: windowState.activeFolderId,
    activeLayerId: windowState.activeLayerId,
    theme: windowState.theme,
    locale: windowState.locale,
  }),
  () => {
    persistWindowState()
  },
  { deep: true }
)
