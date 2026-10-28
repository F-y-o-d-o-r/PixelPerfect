import { DOM_HOST_IDS } from '@/shared/constants'
import type { LayerMetadata } from '@/shared/types'
import {
  activeLayer,
  currentFolderLayers,
  folders,
  isKeyboardControlActive,
  isShortcutsModalOpen,
  showToast,
  uiStrings,
  windowState,
} from './storageState'
import {
  focusKeyboardReceiverInShadowDom,
  releaseFocusToPage,
} from './keyboardFocus'
import {
  resetActiveLayerOrigin,
  snapActiveLayerCenterX,
  snapActiveLayerTopCenter,
  snapActiveLayerTopY,
  updateLayer,
} from './useStorage'

export function toggleWidgetFocusOrVisibility(): void {
  if (!windowState.visible) {
    windowState.visible = true
    if (windowState.minimized) windowState.minimized = false
    isKeyboardControlActive.value = true
    focusKeyboardReceiverInShadowDom()
    showToast(uiStrings.value.toastWidgetFocused)
    return
  }

  if (isKeyboardControlActive.value) {
    windowState.visible = false
    isKeyboardControlActive.value = false
    if (isShortcutsModalOpen.value) {
      isShortcutsModalOpen.value = false
    }
    releaseFocusToPage()
    return
  }

  if (windowState.minimized) windowState.minimized = false
  isKeyboardControlActive.value = true
  focusKeyboardReceiverInShadowDom()
  showToast(uiStrings.value.toastWidgetFocused)
}

export const focusOrOpenWidget = toggleWidgetFocusOrVisibility

export function enterMoveMode(layerId: string): void {
  windowState.vimMode = 'move'
  updateLayer(layerId, { locked: false })
  focusKeyboardReceiverInShadowDom()
  showToast(uiStrings.value.toastMove)
}

export function exitMoveModeToLocked(layerId?: string): void {
  const targetId = layerId ?? activeLayer.value?.id
  windowState.vimMode = 'locked'
  if (targetId) updateLayer(targetId, { locked: true })
  focusKeyboardReceiverInShadowDom()
  showToast(uiStrings.value.toastLocked)
}

export function moveActiveLayerBy(deltaX: number, deltaY: number): void {
  const layer = activeLayer.value
  if (!layer) return
  updateLayer(layer.id, { x: layer.x + deltaX, y: layer.y + deltaY })
}

export function adjustActiveLayerOpacity(deltaOpacity: number): void {
  const layer = activeLayer.value
  if (!layer) return
  const nextOpacity =
    Math.round(
      Math.min(1, Math.max(0.05, layer.opacity + deltaOpacity)) * 100
    ) / 100
  updateLayer(layer.id, { opacity: nextOpacity })
}

export function setActiveLayerOpacity(opacity: number): void {
  const layer = activeLayer.value
  if (!layer) return
  updateLayer(layer.id, { opacity })
}

export function toggleActiveLayerVisible(): void {
  const layer = activeLayer.value
  if (!layer) return
  const nextVisible = !layer.visible
  updateLayer(layer.id, { visible: nextVisible })
  if (!nextVisible && windowState.vimMode === 'move') {
    windowState.vimMode = 'locked'
    updateLayer(layer.id, { locked: true })
  }
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
  focusKeyboardReceiverInShadowDom()
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
    windowState.activeLayerId = next.id
    if (!next.visible) updateLayer(next.id, { visible: true })
    showToast(next.name)
    focusKeyboardReceiverInShadowDom()
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
    focusKeyboardReceiverInShadowDom()
    return true
  }
  return false
}

export function selectFolderByIndex(index: number): boolean {
  const folder = folders.value[index]
  if (folder) {
    windowState.activeFolderId = folder.id
    focusKeyboardReceiverInShadowDom()
    return true
  }
  return false
}

export function toggleShortcutsModal(): void {
  isShortcutsModalOpen.value = !isShortcutsModalOpen.value
  focusKeyboardReceiverInShadowDom()
}

export function closeShortcutsModal(): void {
  isShortcutsModalOpen.value = false
  focusKeyboardReceiverInShadowDom()
}

export function releaseFocusToPageAction(): void {
  isKeyboardControlActive.value = false
  releaseFocusToPage()
  showToast(uiStrings.value.toastPageFocused)
}

export function toggleWindowMinimized(): void {
  windowState.minimized = !windowState.minimized
  focusKeyboardReceiverInShadowDom()
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
  focusKeyboardReceiverInShadowDom()
}

export function resetOriginAction(): void {
  resetActiveLayerOrigin()
  focusKeyboardReceiverInShadowDom()
}

export function snapCenterXAction(): void {
  snapActiveLayerCenterX()
  focusKeyboardReceiverInShadowDom()
}

export function snapTopYAction(): void {
  snapActiveLayerTopY()
  focusKeyboardReceiverInShadowDom()
}
