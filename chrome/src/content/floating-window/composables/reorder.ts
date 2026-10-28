import { ref } from 'vue'

export const draggedLayerId = ref<string | null>(null)
export const draggedFolderId = ref<string | null>(null)
export const dragOverFolderId = ref<string | null>(null)
export const folderDropPosition = ref<'before' | 'after' | null>(null)
export const dragOverLayerId = ref<string | null>(null)
export const layerDropPosition = ref<'before' | 'after' | null>(null)

export function resetFolderDragState(): void {
  draggedFolderId.value = null
  dragOverFolderId.value = null
  folderDropPosition.value = null
}

export function resetLayerDragState(): void {
  draggedLayerId.value = null
  dragOverFolderId.value = null
  dragOverLayerId.value = null
  layerDropPosition.value = null
}

/**
 * Helper to calculate drop indicator classes for reordering items.
 */
export function getDropIndicatorClass(
  itemId: string,
  prefix: string,
  draggedId: string | null,
  dragOverId: string | null,
  dropPos: 'before' | 'after' | null,
  isActive?: boolean
): Record<string, boolean> {
  const isOver = dragOverId === itemId
  return {
    [`${prefix}--active`]: Boolean(isActive),
    [`${prefix}--dragging`]: draggedId === itemId,
    [`${prefix}--dragover`]: isOver && !dropPos,
    [`${prefix}--drop-before`]: isOver && dropPos === 'before',
    [`${prefix}--drop-after`]: isOver && dropPos === 'after',
  }
}

/**
 * Helper to calculate drop position for reordering items.
 * Ensures dropping on an immediate neighbor always swaps instead of no-op.
 */
export function calculateDropPosition(
  sourceIndex: number,
  targetIndex: number,
  isBefore: boolean
): 'before' | 'after' {
  if (targetIndex === sourceIndex - 1) return 'before'
  if (targetIndex === sourceIndex + 1) return 'after'
  if (targetIndex === 0 && sourceIndex > 0 && isBefore) return 'before'
  return isBefore ? 'before' : 'after'
}

/**
 * Helper to calculate drop position in grid or list for layers.
 */
export function calculateLayerDropPosition(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  isGrid: boolean
): 'before' | 'after' {
  const isBefore = isGrid
    ? clientX - rect.left < rect.width / 2
    : clientY - rect.top < rect.height / 2
  return isBefore ? 'before' : 'after'
}

/**
 * Helper to reorder items by their unique id.
 */
export function reorderItemsById<T extends { id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after'
): T[] {
  const next = [...items]
  const sourceIndex = next.findIndex((item) => item.id === sourceId)
  if (sourceIndex === -1) return items
  const [moved] = next.splice(sourceIndex, 1)

  const targetIndex = next.findIndex((item) => item.id === targetId)
  if (targetIndex === -1) return items

  const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex
  next.splice(insertIndex, 0, moved)
  return next
}
