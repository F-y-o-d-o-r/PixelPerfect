import { ref } from 'vue'
import { useStorage } from './useStorage'

export function useWindowDrag() {
  const { windowState } = useStorage()
  const isDraggingWindow = ref(false)
  let dragOffsetX = 0
  let dragOffsetY = 0

  function startDragFloatingWindow(event: PointerEvent): void {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (
      target.closest('button') &&
      !target.classList.contains('pp-minibar__expand')
    ) {
      return
    }

    const windowElement = (event.currentTarget as HTMLElement).closest(
      '.pp-floating-window'
    ) as HTMLElement | null
    if (!windowElement) return

    const rect = windowElement.getBoundingClientRect()
    isDraggingWindow.value = true
    dragOffsetX = event.clientX - rect.left
    dragOffsetY = event.clientY - rect.top

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingWindow.value) return
      const maxX = Math.max(0, window.innerWidth - rect.width)
      const maxY = Math.max(0, window.innerHeight - rect.height)
      const nextLeft = Math.min(
        maxX,
        Math.max(0, Math.round(moveEvent.clientX - dragOffsetX))
      )
      const nextTop = Math.min(
        maxY,
        Math.max(0, Math.round(moveEvent.clientY - dragOffsetY))
      )

      const distanceFromRightEdge = maxX - nextLeft
      if (distanceFromRightEdge <= 12 && nextTop <= 12) {
        windowState.position = {
          x: 0,
          y: 0,
          dockCorner: 'top-right',
        }
        return
      }

      windowState.position = {
        x: nextLeft,
        y: nextTop,
        dockCorner: 'free',
      }
    }

    const onPointerUp = () => {
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
