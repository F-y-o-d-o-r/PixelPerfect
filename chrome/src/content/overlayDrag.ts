import { DOM_HOST_IDS } from '@/shared/constants'
import { isExtensionContextValid } from '@/storage/db'
import { useStorage } from './floating-window/composables/useStorage'

export function registerOverlayDragHandlers(wrapperElement: HTMLElement): void {
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
    wrapperElement.setPointerCapture(event.pointerId)
  })

  wrapperElement.addEventListener('pointermove', (event: PointerEvent) => {
    if (!isDragging || !activeLayer.value) return
    const deltaX = Math.round(event.clientX - dragStartX)
    const deltaY = Math.round(event.clientY - dragStartY)
    wrapperElement.style.left = `${startLayerX + deltaX}px`
    wrapperElement.style.top = `${startLayerY + deltaY}px`
  })

  wrapperElement.addEventListener('pointerup', (event: PointerEvent) => {
    if (!isDragging || !activeLayer.value) return
    isDragging = false
    wrapperElement.releasePointerCapture(event.pointerId)
    const deltaX = Math.round(event.clientX - dragStartX)
    const deltaY = Math.round(event.clientY - dragStartY)
    updateLayer(activeLayer.value.id, {
      x: startLayerX + deltaX,
      y: startLayerY + deltaY,
    })
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
