import { onMounted, onUnmounted, watch } from 'vue'
import { DOM_HOST_IDS } from '@/shared/constants'
import { isExtensionContextValid } from '@/storage/blobStorage'
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

  function adjustActiveLayerOpacity(
    event: KeyboardEvent,
    deltaOpacity: number
  ): void {
    const layer = activeLayer.value
    if (!layer) return
    event.preventDefault()
    event.stopImmediatePropagation()
    const nextOpacity =
      Math.round(
        Math.min(1, Math.max(0.05, layer.opacity + deltaOpacity)) * 100
      ) / 100
    updateLayer(layer.id, { opacity: nextOpacity })
  }

  function handleSharedHotkeys(event: KeyboardEvent): boolean {
    if (event.key === '?' || (event.code === 'Slash' && event.shiftKey)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      windowState.showHotkeys = !windowState.showHotkeys
      focusKeyboardReceiverInShadowDom()
      return true
    }

    if (event.code === 'KeyM' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      windowState.minimized = !windowState.minimized
      focusKeyboardReceiverInShadowDom()
      return true
    }

    if (event.code === 'KeyU' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
      const fileInput = host?.shadowRoot?.getElementById(
        'pp-file-upload-input'
      ) as HTMLInputElement | null
      fileInput?.click()
      return true
    }

    const layer = activeLayer.value
    if (!layer) return false

    if (event.code === 'KeyS' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      const nextVisible = !layer.visible
      updateLayer(layer.id, { visible: nextVisible })
      if (!nextVisible && windowState.vimMode === 'move') {
        windowState.vimMode = 'locked'
        updateLayer(layer.id, { locked: true })
      }
      return true
    }

    const opacityStep = event.shiftKey ? 0.01 : 0.1
    if (event.code === 'Minus' || event.code === 'BracketLeft') {
      adjustActiveLayerOpacity(event, -opacityStep)
      return true
    }
    if (event.code === 'Equal' || event.code === 'BracketRight') {
      adjustActiveLayerOpacity(event, opacityStep)
      return true
    }

    if (!event.shiftKey && /^Digit[1-9]$/.test(event.code)) {
      const digit = Number.parseInt(event.code.replace('Digit', ''), 10)
      event.preventDefault()
      event.stopImmediatePropagation()
      updateLayer(layer.id, { opacity: digit / 10 })
      return true
    }

    return false
  }

  function handleLockedModeKey(event: KeyboardEvent, layerId: string): void {
    if (handleSharedHotkeys(event)) return
    if (event.code === 'KeyI' && !event.shiftKey) {
      if (!activeLayer.value?.visible) return
      enterMoveMode(event, layerId)
    }
  }

  function handleMoveModeKey(event: KeyboardEvent, layerId: string): void {
    if (handleSharedHotkeys(event)) return
    const step = event.shiftKey ? 10 : 1

    switch (event.code) {
      case 'KeyI':
      case 'Escape':
        if (event.code === 'KeyI' && event.shiftKey) break
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
    if (!windowState.visible) return
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isUserTypingInRealInput(event)) return

    if (!activeLayer.value) {
      handleSharedHotkeys(event)
      return
    }

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
