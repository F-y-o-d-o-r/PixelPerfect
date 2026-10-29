export function isUserTypingInRealInput(event: KeyboardEvent): boolean {
  const path = event.composedPath()
  for (const node of path) {
    if (!(node instanceof HTMLElement)) continue
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
