import { watch } from 'vue'
import { DOM_HOST_IDS } from '@/shared/constants'
import type { LayerMetadata } from '@/shared/types'
import { useStorage } from './floating-window/composables/useStorage'
import { getLayerCssDimensions } from './floating-window/composables/useUrlMatcher'
import { registerOverlayDragHandlers } from './overlayDrag'
import { OVERLAY_SHADOW_STYLES } from './overlayStyles'

interface OverlayElements {
  wrapper: HTMLDivElement
  image: HTMLImageElement
  movePill: HTMLDivElement
}

function getOrCreateOverlayShadowRoot(): ShadowRoot {
  let hostElement = document.getElementById(DOM_HOST_IDS.OVERLAY)
  if (!hostElement) {
    hostElement = document.createElement('div')
    hostElement.id = DOM_HOST_IDS.OVERLAY
    document.documentElement.appendChild(hostElement)
  }

  const shadowRoot =
    hostElement.shadowRoot ?? hostElement.attachShadow({ mode: 'open' })
  const styleSheet = new CSSStyleSheet()
  styleSheet.replaceSync(OVERLAY_SHADOW_STYLES)
  shadowRoot.adoptedStyleSheets = [styleSheet]
  return shadowRoot
}

function renderMovePillHtml(strings: {
  movePillNoSnap: string
  movePillLockAxis: string
}): string {
  return `<kbd>⌥/Alt</kbd> ${strings.movePillNoSnap} <span class="pp-move-pill-sep">·</span> <kbd>⇧/Shift</kbd> ${strings.movePillLockAxis}`
}

function createOverlayElements(shadowRoot: ShadowRoot): OverlayElements {
  const wrapper = document.createElement('div')
  wrapper.className = 'pp-overlay-layer'

  const image = document.createElement('img')
  image.className = 'pp-overlay-img'
  image.alt = 'Pixel Perfect Mockup Overlay'
  wrapper.appendChild(image)

  const movePill = document.createElement('div')
  movePill.className = 'pp-move-pill'
  movePill.style.display = 'none'

  shadowRoot.replaceChildren(wrapper, movePill)
  return { wrapper, image, movePill }
}

function applyOverlayPositionAndVisibility(
  elements: OverlayElements,
  layer: LayerMetadata,
  isMoveActive: boolean
): void {
  const { width, height } = getLayerCssDimensions(layer)
  const roundedX = Math.round(layer.x)
  const roundedY = Math.round(layer.y)

  elements.wrapper.style.display = 'block'
  elements.wrapper.style.left = `${roundedX}px`
  elements.wrapper.style.top = `${roundedY}px`
  elements.wrapper.style.width = `${width}px`
  elements.wrapper.style.height = `${height}px`
  elements.wrapper.style.opacity = String(layer.opacity)
  elements.wrapper.classList.toggle('pp-overlay-layer--move', isMoveActive)
  if (!isMoveActive) {
    elements.movePill.style.display = 'none'
  }

  const isInverted = layer.blendMode === 'invert'
  elements.image.style.filter = isInverted ? 'invert(1)' : 'none'
  elements.wrapper.style.mixBlendMode = 'normal'
  elements.image.style.mixBlendMode = 'normal'

  const hostElement = document.getElementById(DOM_HOST_IDS.OVERLAY)
  if (hostElement) {
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
      roundedY + height
    )
    hostElement.style.height = `${docHeight}px`
  }
}

export function initOverlayRenderer(): void {
  const { activeLayer, windowState, uiStrings, ensureLayerObjectUrl } =
    useStorage()
  const shadowRoot = getOrCreateOverlayShadowRoot()
  const elements = createOverlayElements(shadowRoot)

  registerOverlayDragHandlers(elements.wrapper, elements.movePill)

  async function updateOverlayImageSource(layerId: string): Promise<boolean> {
    const objectUrl = await ensureLayerObjectUrl(layerId)
    if (!objectUrl) return false
    if (elements.image.src !== objectUrl) {
      elements.image.src = objectUrl
    }
    return true
  }

  function hideOverlayElements(): void {
    elements.wrapper.style.display = 'none'
    elements.movePill.style.display = 'none'
    const hostElement = document.getElementById(DOM_HOST_IDS.OVERLAY)
    if (hostElement) {
      hostElement.style.height = '0px'
    }
  }

  async function syncOverlayWithState(): Promise<void> {
    elements.movePill.innerHTML = renderMovePillHtml(uiStrings.value)
    const layer = activeLayer.value
    if (!windowState.visible || !layer || !layer.visible) {
      hideOverlayElements()
      return
    }

    const hasValidImage = await updateOverlayImageSource(layer.id)
    if (!hasValidImage) {
      hideOverlayElements()
      return
    }

    const isMoveActive = windowState.vimMode === 'move' || !layer.locked
    applyOverlayPositionAndVisibility(elements, layer, isMoveActive)
  }

  watch(
    () => [
      windowState.visible,
      windowState.vimMode,
      windowState.locale,
      activeLayer.value?.id,
      activeLayer.value?.x,
      activeLayer.value?.y,
      activeLayer.value?.opacity,
      activeLayer.value?.visible,
      activeLayer.value?.locked,
      activeLayer.value?.scaleMode,
      activeLayer.value?.blendMode,
    ],
    () => {
      syncOverlayWithState()
    },
    { immediate: true }
  )

  window.addEventListener('resize', () => {
    if (activeLayer.value?.scaleMode === 'auto') {
      syncOverlayWithState()
    }
  })
}
