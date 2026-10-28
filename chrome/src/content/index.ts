import { createApp } from 'vue'
import { DOM_HOST_IDS } from '@/shared/constants'
import type { ExtensionMessage } from '@/shared/types'
import FloatingWindow from './floating-window/FloatingWindow.vue'
import { useStorage } from './floating-window/composables/useStorage'
import floatingWindowStyles from './floating-window/styles/floating-window.sass?inline'
import { initOverlayRenderer } from './overlay'

function removeStaleHostElementsIfPresent(): void {
  document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)?.remove()
  document.getElementById(DOM_HOST_IDS.OVERLAY)?.remove()
}

function attachCompiledStylesToShadowRoot(shadowRoot: ShadowRoot): void {
  const styleSheet = new CSSStyleSheet()
  styleSheet.replaceSync(floatingWindowStyles)
  shadowRoot.adoptedStyleSheets = [styleSheet]
}

function promoteHostToBrowserTopLayer(hostElement: HTMLElement): void {
  if ('showPopover' in HTMLElement.prototype) {
    hostElement.setAttribute('popover', 'manual')
    try {
      hostElement.showPopover()
    } catch {
      return
    }
  }
}

function guardHostAgainstModalInertAttributes(hostElement: HTMLElement): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.attributeName === 'inert' &&
        hostElement.hasAttribute('inert')
      ) {
        hostElement.removeAttribute('inert')
      }
      if (
        mutation.attributeName === 'aria-hidden' &&
        hostElement.getAttribute('aria-hidden') === 'true'
      ) {
        hostElement.removeAttribute('aria-hidden')
      }
    }
  })

  observer.observe(hostElement, {
    attributes: true,
    attributeFilter: ['inert', 'aria-hidden'],
  })
}

function mountFloatingWindowInShadowDom(): void {
  const hostElement = document.createElement('div')
  hostElement.id = DOM_HOST_IDS.FLOATING_WINDOW
  document.documentElement.appendChild(hostElement)
  promoteHostToBrowserTopLayer(hostElement)
  guardHostAgainstModalInertAttributes(hostElement)

  const shadowRoot = hostElement.attachShadow({ mode: 'open' })
  attachCompiledStylesToShadowRoot(shadowRoot)

  const mountElement = document.createElement('div')
  mountElement.id = DOM_HOST_IDS.FLOATING_WINDOW_MOUNT
  shadowRoot.appendChild(mountElement)

  createApp(FloatingWindow).mount(mountElement)
}

function isClipboardEventInsideEditableElement(event: ClipboardEvent): boolean {
  return event
    .composedPath()
    .some(
      (node) =>
        node instanceof HTMLElement &&
        (node.tagName === 'INPUT' ||
          node.tagName === 'TEXTAREA' ||
          node.isContentEditable)
    )
}

function extractFirstImageFileFromClipboard(
  event: ClipboardEvent
): File | null {
  const clipboardItems = event.clipboardData?.items
  if (!clipboardItems) return null

  for (const item of Array.from(clipboardItems)) {
    if (item.type.startsWith('image/')) {
      const imageFile = item.getAsFile()
      if (imageFile) return imageFile
    }
  }
  return null
}

function registerClipboardPasteListener(): void {
  const { windowState, addLayerFromBlob } = useStorage()

  window.addEventListener('paste', async (event: ClipboardEvent) => {
    if (!windowState.visible) return
    if (isClipboardEventInsideEditableElement(event)) return

    const imageFile = extractFirstImageFileFromClipboard(event)
    if (!imageFile) return

    event.preventDefault()
    await addLayerFromBlob(imageFile, 'Pasted Frame')
  })
}

function registerBrowserHistoryNavigationListener(): void {
  const { autoSelectLayerForUrl } = useStorage()
  window.addEventListener('popstate', () => {
    autoSelectLayerForUrl()
  })
}

function registerExtensionMessageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return
  const { windowState } = useStorage()

  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      if (message.type === 'PP_TOGGLE_FLOATING_WINDOW') {
        windowState.visible = !windowState.visible
        sendResponse({ visible: windowState.visible })
      }
      return false
    }
  )
}

function initializePixelPerfectContentScript(): void {
  removeStaleHostElementsIfPresent()
  mountFloatingWindowInShadowDom()
  initOverlayRenderer()
  registerClipboardPasteListener()
  registerBrowserHistoryNavigationListener()
  registerExtensionMessageListener()
}

initializePixelPerfectContentScript()
