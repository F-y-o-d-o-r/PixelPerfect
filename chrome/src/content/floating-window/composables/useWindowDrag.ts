import { ref } from 'vue'
import type { FloatingWindowPosition } from '@/shared/types'
import { useStorage } from './useStorage'

const WINDOW_SNAP_THRESHOLD_PX = 20
const DRAG_START_DISTANCE_PX = 4

function computeSnappedWindowPosition(
  rawLeft: number,
  rawTop: number,
  maxX: number,
  maxY: number
): FloatingWindowPosition {
  let x = Math.min(maxX, Math.max(0, rawLeft))
  let y = Math.min(maxY, Math.max(0, rawTop))

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
      const rawLeft = Math.round(moveEvent.clientX - dragOffsetX)
      const rawTop = Math.round(moveEvent.clientY - dragOffsetY)

      windowState.position = computeSnappedWindowPosition(
        rawLeft,
        rawTop,
        maxX,
        maxY
      )
    }

    const onPointerUp = () => {
      if (hasMovedBeyondThreshold) {
        window.addEventListener('click', suppressClickAfterWindowDrag, {
          capture: true,
          once: true,
        })
      }
      isDraggingWindow.value = false
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return {
    isDraggingWindow,
    startDragFloatingWindow,
  }
}
