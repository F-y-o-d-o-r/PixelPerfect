<script setup lang="ts">
import { ref } from 'vue'
import { FREE_LIMITS } from '@/shared/constants'
import { useMockupFoldersAndList } from './mockupFoldersAndList'
import { useStorage } from '../composables/useStorage'

const {
  folders,
  currentFolder,
  currentFolderLayers,
  activeLayer,
  layerObjectUrls,
  windowState,
  uiStrings,
  getFolderLayerCount,
  addFolder,
  renameFolder,
  moveLayerToFolder,
  updateLayer,
} = useStorage()

const {
  fileInputRef,
  isDragOver,
  triggerFileUpload,
  onFileSelected,
  onDropFiles,
  pasteFromClipboard,
  confirmRemoveLayer,
  confirmRemoveFolder,
} = useMockupFoldersAndList()

const draggedLayerId = ref<string | null>(null)
const dragOverFolderId = ref<string | null>(null)

async function handleCreateFolder(): Promise<void> {
  const created = await addFolder()
  if (created) {
    windowState.activeFolderId = created.id
  }
}

function handleRenameFolder(folderId: string, currentName: string): void {
  const nextName = window.prompt(uiStrings.value.promptRenamePage, currentName)
  if (nextName && nextName.trim()) {
    renameFolder(folderId, nextName.trim())
  }
}

function handleRenameLayer(layerId: string, currentName: string): void {
  const nextName = window.prompt(uiStrings.value.promptRenameMockup, currentName)
  if (nextName && nextName.trim()) {
    updateLayer(layerId, { name: nextName.trim() })
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
}

function onDragOverFolder(event: DragEvent, folderId: string): void {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
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
  draggedLayerId.value = null
  dragOverFolderId.value = null
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

    <div class="pp-pages-bar">
      <div class="pp-pages-tabs">
        <button
          v-for="folder in folders"
          :key="folder.id"
          type="button"
          class="pp-page-tab"
          :class="{
            'pp-page-tab--active': currentFolder?.id === folder.id,
            'pp-page-tab--dragover': dragOverFolderId === folder.id,
          }"
          @click="windowState.activeFolderId = folder.id"
          @dragover="onDragOverFolder($event, folder.id)"
          @dragleave="onDragLeaveFolder(folder.id)"
          @drop.prevent="onDropOnFolder(folder.id)"
        >
          <span class="pp-page-tab__name">{{ folder.name }}</span>
          <span class="pp-page-tab__count">{{ getFolderLayerCount(folder.id) }}</span>
        </button>
      </div>

      <button
        type="button"
        class="pp-icon-btn pp-page-add-btn"
        :title="uiStrings.createFolderTitle"
        @click="handleCreateFolder"
      >
        +
      </button>
    </div>

    <div class="pp-section-bar">
      <div class="pp-section-bar__left">
        <span>{{ uiStrings.layersHeader }} ({{ currentFolderLayers.length }}/{{ FREE_LIMITS.maxLayersPerFolder }})</span>
      </div>

      <div class="pp-section-bar__actions">
        <button
          type="button"
          class="pp-icon-btn"
          :title="uiStrings.uploadButton"
          @click="triggerFileUpload"
        >
          ⬆
        </button>
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
          :class="{ 'pp-icon-btn--disabled': folders.length <= 1 }"
          :title="folders.length <= 1 ? uiStrings.toastCannotDeleteLastFolder : uiStrings.deleteFolderTitle"
          @click="confirmRemoveFolder(currentFolder.id)"
        >
          🗑️
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
        :class="{
          'pp-layer-card--active': activeLayer?.id === layer.id,
          'pp-layer-card--dragging': draggedLayerId === layer.id,
        }"
        draggable="true"
        @dragstart="onLayerDragStart($event, layer.id)"
        @dragend="onLayerDragEnd"
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
            @click="confirmRemoveLayer(layer.id)"
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
        :class="{
          'pp-layer-row--active': activeLayer?.id === layer.id,
          'pp-layer-row--dragging': draggedLayerId === layer.id,
        }"
        draggable="true"
        @dragstart="onLayerDragStart($event, layer.id)"
        @dragend="onLayerDragEnd"
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
          <button type="button" class="pp-icon-btn" :title="uiStrings.deleteTitle" @click="confirmRemoveLayer(layer.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>
