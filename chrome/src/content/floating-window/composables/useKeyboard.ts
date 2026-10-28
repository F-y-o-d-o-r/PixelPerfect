import { onMounted, onUnmounted, watch } from 'vue'
import { DOM_HOST_IDS } from '@/shared/constants'
import { isExtensionContextValid } from '@/storage/db'
import { useStorage } from './useStorage'

const KEYBOARD_TRAP_ID = 'pp-keyboard-focus-receiver'

function isUserTypingInRealInput(event: KeyboardEvent): boolean {
  const path = event.composedPath()
  for (const node of path) {
    if (!(node instanceof HTMLElement)) continue
    if (node.id === KEYBOARD_TRAP_ID) continue
    const tag = node.tagName
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      node.isContentEditable
    ) {
      return true
    }
  }
  return false
}

export function focusKeyboardReceiverInShadowDom(): void {
  const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
  const trapInput = host?.shadowRoot?.getElementById(
    KEYBOARD_TRAP_ID
  ) as HTMLInputElement | null
  if (!trapInput) return
  trapInput.focus({ preventScroll: true })
}

export function useKeyboard(): void {
  const {
    activeLayer,
    windowState,
    uiStrings,
    updateLayer,
    snapActiveLayerTopCenter,
    showToast,
  } = useStorage()

  function enterMoveMode(event: KeyboardEvent, layerId: string): void {
    event.preventDefault()
    event.stopImmediatePropagation()
    windowState.vimMode = 'move'
    updateLayer(layerId, { locked: false })
    focusKeyboardReceiverInShadowDom()
    showToast(uiStrings.value.toastMove)
  }

  function exitMoveModeToLocked(event?: KeyboardEvent, layerId?: string): void {
    if (event) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const targetId = layerId ?? activeLayer.value?.id
    windowState.vimMode = 'locked'
    if (targetId) {
      updateLayer(targetId, { locked: true })
    }
    focusKeyboardReceiverInShadowDom()
    showToast(uiStrings.value.toastLocked)
  }

  function moveActiveLayerBy(
    event: KeyboardEvent,
    deltaX: number,
    deltaY: number
  ): void {
    const layer = activeLayer.value
    if (!layer) return
    event.preventDefault()
    event.stopImmediatePropagation()
    updateLayer(layer.id, {
      x: layer.x + deltaX,
      y: layer.y + deltaY,
    })
  }

  function handleLockedModeKey(event: KeyboardEvent, layerId: string): void {
    if (event.code === 'KeyI' && !event.shiftKey) {
      enterMoveMode(event, layerId)
    }
  }

  function handleMoveModeKey(event: KeyboardEvent, layerId: string): void {
    const step = event.shiftKey ? 10 : 1

    switch (event.code) {
      case 'Escape':
        exitMoveModeToLocked(event, layerId)
        break
      case 'KeyH':
      case 'ArrowLeft':
        moveActiveLayerBy(event, -step, 0)
        break
      case 'KeyL':
      case 'ArrowRight':
        moveActiveLayerBy(event, step, 0)
        break
      case 'KeyK':
      case 'ArrowUp':
        moveActiveLayerBy(event, 0, -step)
        break
      case 'KeyJ':
      case 'ArrowDown':
        moveActiveLayerBy(event, 0, step)
        break
      case 'Digit0':
      case 'Home':
        if (!event.shiftKey) {
          event.preventDefault()
          event.stopImmediatePropagation()
          snapActiveLayerTopCenter()
        }
        break
      case 'KeyV':
      case 'Space': {
        const layer = activeLayer.value
        if (!layer) break
        event.preventDefault()
        event.stopImmediatePropagation()
        updateLayer(layer.id, { visible: !layer.visible })
        break
      }
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!isExtensionContextValid()) {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      return
    }
    if (!windowState.visible || !activeLayer.value) return
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isUserTypingInRealInput(event)) return

    const layerId = activeLayer.value.id
    if (windowState.vimMode === 'locked') {
      handleLockedModeKey(event, layerId)
      return
    }
    handleMoveModeKey(event, layerId)
  }

  watch(
    () => [windowState.visible, windowState.vimMode, windowState.activeLayerId],
    ([isVisible]) => {
      if (isVisible) {
        setTimeout(() => {
          focusKeyboardReceiverInShadowDom()
        }, 0)
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown, { capture: true })
    setTimeout(() => {
      focusKeyboardReceiverInShadowDom()
    }, 0)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown, { capture: true })
  })
}
