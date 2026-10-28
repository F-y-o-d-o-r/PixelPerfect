import { onMounted, onUnmounted, watch } from 'vue'
import { DOM_HOST_IDS } from '@/shared/constants'
import { isExtensionContextValid } from '@/storage/blobStorage'
import {
  focusKeyboardReceiverInShadowDom,
  isUserTypingInRealInput,
} from './keyboardFocus'
import {
  adjustActiveLayerOpacity,
  closeShortcutsModal,
  cycleFolder,
  cycleMockup,
  cycleThemeAction,
  enterMoveMode,
  exitMoveModeToLocked,
  focusOrOpenWidget,
  moveActiveLayerBy,
  releaseFocusToPageAction,
  resetOriginAction,
  selectFolderByIndex,
  setActiveLayerOpacity,
  snapCenterXAction,
  snapTopCenterAction,
  snapTopYAction,
  toggleActiveLayerInvert,
  toggleActiveLayerVisible,
  toggleShortcutsModal,
  toggleWindowMinimized,
  triggerFileUpload,
} from './keyboardActions'
import { useStorage } from './useStorage'

export { focusKeyboardReceiverInShadowDom } from './keyboardFocus'

export function useKeyboard(): void {
  const {
    activeLayer,
    windowState,
    isShortcutsModalOpen,
    isKeyboardControlActive,
  } = useStorage()

  function handleSharedHotkeys(event: KeyboardEvent): boolean {
    if (event.key === '?' || (event.code === 'Slash' && event.shiftKey)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      toggleShortcutsModal()
      return true
    }

    if (event.code === 'KeyM' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      toggleWindowMinimized()
      return true
    }

    if (event.code === 'KeyU' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      triggerFileUpload()
      return true
    }

    if (event.code === 'KeyT' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      cycleThemeAction()
      return true
    }

    if (event.code === 'BracketLeft' || event.code === 'BracketRight') {
      event.preventDefault()
      event.stopImmediatePropagation()
      const dir = event.code === 'BracketRight' ? 1 : -1
      return event.shiftKey ? cycleFolder(dir) : cycleMockup(dir)
    }

    const layer = activeLayer.value
    if (!layer) return false

    if (event.code === 'KeyS' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      toggleActiveLayerVisible()
      return true
    }

    if (event.code === 'Minus' || event.code === 'Equal') {
      const step = event.shiftKey ? 0.01 : 0.1
      event.preventDefault()
      event.stopImmediatePropagation()
      adjustActiveLayerOpacity(event.code === 'Equal' ? step : -step)
      return true
    }

    if (!event.shiftKey && /^Digit[1-9]$/.test(event.code)) {
      const digit = Number.parseInt(event.code.replace('Digit', ''), 10)
      event.preventDefault()
      event.stopImmediatePropagation()
      setActiveLayerOpacity(digit / 10)
      return true
    }

    const runAction = (fn: () => void): boolean => {
      event.preventDefault()
      event.stopImmediatePropagation()
      fn()
      return true
    }

    if (
      !event.shiftKey &&
      (event.code === 'Digit0' ||
        event.code === 'Numpad0' ||
        event.key === '0' ||
        event.code === 'Home')
    ) {
      return runAction(snapTopCenterAction)
    }
    if (event.code === 'KeyR' && !event.shiftKey) {
      return runAction(resetOriginAction)
    }
    if (event.code === 'KeyX' && !event.shiftKey) {
      return runAction(snapCenterXAction)
    }
    if (event.code === 'KeyY' && !event.shiftKey) {
      return runAction(snapTopYAction)
    }
    if (event.code === 'KeyV' && !event.shiftKey) {
      return runAction(toggleActiveLayerInvert)
    }

    return false
  }

  function handleLockedModeKey(event: KeyboardEvent, layerId: string): void {
    if (handleSharedHotkeys(event)) return
    if (event.code === 'KeyI' && !event.shiftKey) {
      if (!activeLayer.value?.visible) return
      enterMoveMode(layerId)
    }
  }

  function handleMoveModeKey(event: KeyboardEvent, layerId: string): void {
    if (handleSharedHotkeys(event)) return
    const step = event.shiftKey ? 10 : 1

    switch (event.code) {
      case 'KeyI':
      case 'Escape':
        if (event.code === 'KeyI' && event.shiftKey) break
        event.preventDefault()
        event.stopImmediatePropagation()
        exitMoveModeToLocked(layerId)
        break
      case 'KeyH':
      case 'ArrowLeft':
        event.preventDefault()
        event.stopImmediatePropagation()
        moveActiveLayerBy(-step, 0)
        break
      case 'KeyL':
      case 'ArrowRight':
        event.preventDefault()
        event.stopImmediatePropagation()
        moveActiveLayerBy(step, 0)
        break
      case 'KeyK':
      case 'ArrowUp':
        event.preventDefault()
        event.stopImmediatePropagation()
        moveActiveLayerBy(0, -step)
        break
      case 'KeyJ':
      case 'ArrowDown':
        event.preventDefault()
        event.stopImmediatePropagation()
        moveActiveLayerBy(0, step)
        break
      case 'Space':
        event.preventDefault()
        event.stopImmediatePropagation()
        toggleActiveLayerVisible()
        break
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!isExtensionContextValid()) {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      return
    }

    // Alt+S, Alt+` or Alt+W: Focus or Open Pixel Perfect from anywhere
    const isAltTrigger =
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.code === 'KeyS' ||
        event.code === 'Backquote' ||
        event.code === 'KeyW')
    if (isAltTrigger) {
      event.preventDefault()
      event.stopImmediatePropagation()
      focusOrOpenWidget()
      return
    }

    // Direct folder jump Alt+1..3
    if (
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      /^Digit[1-9]$/.test(event.code)
    ) {
      const digit = Number.parseInt(event.code.replace('Digit', ''), 10)
      if (selectFolderByIndex(digit - 1)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
    }

    if (!windowState.visible) return
    if (!isKeyboardControlActive.value) return
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isUserTypingInRealInput(event)) return

    // Escape handling: modal -> locked exit to page
    if (event.code === 'Escape') {
      if (isShortcutsModalOpen.value) {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeShortcutsModal()
        return
      }
      if (windowState.vimMode === 'move') {
        event.preventDefault()
        event.stopImmediatePropagation()
        exitMoveModeToLocked()
        return
      }
      if (windowState.vimMode === 'locked') {
        event.preventDefault()
        event.stopImmediatePropagation()
        releaseFocusToPageAction()
        return
      }
    }

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

  function onWindowPointerDown(event: PointerEvent): void {
    const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
    if (!host) return
    isKeyboardControlActive.value = event.composedPath().includes(host)
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
    window.addEventListener('pointerdown', onWindowPointerDown, { capture: true })
    setTimeout(() => {
      focusKeyboardReceiverInShadowDom()
    }, 0)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown, { capture: true })
    window.removeEventListener('pointerdown', onWindowPointerDown, { capture: true })
  })
}
