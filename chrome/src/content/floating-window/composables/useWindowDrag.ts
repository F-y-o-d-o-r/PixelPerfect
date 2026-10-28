import { ref } from 'vue'
import { DOM_HOST_IDS } from '@/shared/constants'
import type { FloatingWindowPosition } from '@/shared/types'
import { focusKeyboardReceiverInShadowDom } from './useKeyboard'
import { useStorage } from './useStorage'

function setDragSnapHintVisible(visible: boolean): void {
  const overlayHost = document.getElementById(DOM_HOST_IDS.OVERLAY)
  const pill = overlayHost?.shadowRoot?.querySelector(
    '.pp-move-pill'
  ) as HTMLElement | null
  if (pill) {
    pill.style.display = visible ? 'block' : 'none'
  }
}

const WINDOW_SNAP_THRESHOLD_PX = 20
const DRAG_START_DISTANCE_PX = 4

function computeSnappedWindowPosition(
  rawLeft: number,
  rawTop: number,
  maxX: number,
  maxY: number,
  disableSnap: boolean
): FloatingWindowPosition {
  let x = Math.min(maxX, Math.max(0, rawLeft))
  let y = Math.min(maxY, Math.max(0, rawTop))

  if (disableSnap) {
    return {
      x,
      y,
      dockCorner: 'free',
      dockEdgeX: 'none',
      dockEdgeY: 'none',
    }
  }

  const centerX = Math.round(maxX / 2)
  const centerY = Math.round(maxY / 2)
  let dockEdgeX: FloatingWindowPosition['dockEdgeX'] = 'none'
  let dockEdgeY: FloatingWindowPosition['dockEdgeY'] = 'none'

  if (x <= WINDOW_SNAP_THRESHOLD_PX) {
    x = 0
    dockEdgeX = 'left'
  } else if (maxX - x <= WINDOW_SNAP_THRESHOLD_PX) {
    x = 0
    dockEdgeX = 'right'
  } else if (Math.abs(x - centerX) <= WINDOW_SNAP_THRESHOLD_PX) {
    x = centerX
    dockEdgeX = 'center'
  }

  if (y <= WINDOW_SNAP_THRESHOLD_PX) {
    y = 0
    dockEdgeY = 'top'
  } else if (maxY - y <= WINDOW_SNAP_THRESHOLD_PX) {
    y = 0
    dockEdgeY = 'bottom'
  } else if (Math.abs(y - centerY) <= WINDOW_SNAP_THRESHOLD_PX) {
    y = centerY
    dockEdgeY = 'center'
  }

  let dockCorner: FloatingWindowPosition['dockCorner'] = 'free'
  if (dockEdgeX === 'right' && dockEdgeY === 'top') {
    dockCorner = 'top-right'
  } else if (dockEdgeX === 'left' && dockEdgeY === 'top') {
    dockCorner = 'top-left'
  } else if (dockEdgeX === 'right' && dockEdgeY === 'bottom') {
    dockCorner = 'bottom-right'
  } else if (dockEdgeX === 'left' && dockEdgeY === 'bottom') {
    dockCorner = 'bottom-left'
  }

  return {
    x,
    y,
    dockCorner,
    dockEdgeX,
    dockEdgeY,
  }
}

export function useWindowDrag() {
  const { windowState } = useStorage()
  const isDraggingWindow = ref(false)
  let dragOffsetX = 0
  let dragOffsetY = 0

  function suppressClickAfterWindowDrag(clickEvent: MouseEvent): void {
    clickEvent.stopPropagation()
    clickEvent.preventDefault()
    focusKeyboardReceiverInShadowDom()
  }

  function startDragFloatingWindow(event: PointerEvent): void {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    const isInsideMinibar = Boolean(target.closest('.pp-minibar'))
    if (!isInsideMinibar && target.closest('button')) {
      return
    }

    const windowElement = (event.currentTarget as HTMLElement).closest(
      '.pp-floating-window'
    ) as HTMLElement | null
    if (!windowElement) return

    const rect = windowElement.getBoundingClientRect()
    const startClientX = event.clientX
    const startClientY = event.clientY
    dragOffsetX = event.clientX - rect.left
    dragOffsetY = event.clientY - rect.top
    let hasMovedBeyondThreshold = false
    let lockedAxis: 'x' | 'y' | null = null

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startClientX
      const deltaY = moveEvent.clientY - startClientY
      if (!hasMovedBeyondThreshold) {
        if (
          Math.abs(deltaX) < DRAG_START_DISTANCE_PX &&
          Math.abs(deltaY) < DRAG_START_DISTANCE_PX
        ) {
          return
        }
        hasMovedBeyondThreshold = true
        isDraggingWindow.value = true
        setDragSnapHintVisible(true)
      }

      let currentClientX = moveEvent.clientX
      let currentClientY = moveEvent.clientY

      if (moveEvent.shiftKey) {
        if (!lockedAxis && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
          lockedAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y'
        }
        if (lockedAxis === 'x') {
          currentClientY = startClientY
        } else if (lockedAxis === 'y') {
          currentClientX = startClientX
        }
      } else {
        lockedAxis = null
      }

      const currentRect = windowElement.getBoundingClientRect()
      const viewportWidth = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth || window.innerWidth
      )
      const viewportHeight = Math.min(
        window.innerHeight,
        document.documentElement.clientHeight || window.innerHeight
      )
      const maxX = Math.max(0, viewportWidth - currentRect.width)
      const maxY = Math.max(0, viewportHeight - currentRect.height)
      const rawLeft = Math.round(currentClientX - dragOffsetX)
      const rawTop = Math.round(currentClientY - dragOffsetY)

      let nextPos = computeSnappedWindowPosition(
        rawLeft,
        rawTop,
        maxX,
        maxY,
        moveEvent.altKey
      )

      if (moveEvent.shiftKey && lockedAxis === 'x') {
        nextPos = {
          ...nextPos,
          y: Math.min(
            maxY,
            Math.max(0, Math.round(startClientY - dragOffsetY))
          ),
          dockEdgeY: 'none',
          dockCorner: 'free',
        }
      } else if (moveEvent.shiftKey && lockedAxis === 'y') {
        nextPos = {
          ...nextPos,
          x: Math.min(
            maxX,
            Math.max(0, Math.round(startClientX - dragOffsetX))
          ),
          dockEdgeX: 'none',
          dockCorner: 'free',
        }
      }

      windowState.position = nextPos
    }

    const onPointerUp = () => {
      if (hasMovedBeyondThreshold) {
        setDragSnapHintVisible(false)
        window.addEventListener('click', suppressClickAfterWindowDrag, {
          capture: true,
          once: true,
        })
      }
      lockedAxis = null
      isDraggingWindow.value = false
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      setTimeout(() => {
        focusKeyboardReceiverInShadowDom()
      }, 0)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return {
    isDraggingWindow,
    startDragFloatingWindow,
  }
}
