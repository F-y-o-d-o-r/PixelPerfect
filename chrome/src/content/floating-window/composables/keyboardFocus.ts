import { DOM_HOST_IDS } from '@/shared/constants'

export function releaseHostPageFocus(): void {
  const active = document.activeElement as HTMLElement | null
  if (active && active !== document.body && typeof active.blur === 'function') {
    active.blur()
  }
}

export function isUserTypingInRealInput(event: KeyboardEvent): boolean {
  const path = event.composedPath()
  const isInsideWidget = path.some(
    (node) =>
      node instanceof HTMLElement && node.id === DOM_HOST_IDS.FLOATING_WINDOW
  )

  const target = path[0]
  if (!(target instanceof HTMLElement)) return false

  if (isInsideWidget) {
    if (target.tagName === 'INPUT') {
      const inputType = (target as HTMLInputElement).type
      return inputType === 'number' || inputType === 'text'
    }
    return false
  }

  const tag = target.tagName
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type
    if (
      type === 'range' ||
      type === 'checkbox' ||
      type === 'radio' ||
      type === 'file' ||
      type === 'button' ||
      type === 'submit'
    ) {
      return false
    }
    return true
  }

  if (tag === 'TEXTAREA' || tag === 'SELECT') {
    return true
  }

  if (target.isContentEditable) {
    return true
  }

  return false
}

