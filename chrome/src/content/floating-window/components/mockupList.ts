import type { LayerMetadata } from '@/shared/types'
import {
  calculateLayerDropPosition,
  draggedLayerId,
  dragOverLayerId,
  getDropIndicatorClass,
  layerDropPosition,
  resetLayerDragState,
} from '../composables/reorder'
import { persistWindowState } from '../composables/storageState'
import { useStorage } from '../composables/useStorage'
import { useMockupImport } from './mockupImport'

export function useMockupList() {
  const {
    folders,
    layers,
    currentFolder,
    currentFolderLayers,
    activeLayer,
    layerObjectUrls,
    windowState,
    uiStrings,
    removeFolder,
    renameFolder,
    reorderLayers,
    updateLayer,
    removeLayer,
    showToast,
  } = useStorage()

  const mockupImport = useMockupImport()

  function confirmRemoveLayer(layerId: string): void {
    const layer = layers.value.find((l) => l.id === layerId)
    if (
      window.confirm(
        `${uiStrings.value.confirmDeleteMockup}\n${layer?.name ?? ''}`
      )
    ) {
      removeLayer(layerId)
    }
  }

  function confirmRemoveFolder(folderId: string): void {
    if (
      folders.value.length <= 1 ||
      window.confirm(uiStrings.value.confirmDeletePage)
    ) {
      removeFolder(folderId)
    }
  }

  function handleRenameFolder(folderId: string, currentName: string): void {
    const next = window
      .prompt(uiStrings.value.promptRenamePage, currentName)
      ?.trim()
    if (next) renameFolder(folderId, next)
  }

  function handleRenameLayer(layerId: string, currentName: string): void {
    const next = window
      .prompt(uiStrings.value.promptRenameMockup, currentName)
      ?.trim()
    if (next) updateLayer(layerId, { name: next })
  }

  function toggleViewMode(): void {
    windowState.viewMode = windowState.viewMode === 'grid' ? 'list' : 'grid'
    persistWindowState()
  }

  function selectLayer(layer: LayerMetadata): void {
    if (windowState.activeLayerId !== layer.id) {
      windowState.vimMode = 'locked'
      updateLayer(layer.id, { locked: true })
    }
    windowState.activeLayerId = layer.id
    if (!layer.visible) {
      updateLayer(layer.id, { visible: true })
    }
    showToast(layer.name)
  }

  function onLayerDragStart(event: DragEvent, layerId: string): void {
    draggedLayerId.value = layerId
    event.dataTransfer?.setData('text/plain', layerId)
  }

  function onLayerDragEnd(): void {
    resetLayerDragState()
  }

  function onDragOverLayer(event: DragEvent, targetLayerId: string): void {
    if (!draggedLayerId.value || draggedLayerId.value === targetLayerId) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    const target = event.currentTarget as HTMLElement | null
    if (!target) return
    dragOverLayerId.value = targetLayerId
    layerDropPosition.value = calculateLayerDropPosition(
      event.clientX,
      event.clientY,
      target.getBoundingClientRect(),
      windowState.viewMode === 'grid'
    )
  }

  function onDragLeaveLayer(targetLayerId: string): void {
    if (dragOverLayerId.value === targetLayerId) {
      dragOverLayerId.value = null
      layerDropPosition.value = null
    }
  }

  async function onDropOnLayer(targetLayerId: string): Promise<void> {
    if (
      !draggedLayerId.value ||
      draggedLayerId.value === targetLayerId ||
      !layerDropPosition.value
    )
      return
    await reorderLayers(
      draggedLayerId.value,
      targetLayerId,
      layerDropPosition.value
    )
    resetLayerDragState()
  }

  const getLayerCardClass = (id: string) =>
    getDropIndicatorClass(
      id,
      'pp-layer-card',
      draggedLayerId.value,
      dragOverLayerId.value,
      layerDropPosition.value,
      activeLayer.value?.id === id
    )

  const getLayerRowClass = (id: string) =>
    getDropIndicatorClass(
      id,
      'pp-layer-row',
      draggedLayerId.value,
      dragOverLayerId.value,
      layerDropPosition.value,
      activeLayer.value?.id === id
    )

  return {
    ...mockupImport,
    folders,
    currentFolder,
    currentFolderLayers,
    layerObjectUrls,
    windowState,
    uiStrings,
    confirmRemoveLayer,
    confirmRemoveFolder,
    handleRenameFolder,
    handleRenameLayer,
    toggleViewMode,
    selectLayer,
    onLayerDragStart,
    onLayerDragEnd,
    onDragOverLayer,
    onDragLeaveLayer,
    onDropOnLayer,
    getLayerCardClass,
    getLayerRowClass,
  }
}
