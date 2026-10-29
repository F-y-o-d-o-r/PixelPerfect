import type { LayerMetadata } from '@/shared/types'
import { isExtensionContextValid } from '@/storage/blobStorage'
import { useStorage } from './floating-window/composables/useStorage'
import { getLayerCssDimensions } from './floating-window/composables/useUrlMatcher'

const SNAP_THRESHOLD_PX = 10

function snapValueToTargets(value: number, targets: number[]): number {
  for (const target of targets) {
    if (Math.abs(value - target) <= SNAP_THRESHOLD_PX) {
      return target
    }
  }
  return value
}

function calculateSnappedLayerCoordinates(
  rawX: number,
  rawY: number,
  layer: LayerMetadata,
  enableSnap: boolean
): { x: number; y: number } {
  if (!enableSnap) {
    return { x: rawX, y: rawY }
  }

  const { width } = getLayerCssDimensions(layer)
  const clientWidth = document.documentElement.clientWidth || window.innerWidth
  const centerX = Math.round((clientWidth - width) / 2)
  const rightEdgeX = clientWidth - width
  const currentScrollY = Math.round(window.scrollY || 0)

  const snappedX = snapValueToTargets(rawX, [0, centerX, rightEdgeX])
  const snappedY = snapValueToTargets(rawY, [0, currentScrollY])

  return { x: snappedX, y: snappedY }
}

function calculateConstrainedCoordinates(
  clientX: number,
  clientY: number,
  dragStartX: number,
  dragStartY: number,
  startLayerX: number,
  startLayerY: number,
  layer: LayerMetadata,
  shiftKey: boolean,
  altKey: boolean,
  lockedAxisRef: { current: 'x' | 'y' | null }
): { x: number; y: number } {
  const deltaX = clientX - dragStartX
  const deltaY = clientY - dragStartY

  let constrainedDeltaX = deltaX
  let constrainedDeltaY = deltaY

  if (shiftKey) {
    if (
      !lockedAxisRef.current &&
      (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)
    ) {
      lockedAxisRef.current = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y'
    }
    if (lockedAxisRef.current === 'x') {
      constrainedDeltaY = 0
    } else if (lockedAxisRef.current === 'y') {
      constrainedDeltaX = 0
    }
  } else {
    lockedAxisRef.current = null
  }

  const rawX = startLayerX + Math.round(constrainedDeltaX)
  const rawY = startLayerY + Math.round(constrainedDeltaY)

  let { x, y } = calculateSnappedLayerCoordinates(rawX, rawY, layer, altKey)

  if (shiftKey && lockedAxisRef.current === 'x') {
    y = startLayerY
  } else if (shiftKey && lockedAxisRef.current === 'y') {
    x = startLayerX
  }

  return { x, y }
}

export function registerOverlayDragHandlers(
  wrapperElement: HTMLElement,
  movePillElement: HTMLElement
): void {
  const { activeLayer, windowState, updateLayer } = useStorage()

  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let startLayerX = 0
  let startLayerY = 0
  const lockedAxisRef: { current: 'x' | 'y' | null } = { current: null }

  wrapperElement.addEventListener('pointerdown', (event: PointerEvent) => {
    const layer = activeLayer.value
    if (!layer || windowState.vimMode !== 'move') return
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()
    isDragging = true
    dragStartX = event.clientX
    dragStartY = event.clientY
    startLayerX = layer.x
    startLayerY = layer.y
    lockedAxisRef.current = null
    movePillElement.style.display = 'block'
    wrapperElement.setPointerCapture(event.pointerId)
  })

  wrapperElement.addEventListener('pointermove', (event: PointerEvent) => {
    const layer = activeLayer.value
    if (!isDragging || !layer) return
    const { x, y } = calculateConstrainedCoordinates(
      event.clientX,
      event.clientY,
      dragStartX,
      dragStartY,
      startLayerX,
      startLayerY,
      layer,
      event.shiftKey,
      event.altKey,
      lockedAxisRef
    )
    wrapperElement.style.left = `${x}px`
    wrapperElement.style.top = `${y}px`
  })

  wrapperElement.addEventListener('pointerup', (event: PointerEvent) => {
    const layer = activeLayer.value
    if (!isDragging || !layer) return
    isDragging = false
    movePillElement.style.display = 'none'
    wrapperElement.releasePointerCapture(event.pointerId)
    const { x, y } = calculateConstrainedCoordinates(
      event.clientX,
      event.clientY,
      dragStartX,
      dragStartY,
      startLayerX,
      startLayerY,
      layer,
      event.shiftKey,
      event.altKey,
      lockedAxisRef
    )
    lockedAxisRef.current = null
    updateLayer(layer.id, { x, y })
  })

  wrapperElement.addEventListener('pointercancel', () => {
    isDragging = false
    lockedAxisRef.current = null
    movePillElement.style.display = 'none'
  })

  wrapperElement.addEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (!isExtensionContextValid()) return
      const layer = activeLayer.value
      if (!layer || windowState.vimMode !== 'move') return

      event.preventDefault()
      event.stopPropagation()
      const deltaOpacity = event.deltaY < 0 ? 0.05 : -0.05
      const nextOpacity = Math.min(
        1,
        Math.max(0, Math.round((layer.opacity + deltaOpacity) * 100) / 100)
      )
      updateLayer(layer.id, { opacity: nextOpacity })
    },
    { passive: false }
  )
}
