import { DOM_HOST_IDS } from '@/shared/constants'
import type { LayerMetadata } from '@/shared/types'
import { isExtensionContextValid } from '@/storage/blobStorage'
import { focusKeyboardReceiverInShadowDom } from './floating-window/composables/useKeyboard'
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
  disableSnap: boolean
): { x: number; y: number } {
  if (disableSnap) {
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
    movePillElement.style.display = 'block'
    wrapperElement.setPointerCapture(event.pointerId)
  })

  wrapperElement.addEventListener('pointermove', (event: PointerEvent) => {
    const layer = activeLayer.value
    if (!isDragging || !layer) return
    const rawX = startLayerX + Math.round(event.clientX - dragStartX)
    const rawY = startLayerY + Math.round(event.clientY - dragStartY)
    const { x, y } = calculateSnappedLayerCoordinates(
      rawX,
      rawY,
      layer,
      event.altKey
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
    const rawX = startLayerX + Math.round(event.clientX - dragStartX)
    const rawY = startLayerY + Math.round(event.clientY - dragStartY)
    const { x, y } = calculateSnappedLayerCoordinates(
      rawX,
      rawY,
      layer,
      event.altKey
    )
    updateLayer(layer.id, { x, y })
    focusKeyboardReceiverInShadowDom()
  })

  wrapperElement.addEventListener('pointercancel', () => {
    isDragging = false
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

export function registerOutsideClickLockHandler(
  wrapperElement: HTMLElement
): void {
  const { activeLayer, windowState, uiStrings, updateLayer, showToast } =
    useStorage()

  window.addEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      if (!isExtensionContextValid()) return
      if (windowState.vimMode !== 'move' || !activeLayer.value) return
      const path = event.composedPath()
      const clickedInsideFloatingWindow = path.some(
        (node) =>
          node instanceof HTMLElement &&
          node.id === DOM_HOST_IDS.FLOATING_WINDOW
      )
      const clickedInsideOverlay = path.includes(wrapperElement)

      if (!clickedInsideFloatingWindow && !clickedInsideOverlay) {
        windowState.vimMode = 'locked'
        updateLayer(activeLayer.value.id, { locked: true })
        showToast(uiStrings.value.toastLocked)
      }
    },
    { capture: true }
  )
}
