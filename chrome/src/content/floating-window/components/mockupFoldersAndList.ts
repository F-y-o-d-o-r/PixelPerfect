import { ref } from 'vue'
import type { LayerMetadata } from '@/shared/types'
import { useStorage } from '../composables/useStorage'

export function useMockupFoldersAndList() {
  const {
    folders,
    layers,
    windowState,
    uiStrings,
    addFolder,
    renameFolder,
    removeFolder,
    moveLayerToFolder,
    reorderLayers,
    addLayerFromBlob,
    updateLayer,
    removeLayer,
    showToast,
  } = useStorage()

  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isDragOver = ref(false)
  const draggedLayerId = ref<string | null>(null)
  const dragOverFolderId = ref<string | null>(null)
  const dragOverLayerId = ref<string | null>(null)
  const dropPosition = ref<'before' | 'after' | null>(null)

  function confirmRemoveLayer(layerId: string): void {
    const layerName =
      layers.value.find((layer) => layer.id === layerId)?.name ?? ''
    const isConfirmed = window.confirm(
      `${uiStrings.value.confirmDeleteMockup}\n${layerName}`
    )
    if (isConfirmed) removeLayer(layerId)
  }

  function confirmRemoveFolder(folderId: string): void {
    const isOnlyFolder = folders.value.length <= 1
    const isConfirmed =
      isOnlyFolder || window.confirm(uiStrings.value.confirmDeletePage)
    if (isConfirmed) removeFolder(folderId)
  }

  function triggerFileUpload(): void {
    fileInputRef.value?.click()
  }

  function isSupportedImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) return true
    return /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(file.name)
  }

  async function importImageFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return
    let importedCount = 0
    let invalidCount = 0

    for (const file of Array.from(files)) {
      if (isSupportedImageFile(file)) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '')
        try {
          const result = await addLayerFromBlob(file, cleanName)
          if (result) importedCount++
        } catch {
          showToast(uiStrings.value.toastUploadFailed)
        }
      } else {
        invalidCount++
      }
    }

    if (invalidCount > 0 && importedCount === 0) {
      showToast(uiStrings.value.toastInvalidFile)
    }
  }

  async function onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    await importImageFiles(input.files)
    input.value = ''
  }

  async function onDropFiles(event: DragEvent): Promise<void> {
    isDragOver.value = false
    await importImageFiles(event.dataTransfer?.files ?? null)
  }

  async function pasteFromClipboard(): Promise<void> {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          await addLayerFromBlob(blob, 'Pasted Frame')
          return
        }
        if (item.types.includes('text/plain')) {
          const textBlob = await item.getType('text/plain')
          const text = (await textBlob.text()).trim()
          if (text.startsWith('<svg') && text.endsWith('</svg>')) {
            const svgBlob = new Blob([text], { type: 'image/svg+xml' })
            await addLayerFromBlob(svgBlob, 'Pasted SVG')
            return
          }
        }
      }
      showToast(uiStrings.value.toastNoClipboardImage)
    } catch {
      showToast(uiStrings.value.toastUseKeyboardPaste)
    }
  }

  function onLayerDragStart(event: DragEvent, layerId: string): void {
    draggedLayerId.value = layerId
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', layerId)
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function onLayerDragEnd(): void {
    draggedLayerId.value = null
    dragOverFolderId.value = null
    dragOverLayerId.value = null
    dropPosition.value = null
  }

  function onDragOverFolder(event: DragEvent, folderId: string): void {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    dragOverFolderId.value = folderId
  }

  function onDragLeaveFolder(folderId: string): void {
    if (dragOverFolderId.value === folderId) {
      dragOverFolderId.value = null
    }
  }

  async function onDropOnFolder(folderId: string): Promise<void> {
    if (!draggedLayerId.value) return
    await moveLayerToFolder(draggedLayerId.value, folderId)
    onLayerDragEnd()
  }

  function onDragOverLayer(event: DragEvent, targetLayerId: string): void {
    if (!draggedLayerId.value || draggedLayerId.value === targetLayerId) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    const target = event.currentTarget as HTMLElement | null
    if (!target) return
    const rect = target.getBoundingClientRect()
    const isGrid = windowState.viewMode === 'grid'
    const isBefore = isGrid
      ? event.clientX - rect.left < rect.width / 2
      : event.clientY - rect.top < rect.height / 2
    dragOverLayerId.value = targetLayerId
    dropPosition.value = isBefore ? 'before' : 'after'
  }

  function onDragLeaveLayer(targetLayerId: string): void {
    if (dragOverLayerId.value === targetLayerId) {
      dragOverLayerId.value = null
      dropPosition.value = null
    }
  }

  async function onDropOnLayer(targetLayerId: string): Promise<void> {
    if (
      !draggedLayerId.value ||
      draggedLayerId.value === targetLayerId ||
      !dropPosition.value
    )
      return
    await reorderLayers(draggedLayerId.value, targetLayerId, dropPosition.value)
    onLayerDragEnd()
  }

  function selectLayer(layer: LayerMetadata): void {
    windowState.activeLayerId = layer.id
    showToast(layer.name)
  }

  async function handleCreateFolder(): Promise<void> {
    const created = await addFolder()
    if (created) windowState.activeFolderId = created.id
  }

  function handleRenameFolder(folderId: string, currentName: string): void {
    const nextName = window.prompt(
      uiStrings.value.promptRenamePage,
      currentName
    )
    if (nextName && nextName.trim()) renameFolder(folderId, nextName.trim())
  }

  function handleRenameLayer(layerId: string, currentName: string): void {
    const nextName = window.prompt(
      uiStrings.value.promptRenameMockup,
      currentName
    )
    if (nextName && nextName.trim()) {
      updateLayer(layerId, { name: nextName.trim() })
    }
  }

  function toggleViewMode(): void {
    windowState.viewMode = windowState.viewMode === 'grid' ? 'list' : 'grid'
  }

  return {
    fileInputRef,
    isDragOver,
    draggedLayerId,
    dragOverFolderId,
    dragOverLayerId,
    dropPosition,
    triggerFileUpload,
    onFileSelected,
    onDropFiles,
    pasteFromClipboard,
    confirmRemoveLayer,
    confirmRemoveFolder,
    onLayerDragStart,
    onLayerDragEnd,
    onDragOverFolder,
    onDragLeaveFolder,
    onDropOnFolder,
    onDragOverLayer,
    onDragLeaveLayer,
    onDropOnLayer,
    selectLayer,
    handleCreateFolder,
    handleRenameFolder,
    handleRenameLayer,
    toggleViewMode,
  }
}
