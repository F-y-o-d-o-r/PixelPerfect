import { DOM_HOST_IDS } from '@/shared/constants'

export const KEYBOARD_TRAP_ID = 'pp-keyboard-focus-receiver'

export function isUserTypingInRealInput(event: KeyboardEvent): boolean {
  const path = event.composedPath()
  for (const node of path) {
    if (!(node instanceof HTMLElement)) continue
    if (node.id === KEYBOARD_TRAP_ID) continue
    const tag = node.tagName
    if (tag === 'INPUT') {
      const type = (node as HTMLInputElement).type
      if (
        type === 'range' ||
        type === 'checkbox' ||
        type === 'radio' ||
        type === 'file' ||
        type === 'button' ||
        type === 'submit'
      ) {
        continue
      }
      return true
    }
    if (tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable) {
      return true
    }
  }
  return false
}

export function focusKeyboardReceiverInShadowDom(): void {
  const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
  const trapInput = host?.shadowRoot?.getElementById(
    KEYBOARD_TRAP_ID
  ) as HTMLInputElement | null
  if (!trapInput) return
  trapInput.focus({ preventScroll: true })
}

export function isWidgetFocused(): boolean {
  const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
  if (!host) return false
  return (
    document.activeElement === host ||
    Boolean(host.shadowRoot?.activeElement)
  )
}

export function releaseFocusToPage(): void {
  const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
  const trapInput = host?.shadowRoot?.getElementById(
    KEYBOARD_TRAP_ID
  ) as HTMLInputElement | null
  trapInput?.blur()
  if (host instanceof HTMLElement) {
    host.blur()
  }
  if (!document.body.hasAttribute('tabindex')) {
    document.body.setAttribute('tabindex', '-1')
  }
  document.body.focus({ preventScroll: true })
  window.focus()
}
