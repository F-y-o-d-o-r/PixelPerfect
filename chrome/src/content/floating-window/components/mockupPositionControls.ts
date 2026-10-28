import { computed } from 'vue'
import type { ScaleMode } from '@/shared/types'
import { focusKeyboardReceiverInShadowDom } from '../composables/useKeyboard'
import { useStorage } from '../composables/useStorage'

export const SCALE_MODES: { value: ScaleMode; label: string }[] = [
  { value: '1x', label: '1x' },
  { value: '2x', label: '2x' },
  { value: 'auto', label: 'Auto' },
]

export function useMockupPositionControls() {
  const {
    activeLayer,
    windowState,
    uiStrings,
    updateLayer,
    snapActiveLayerCenterX,
    snapActiveLayerTopY,
    snapActiveLayerTopCenter,
    resetActiveLayerOrigin,
    setScaleMode,
    showToast,
  } = useStorage()

  const opacityPercent = computed(() =>
    activeLayer.value ? Math.round(activeLayer.value.opacity * 100) : 50
  )

  function toggleVisible(): void {
    if (!activeLayer.value) return
    const nextVisible = !activeLayer.value.visible
    updateLayer(activeLayer.value.id, { visible: nextVisible })
    if (!nextVisible && windowState.vimMode === 'move') {
      windowState.vimMode = 'locked'
      updateLayer(activeLayer.value.id, { locked: true })
    }
  }

  function toggleLock(): void {
    if (!activeLayer.value) return
    const nextLocked = windowState.vimMode === 'move'
    windowState.vimMode = nextLocked ? 'locked' : 'move'
    updateLayer(activeLayer.value.id, { locked: nextLocked })
    showToast(
      nextLocked ? uiStrings.value.toastLocked : uiStrings.value.toastMove
    )
    focusKeyboardReceiverInShadowDom()
  }

  function toggleInvertMode(): void {
    if (!activeLayer.value) return
    const nextMode =
      activeLayer.value.blendMode === 'invert' ? 'normal' : 'invert'
    updateLayer(activeLayer.value.id, { blendMode: nextMode })
    const label =
      nextMode === 'invert'
        ? uiStrings.value.blendInvert
        : uiStrings.value.blendNormal
    showToast(`${uiStrings.value.blendModeLabel}: ${label}`)
    focusKeyboardReceiverInShadowDom()
  }

  function snapCenterX(): void {
    snapActiveLayerCenterX()
    focusKeyboardReceiverInShadowDom()
  }

  function snapTopY(): void {
    snapActiveLayerTopY()
    focusKeyboardReceiverInShadowDom()
  }

  function snapTopCenter(): void {
    snapActiveLayerTopCenter()
    focusKeyboardReceiverInShadowDom()
  }

  function resetOrigin(): void {
    resetActiveLayerOrigin()
    focusKeyboardReceiverInShadowDom()
  }

  function moveBy(deltaX: number, deltaY: number, event?: MouseEvent): void {
    if (!activeLayer.value) return
    const stepMultiplier = event?.shiftKey ? 10 : 1
    updateLayer(activeLayer.value.id, {
      x: activeLayer.value.x + deltaX * stepMultiplier,
      y: activeLayer.value.y + deltaY * stepMultiplier,
    })
  }

  function onCoordInput(axis: 'x' | 'y', event: Event): void {
    if (!activeLayer.value) return
    const parsedValue = Number.parseInt(
      (event.target as HTMLInputElement).value,
      10
    )
    if (!Number.isNaN(parsedValue)) {
      updateLayer(activeLayer.value.id, { [axis]: parsedValue })
    }
  }

  function onOpacityInput(event: Event): void {
    if (!activeLayer.value) return
    const parsedValue = Number.parseInt(
      (event.target as HTMLInputElement).value,
      10
    )
    if (!Number.isNaN(parsedValue)) {
      updateLayer(activeLayer.value.id, {
        opacity: Math.min(1, Math.max(0, parsedValue / 100)),
      })
    }
  }

  return {
    activeLayer,
    windowState,
    uiStrings,
    opacityPercent,
    toggleVisible,
    toggleLock,
    toggleInvertMode,
    moveBy,
    onCoordInput,
    onOpacityInput,
    snapActiveLayerCenterX: snapCenterX,
    snapActiveLayerTopY: snapTopY,
    snapActiveLayerTopCenter: snapTopCenter,
    resetActiveLayerOrigin: resetOrigin,
    setScaleMode,
  }
}
