import { ref } from 'vue'
import { useStorage } from '../composables/useStorage'

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

export function useMockupImport() {
  const { addLayerFromBlob, showToast, uiStrings } = useStorage()

  function isSupportedImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) return true
    return /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(file.name)
  }

  async function importImageFiles(files: FileList | null): Promise<void> {
    if (!files?.length) return
    let imported = 0
    let invalid = 0
    for (const file of Array.from(files)) {
      if (isSupportedImageFile(file)) {
        try {
          if (await addLayerFromBlob(file, file.name.replace(/\.[^/.]+$/, '')))
            imported++
        } catch {
          showToast(uiStrings.value.toastUploadFailed)
        }
      } else {
        invalid++
      }
    }
    if (invalid > 0 && imported === 0) {
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
        const type = item.types.find((t) => t.startsWith('image/'))
        if (type) {
          await addLayerFromBlob(await item.getType(type), 'Pasted Frame')
          return
        }
        if (item.types.includes('text/plain')) {
          const text = (await (await item.getType('text/plain')).text()).trim()
          if (text.startsWith('<svg') && text.endsWith('</svg>')) {
            await addLayerFromBlob(
              new Blob([text], { type: 'image/svg+xml' }),
              'Pasted SVG'
            )
            return
          }
        }
      }
      showToast(uiStrings.value.toastNoClipboardImage)
    } catch {
      showToast(uiStrings.value.toastUseKeyboardPaste)
    }
  }

  function triggerFileUpload(): void {
    fileInputRef.value?.click()
  }

  return {
    fileInputRef,
    isDragOver,
    triggerFileUpload,
    onFileSelected,
    onDropFiles,
    pasteFromClipboard,
  }
}
