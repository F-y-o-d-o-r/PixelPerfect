import { DOM_HOST_IDS } from '@/shared/constants'
import type { LayerMetadata, ScaleMode } from '@/shared/types'
import {
  activeLayer,
  currentFolderLayers,
  folders,
  isShortcutsModalOpen,
  showToast,
  uiStrings,
  windowState,
} from './storageState'
import {
  resetActiveLayerOrigin,
  setScaleMode,
  snapActiveLayerCenterX,
  snapActiveLayerTopCenter,
  snapActiveLayerTopY,
  updateLayer,
} from './useStorage'

export function toggleWidgetFocusOrVisibility(): void {
  windowState.visible = !windowState.visible
  if (windowState.visible) {
    showToast(uiStrings.value.toastWidgetFocused)
  }
}

export const focusOrOpenWidget = toggleWidgetFocusOrVisibility

export function toggleActiveLayerLock(layerId?: string): void {
  const targetId = layerId ?? activeLayer.value?.id
  if (!targetId || !activeLayer.value) return
  const nextLocked = windowState.vimMode === 'move'
  windowState.vimMode = nextLocked ? 'locked' : 'move'
  updateLayer(targetId, { locked: nextLocked })
  showToast(
    nextLocked ? uiStrings.value.toastLocked : uiStrings.value.toastMove
  )
}

export function enterMoveMode(layerId: string): void {
  windowState.vimMode = 'move'
  updateLayer(layerId, { locked: false })
  showToast(uiStrings.value.toastMove)
}

export function exitMoveModeToLocked(layerId?: string): void {
  const targetId = layerId ?? activeLayer.value?.id
  windowState.vimMode = 'locked'
  if (targetId) updateLayer(targetId, { locked: true })
  showToast(uiStrings.value.toastLocked)
}

export function moveActiveLayerBy(deltaX: number, deltaY: number): void {
  const layer = activeLayer.value
  if (!layer) return
  const currentX = Number.isFinite(layer.x) ? layer.x : 0
  const currentY = Number.isFinite(layer.y) ? layer.y : 0
  const patch: Partial<Omit<LayerMetadata, 'id' | 'createdAt'>> = {
    x: Math.round(currentX + deltaX),
    y: Math.round(currentY + deltaY),
  }
  updateLayer(layer.id, patch)
}

export function adjustActiveLayerOpacity(deltaOpacity: number): void {
  const layer = activeLayer.value
  if (!layer) return
  const currentOpacity = Number.isFinite(layer.opacity) ? layer.opacity : 0.5
  const nextOpacity =
    Math.round(
      Math.min(1, Math.max(0.05, currentOpacity + deltaOpacity)) * 100
    ) / 100
  updateLayer(layer.id, { opacity: nextOpacity })
}

export function setActiveLayerOpacity(opacity: number): void {
  const layer = activeLayer.value
  if (!layer) return
  const validOpacity = Number.isFinite(opacity)
    ? Math.max(0.05, Math.min(1, opacity))
    : 0.5
  updateLayer(layer.id, { opacity: validOpacity })
}

export function toggleActiveLayerVisible(): void {
  const layer = activeLayer.value
  if (!layer) return
  const nextVisible = !layer.visible
  updateLayer(layer.id, { visible: nextVisible })
  showToast(
    nextVisible ? uiStrings.value.showMockup : uiStrings.value.hiddenMockup
  )
}

export function toggleActiveLayerInvert(): void {
  const layer = activeLayer.value
  if (!layer) return
  const nextMode = layer.blendMode === 'invert' ? 'normal' : 'invert'
  updateLayer(layer.id, { blendMode: nextMode })
  const label =
    nextMode === 'invert'
      ? uiStrings.value.blendInvert
      : uiStrings.value.blendNormal
  showToast(`${uiStrings.value.blendModeLabel}: ${label}`)
}

export function cycleMockup(direction: 1 | -1): boolean {
  const list = currentFolderLayers.value
  if (list.length === 0) return false
  const curIdx = list.findIndex(
    (l: LayerMetadata) => l.id === windowState.activeLayerId
  )
  const nextIdx =
    curIdx === -1 ? 0 : (curIdx + direction + list.length) % list.length
  const next = list[nextIdx]
  if (next) {
    if (windowState.activeLayerId !== next.id) {
      windowState.vimMode = 'locked'
      updateLayer(next.id, { locked: true })
    }
    windowState.activeLayerId = next.id
    if (!next.visible) updateLayer(next.id, { visible: true })
    showToast(next.name)
    return true
  }
  return false
}

export function cycleFolder(direction: 1 | -1): boolean {
  const list = folders.value
  if (list.length <= 1) return false
  const curIdx = list.findIndex((f) => f.id === windowState.activeFolderId)
  const nextIdx =
    curIdx === -1 ? 0 : (curIdx + direction + list.length) % list.length
  const next = list[nextIdx]
  if (next) {
    windowState.activeFolderId = next.id
    return true
  }
  return false
}

export function selectFolderByIndex(index: number): boolean {
  const folder = folders.value[index]
  if (folder) {
    windowState.activeFolderId = folder.id
    return true
  }
  return false
}

export function toggleShortcutsModal(): void {
  isShortcutsModalOpen.value = !isShortcutsModalOpen.value
}

export function closeShortcutsModal(): void {
  isShortcutsModalOpen.value = false
}

export function releaseFocusToPageAction(): void {
  showToast(uiStrings.value.toastPageFocused)
}

export function toggleWindowMinimized(): void {
  windowState.minimized = !windowState.minimized
  showToast(
    windowState.minimized
      ? uiStrings.value.collapseWindowTitle
      : uiStrings.value.expandWindowTitle
  )
}

export function triggerFileUpload(): void {
  const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
  const input = host?.shadowRoot?.getElementById(
    'pp-file-upload-input'
  ) as HTMLInputElement | null
  input?.click()
}

export function snapTopCenterAction(): void {
  snapActiveLayerTopCenter()
}

export function resetOriginAction(): void {
  resetActiveLayerOrigin()
}

export function snapCenterXAction(): void {
  snapActiveLayerCenterX()
}

export function snapTopYAction(): void {
  snapActiveLayerTopY()
}

export function cycleThemeAction(): void {
  if (windowState.theme === 'dark') {
    windowState.theme = 'light'
  } else if (windowState.theme === 'light') {
    windowState.theme = 'system'
  } else {
    windowState.theme = 'dark'
  }
  const toastMsg =
    windowState.theme === 'dark'
      ? uiStrings.value.darkTheme
      : windowState.theme === 'light'
        ? uiStrings.value.lightTheme
        : uiStrings.value.systemThemeAuto
  showToast(toastMsg)
}

export function cycleScaleModeAction(): void {
  const layer = activeLayer.value
  if (!layer || !layer.visible) return
  const modes: ScaleMode[] = ['1x', '2x', 'auto']
  const curIdx = modes.indexOf(layer.scaleMode)
  const nextMode = modes[(curIdx + 1) % modes.length]
  setScaleMode(nextMode)
  showToast(`${uiStrings.value.scaleModeLabel}: ${nextMode.toUpperCase()}`)
}
