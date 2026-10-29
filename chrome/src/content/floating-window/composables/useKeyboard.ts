import { onMounted, onUnmounted } from 'vue'
import { isExtensionContextValid } from '@/storage/blobStorage'
import { isUserTypingInRealInput } from './keyboardFocus'
import {
  adjustActiveLayerOpacity,
  closeShortcutsModal,
  cycleFolder,
  cycleMockup,
  cycleScaleModeAction,
  cycleThemeAction,
  exitMoveModeToLocked,
  focusOrOpenWidget,
  moveActiveLayerBy,
  resetOriginAction,
  selectFolderByIndex,
  setActiveLayerOpacity,
  snapCenterXAction,
  snapTopCenterAction,
  snapTopYAction,
  toggleActiveLayerInvert,
  toggleActiveLayerLock,
  toggleActiveLayerVisible,
  toggleShortcutsModal,
  toggleWindowMinimized,
  triggerFileUpload,
} from './keyboardActions'
import { useStorage } from './useStorage'

function consumeEvent(event: KeyboardEvent, action: () => void): boolean {
  event.preventDefault()
  event.stopImmediatePropagation()
  action()
  return true
}

export function useKeyboard(): void {
  const { activeLayer, windowState, isShortcutsModalOpen } = useStorage()

  function onKeyDown(event: KeyboardEvent): void {
    if (!isExtensionContextValid()) {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      return
    }

    // Alt+S, Alt+` or Alt+W: Open / Close Pixel Perfect from anywhere
    const isAltTrigger =
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.code === 'KeyS' ||
        event.code === 'Backquote' ||
        event.code === 'KeyW')
    if (isAltTrigger) {
      consumeEvent(event, focusOrOpenWidget)
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
        consumeEvent(event, () => {})
        return
      }
    }

    // If widget is hidden, don't intercept any other keys
    if (!windowState.visible) return

    // If user is typing in a real text input, let them type
    if (isUserTypingInRealInput(event)) {
      if (event.code === 'Escape') {
        const active = document.activeElement as HTMLElement | null
        active?.blur()
      }
      return
    }

    // Ignore browser system shortcuts with Ctrl / Meta
    if (event.metaKey || event.ctrlKey) return

    const code = event.code
    const key = event.key?.toLowerCase()

    // Escape handling: modal -> exit move mode to locked
    if (code === 'Escape') {
      if (isShortcutsModalOpen.value) {
        consumeEvent(event, closeShortcutsModal)
        return
      }
      if (windowState.vimMode === 'move') {
        consumeEvent(event, exitMoveModeToLocked)
        return
      }
      return
    }

    // Shortcuts modal (?)
    if (key === '?' || (code === 'Slash' && event.shiftKey)) {
      consumeEvent(event, toggleShortcutsModal)
      return
    }

    // Minimize window (m)
    if ((code === 'KeyM' || key === 'm' || key === 'ь') && !event.shiftKey) {
      consumeEvent(event, toggleWindowMinimized)
      return
    }

    // Trigger upload (u)
    if ((code === 'KeyU' || key === 'u' || key === 'г') && !event.shiftKey) {
      consumeEvent(event, triggerFileUpload)
      return
    }

    // Cycle theme (t)
    if ((code === 'KeyT' || key === 't' || key === 'е') && !event.shiftKey) {
      consumeEvent(event, cycleThemeAction)
      return
    }

    // Cycle folders: { / } (Shift + [ / ])
    if (
      event.shiftKey &&
      (code === 'BracketLeft' ||
        code === 'BracketRight' ||
        key === '{' ||
        key === '}' ||
        key === 'х' ||
        key === 'ъ')
    ) {
      const dir =
        code === 'BracketRight' || key === '}' || key === 'ъ' ? 1 : -1
      consumeEvent(event, () => cycleFolder(dir))
      return
    }

    // Cycle mockups: [ / ]
    if (
      !event.shiftKey &&
      (code === 'BracketLeft' ||
        code === 'BracketRight' ||
        key === '[' ||
        key === ']' ||
        key === 'х' ||
        key === 'ъ')
    ) {
      const dir =
        code === 'BracketRight' || key === ']' || key === 'ъ' ? 1 : -1
      consumeEvent(event, () => cycleMockup(dir))
      return
    }

    // Layer-specific actions require activeLayer
    const layer = activeLayer.value
    if (!layer) return

    // Show / Hide (s or Space)
    if (
      (!event.shiftKey && (code === 'KeyS' || key === 's' || key === 'ы')) ||
      code === 'Space' ||
      key === ' '
    ) {
      consumeEvent(event, toggleActiveLayerVisible)
      return
    }

    // When layer is hidden, do not apply nudge, mode or opacity adjustments
    if (!layer.visible) return

    // Move / Lock toggle (i)
    if ((code === 'KeyI' || key === 'i' || key === 'ш') && !event.shiftKey) {
      consumeEvent(event, () => toggleActiveLayerLock(layer.id))
      return
    }

    // Nudge: Arrows or h/j/k/l (ALWAYS works when layer exists)
    const step = event.shiftKey ? 10 : 1
    if (code === 'KeyH' || key === 'h' || key === 'р' || code === 'ArrowLeft') {
      consumeEvent(event, () => moveActiveLayerBy(-step, 0))
      return
    }
    if (
      code === 'KeyL' ||
      key === 'l' ||
      key === 'д' ||
      code === 'ArrowRight'
    ) {
      consumeEvent(event, () => moveActiveLayerBy(step, 0))
      return
    }
    if (code === 'KeyK' || key === 'k' || key === 'л' || code === 'ArrowUp') {
      consumeEvent(event, () => moveActiveLayerBy(0, -step))
      return
    }
    if (
      code === 'KeyJ' ||
      key === 'j' ||
      key === 'о' ||
      code === 'ArrowDown'
    ) {
      consumeEvent(event, () => moveActiveLayerBy(0, step))
      return
    }

    // Opacity adjustments: - / + (or =)
    if (code === 'Minus' || code === 'Equal' || key === '-' || key === '=') {
      const opacityStep = event.shiftKey ? 0.01 : 0.1
      consumeEvent(event, () =>
        adjustActiveLayerOpacity(
          code === 'Equal' || key === '=' ? opacityStep : -opacityStep
        )
      )
      return
    }

    // Opacity numbers: 1–9
    if (!event.shiftKey && (/^Digit[1-9]$/.test(code) || /^[1-9]$/.test(key))) {
      const digit = Number.parseInt(key || code.replace('Digit', ''), 10)
      if (!Number.isNaN(digit)) {
        consumeEvent(event, () => setActiveLayerOpacity(digit / 10))
        return
      }
    }

    // Snap to top-center (0 / Home)
    if (
      !event.shiftKey &&
      (code === 'Digit0' ||
        code === 'Numpad0' ||
        key === '0' ||
        code === 'Home')
    ) {
      consumeEvent(event, snapTopCenterAction)
      return
    }

    // Reset origin (r)
    if ((code === 'KeyR' || key === 'r' || key === 'к') && !event.shiftKey) {
      consumeEvent(event, resetOriginAction)
      return
    }

    // Center X (x)
    if ((code === 'KeyX' || key === 'x' || key === 'ч') && !event.shiftKey) {
      consumeEvent(event, snapCenterXAction)
      return
    }

    // Top Y (y)
    if ((code === 'KeyY' || key === 'y' || key === 'н') && !event.shiftKey) {
      consumeEvent(event, snapTopYAction)
      return
    }

    // Color invert (v)
    if ((code === 'KeyV' || key === 'v' || key === 'м') && !event.shiftKey) {
      consumeEvent(event, toggleActiveLayerInvert)
      return
    }

    // Cycle scale: 1x -> 2x -> Auto (z)
    if ((code === 'KeyZ' || key === 'z' || key === 'я') && !event.shiftKey) {
      consumeEvent(event, cycleScaleModeAction)
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown, { capture: true })
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown, { capture: true })
  })
}
