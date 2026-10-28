import {
  calculateDropPosition,
  draggedFolderId,
  draggedLayerId,
  dragOverFolderId,
  folderDropPosition,
  getDropIndicatorClass,
  resetFolderDragState,
  resetLayerDragState,
} from '../composables/reorder'
import { useStorage } from '../composables/useStorage'

export function useFolderTabs() {
  const {
    folders,
    currentFolder,
    windowState,
    uiStrings,
    addFolder,
    reorderFolders,
    moveLayerToFolder,
    getFolderLayerCount,
  } = useStorage()

  async function handleCreateFolder(): Promise<void> {
    const created = await addFolder()
    if (created) windowState.activeFolderId = created.id
  }

  function selectFolder(folderId: string): void {
    windowState.activeFolderId = folderId
  }

  function onFolderDragStart(event: DragEvent, folderId: string): void {
    draggedFolderId.value = folderId
    event.dataTransfer?.setData('text/plain', folderId)
  }

  function onFolderDragEnd(): void {
    resetFolderDragState()
  }

  function onDragOverFolder(event: DragEvent, folderId: string): void {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'

    if (draggedFolderId.value) {
      if (draggedFolderId.value === folderId) return
      const target = event.currentTarget as HTMLElement | null
      if (!target) return
      const rect = target.getBoundingClientRect()
      const isBefore = event.clientX - rect.left < rect.width / 2

      const srcIdx = folders.value.findIndex(
        (f) => f.id === draggedFolderId.value
      )
      const tgtIdx = folders.value.findIndex((f) => f.id === folderId)
      dragOverFolderId.value = folderId
      folderDropPosition.value = calculateDropPosition(srcIdx, tgtIdx, isBefore)
      return
    }

    if (draggedLayerId.value) {
      dragOverFolderId.value = folderId
      folderDropPosition.value = null
    }
  }

  function onDragLeaveFolder(event: DragEvent, folderId: string): void {
    const cur = event.currentTarget as HTMLElement | null
    const rel = event.relatedTarget as Node | null
    if (cur && rel && cur.contains(rel)) return
    if (dragOverFolderId.value === folderId) {
      dragOverFolderId.value = null
      folderDropPosition.value = null
    }
  }

  function onDragOverTabsContainer(event: DragEvent): void {
    if (!draggedFolderId.value || folders.value.length === 0) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    const target = event.target as HTMLElement | null
    if (target?.closest('.pp-folder-tab')) return
    const container = event.currentTarget as HTMLElement | null
    if (!container) return
    const rect = container.getBoundingClientRect()
    if (event.clientX - rect.left < rect.width * 0.4) {
      const first = folders.value[0]
      if (first && first.id !== draggedFolderId.value) {
        dragOverFolderId.value = first.id
        folderDropPosition.value = 'before'
      }
    }
  }

  async function onDropOnFolder(folderId: string): Promise<void> {
    if (
      draggedFolderId.value &&
      draggedFolderId.value !== folderId &&
      folderDropPosition.value
    ) {
      await reorderFolders(
        draggedFolderId.value,
        folderId,
        folderDropPosition.value
      )
      resetFolderDragState()
      return
    }
    if (draggedLayerId.value) {
      await moveLayerToFolder(draggedLayerId.value, folderId)
      resetLayerDragState()
    }
  }

  async function onDropOnTabsContainer(event: DragEvent): Promise<void> {
    const target = event.target as HTMLElement | null
    if (target?.closest('.pp-folder-tab')) return
    if (dragOverFolderId.value) await onDropOnFolder(dragOverFolderId.value)
  }

  const getTabClass = (id: string) =>
    getDropIndicatorClass(
      id,
      'pp-folder-tab',
      draggedFolderId.value,
      dragOverFolderId.value,
      folderDropPosition.value,
      currentFolder.value?.id === id
    )

  return {
    folders,
    currentFolder,
    uiStrings,
    getFolderLayerCount,
    getTabClass,
    selectFolder,
    handleCreateFolder,
    onFolderDragStart,
    onFolderDragEnd,
    onDragOverFolder,
    onDragLeaveFolder,
    onDropOnFolder,
    onDragOverTabsContainer,
    onDropOnTabsContainer,
  }
}
