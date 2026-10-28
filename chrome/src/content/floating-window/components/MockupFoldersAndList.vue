<script setup lang="ts">
import { ref } from 'vue'
import { FREE_LIMITS } from '@/shared/constants'
import { useStorage } from '../composables/useStorage'

const {
  visibleFolders,
  currentFolder,
  currentFolderLayers,
  activeLayer,
  layerObjectUrls,
  windowState,
  uiStrings,
  getFolderLayerCount,
  addFolder,
  renameFolder,
  removeFolder,
  addLayerFromBlob,
  updateLayer,
  removeLayer,
  showToast,
} = useStorage()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

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

async function handleCreateFolder(): Promise<void> {
  const created = await addFolder()
  if (created) {
    windowState.activeFolderId = created.id
  }
}

function handleRenameFolder(folderId: string, currentName: string): void {
  const nextName = window.prompt('Folder name:', currentName)
  if (nextName && nextName.trim()) {
    renameFolder(folderId, nextName.trim())
  }
}

function handleRenameLayer(layerId: string, currentName: string): void {
  const nextName = window.prompt('Mockup name:', currentName)
  if (nextName && nextName.trim()) {
    updateLayer(layerId, { name: nextName.trim() })
  }
}

function toggleViewMode(): void {
  windowState.viewMode = windowState.viewMode === 'grid' ? 'list' : 'grid'
}
</script>

<template>
  <div class="pp-card">
    <input
      id="pp-file-upload-input"
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/svg+xml"
      multiple
      style="display: none"
      @change="onFileSelected"
    />

    <div class="pp-add-row">
      <button type="button" class="pp-btn" @click="triggerFileUpload">
        <span>⬆</span>
        <span>{{ uiStrings.uploadButton }}</span>
        <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">u</span>
      </button>
      <button
        type="button"
        class="pp-btn pp-btn--primary"
        :title="uiStrings.pasteButtonTitle"
        @click="pasteFromClipboard"
      >
        <span>📋</span>
        <span>{{ uiStrings.pasteButton }}</span>
        <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">⌘V</span>
      </button>
    </div>

    <div class="pp-section-bar">
      <div class="pp-section-bar__left">
        <button
          v-if="currentFolder"
          type="button"
          class="pp-section-bar__back"
          @click="windowState.activeFolderId = null"
        >
          ← {{ currentFolder.name }} ({{ currentFolderLayers.length }})
        </button>
        <span v-else>
          {{ uiStrings.layersHeader }} ({{ currentFolderLayers.length }}/{{ FREE_LIMITS.maxLayersPerFolder }})
        </span>
      </div>

      <div class="pp-section-bar__actions">
        <button
          v-if="currentFolder"
          type="button"
          class="pp-icon-btn"
          :title="uiStrings.renameFolderTitle"
          @click="handleRenameFolder(currentFolder.id, currentFolder.name)"
        >
          ✏️
        </button>
        <button
          v-if="currentFolder"
          type="button"
          class="pp-icon-btn"
          :title="uiStrings.deleteFolderTitle"
          @click="removeFolder(currentFolder.id)"
        >
          🗑️
        </button>
        <button
          v-if="!currentFolder"
          type="button"
          class="pp-icon-btn"
          :title="uiStrings.createFolderTitle"
          @click="handleCreateFolder"
        >
          📁+
        </button>
        <button
          type="button"
          class="pp-icon-btn"
          :title="windowState.viewMode === 'grid' ? uiStrings.listViewTitle : uiStrings.gridViewTitle"
          @click="toggleViewMode"
        >
          {{ windowState.viewMode === 'grid' ? '☰' : '⊞' }}
        </button>
      </div>
    </div>

    <div v-if="!currentFolder && visibleFolders.length > 0" class="pp-folders-row">
      <button
        v-for="folder in visibleFolders"
        :key="folder.id"
        type="button"
        class="pp-folder-chip"
        @click="windowState.activeFolderId = folder.id"
      >
        <span>📁 {{ folder.name }}</span>
        <span class="pp-folder-chip__count">{{ getFolderLayerCount(folder.id) }}</span>
      </button>
    </div>

    <div
      v-if="currentFolderLayers.length === 0"
      class="pp-dropzone"
      :class="{ 'pp-dropzone--dragover': isDragOver }"
      @click="triggerFileUpload"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDropFiles"
    >
      <div class="pp-dropzone__title">{{ uiStrings.emptyDropzoneTitle }}</div>
      <div class="pp-dropzone__hint">{{ uiStrings.emptyDropzoneHint }}</div>
    </div>

    <div
      v-else-if="windowState.viewMode === 'grid'"
      class="pp-layers-grid"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDropFiles"
    >
      <div
        v-for="layer in currentFolderLayers"
        :key="layer.id"
        class="pp-layer-card"
        :class="{ 'pp-layer-card--active': activeLayer?.id === layer.id }"
        @click="windowState.activeLayerId = layer.id"
      >
        <img
          v-if="layerObjectUrls[layer.id]"
          :src="layerObjectUrls[layer.id]"
          :alt="layer.name"
          class="pp-layer-card__thumb"
        />
        <div class="pp-layer-card__tools" @click.stop>
          <button
            type="button"
            class="pp-layer-card__tool-btn"
            :title="uiStrings.renameTitle"
            @click="handleRenameLayer(layer.id, layer.name)"
          >
            ✏️
          </button>
          <button
            type="button"
            class="pp-layer-card__tool-btn pp-layer-card__tool-btn--danger"
            :title="uiStrings.deleteTitle"
            @click="removeLayer(layer.id)"
          >
            🗑️
          </button>
        </div>
        <div class="pp-layer-card__footer" :title="layer.name">{{ layer.name }}</div>
      </div>
    </div>

    <div v-else class="pp-layers-list" @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false" @drop.prevent="onDropFiles">
      <div
        v-for="layer in currentFolderLayers"
        :key="layer.id"
        class="pp-layer-row"
        :class="{ 'pp-layer-row--active': activeLayer?.id === layer.id }"
        @click="windowState.activeLayerId = layer.id"
      >
        <div class="pp-layer-row__left">
          <img v-if="layerObjectUrls[layer.id]" :src="layerObjectUrls[layer.id]" :alt="layer.name" class="pp-layer-row__thumb" />
          <div style="min-width: 0">
            <div class="pp-layer-row__title">{{ layer.name }}</div>
            <div class="pp-layer-row__meta">{{ layer.naturalWidth }}×{{ layer.naturalHeight }} · {{ layer.scaleMode }}</div>
          </div>
        </div>
        <div style="display: flex; gap: 3px" @click.stop>
          <button type="button" class="pp-icon-btn" :title="uiStrings.renameTitle" @click="handleRenameLayer(layer.id, layer.name)">✏️</button>
          <button type="button" class="pp-icon-btn" :title="uiStrings.deleteTitle" @click="removeLayer(layer.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>
