import { computed, nextTick, ref } from 'vue'
import { windowState } from './storageState'

export function useWindowPosition() {
  const floatingWindowRef = ref<HTMLElement | null>(null)

  const isDockedRight = computed(
    () =>
      windowState.position.dockEdgeX === 'right' ||
      (windowState.position.dockCorner === 'top-right' &&
        windowState.position.x === 0) ||
      windowState.position.dockCorner === 'bottom-right'
  )

  const isDockedLeft = computed(
    () =>
      windowState.position.dockEdgeX === 'left' ||
      windowState.position.dockCorner === 'top-left' ||
      windowState.position.dockCorner === 'bottom-left'
  )

  const isDockedTop = computed(
    () =>
      windowState.position.dockEdgeY === 'top' ||
      (windowState.position.dockCorner === 'top-right' &&
        windowState.position.y === 0) ||
      windowState.position.dockCorner === 'top-left'
  )

  const isDockedBottom = computed(
    () =>
      windowState.position.dockEdgeY === 'bottom' ||
      windowState.position.dockCorner === 'bottom-right' ||
      windowState.position.dockCorner === 'bottom-left'
  )

  const windowPositionStyle = computed(() => {
    const horizontalStyle = isDockedRight.value
      ? { left: 'auto', right: '0px' }
      : { left: `${windowState.position.x}px`, right: 'auto' }
    const verticalStyle = isDockedBottom.value
      ? { top: 'auto', bottom: '0px' }
      : { top: `${windowState.position.y}px`, bottom: 'auto' }
    return {
      ...horizontalStyle,
      ...verticalStyle,
    }
  })

  function clampAndSnapWindowToViewport(): void {
    const element = floatingWindowRef.value
    if (!element || !windowState.visible) return

    const rect = element.getBoundingClientRect()
    const viewportWidth = Math.min(
      window.innerWidth,
      document.documentElement.clientWidth || window.innerWidth
    )
    const viewportHeight = Math.min(
      window.innerHeight,
      document.documentElement.clientHeight || window.innerHeight
    )

    let nextX = windowState.position.x
    let nextY = windowState.position.y
    let nextEdgeX =
      windowState.position.dockEdgeX ??
      (isDockedRight.value ? 'right' : isDockedLeft.value ? 'left' : 'none')
    let nextEdgeY =
      windowState.position.dockEdgeY ??
      (isDockedTop.value ? 'top' : isDockedBottom.value ? 'bottom' : 'none')
    let changed = false

    if (nextEdgeY !== 'bottom' && rect.bottom >= viewportHeight - 20) {
      nextY = 0
      nextEdgeY = 'bottom'
      changed = true
    } else if (nextEdgeY !== 'top' && rect.top < 0) {
      nextY = 0
      nextEdgeY = 'top'
      changed = true
    }

    if (nextEdgeX !== 'right' && rect.right >= viewportWidth - 20) {
      nextX = 0
      nextEdgeX = 'right'
      changed = true
    } else if (nextEdgeX !== 'left' && rect.left < 0) {
      nextX = 0
      nextEdgeX = 'left'
      changed = true
    }

    if (!changed) return

    let nextCorner: typeof windowState.position.dockCorner = 'free'
    if (nextEdgeX === 'right' && nextEdgeY === 'top') nextCorner = 'top-right'
    else if (nextEdgeX === 'left' && nextEdgeY === 'top') nextCorner = 'top-left'
    else if (nextEdgeX === 'right' && nextEdgeY === 'bottom')
      nextCorner = 'bottom-right'
    else if (nextEdgeX === 'left' && nextEdgeY === 'bottom')
      nextCorner = 'bottom-left'

    windowState.position = {
      x: nextX,
      y: nextY,
      dockCorner: nextCorner,
      dockEdgeX: nextEdgeX,
      dockEdgeY: nextEdgeY,
    }
  }

  async function snapAfterLayoutChange(): Promise<void> {
    await nextTick()
    clampAndSnapWindowToViewport()
  }

  return {
    floatingWindowRef,
    isDockedRight,
    isDockedLeft,
    isDockedTop,
    isDockedBottom,
    windowPositionStyle,
    clampAndSnapWindowToViewport,
    snapAfterLayoutChange,
  }
}
