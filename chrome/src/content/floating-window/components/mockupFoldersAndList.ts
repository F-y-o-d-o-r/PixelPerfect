import { ref } from 'vue'
import { useStorage } from '../composables/useStorage'

export function useMockupFoldersAndList() {
  const {
    folders,
    layers,
    addLayerFromBlob,
    removeFolder,
    removeLayer,
    showToast,
    uiStrings,
  } = useStorage()
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isDragOver = ref(false)

  function confirmRemoveLayer(layerId: string): void {
    const layerName = layers.value.find((layer) => layer.id === layerId)?.name ?? ''
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

  async function importImageFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '')
        await addLayerFromBlob(file, cleanName)
      }
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
      }
      showToast(uiStrings.value.toastNoClipboardImage)
    } catch {
      showToast(uiStrings.value.toastUseKeyboardPaste)
    }
  }

  return {
    fileInputRef,
    isDragOver,
    triggerFileUpload,
    onFileSelected,
    onDropFiles,
    pasteFromClipboard,
    confirmRemoveLayer,
    confirmRemoveFolder,
  }
}
