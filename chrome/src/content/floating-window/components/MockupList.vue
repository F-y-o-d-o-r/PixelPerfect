<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { FREE_LIMITS } from '@/shared/constants'
import { useMockupList } from './mockupList'

const {
  folders,
  currentFolder,
  currentFolderLayers,
  layerObjectUrls,
  windowState,
  uiStrings,
  isDragOver,
  triggerFileUpload,
  onDropFiles,
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
} = useMockupList()
</script>

<template>
  <div class="pp-mockup-list">
    <div class="pp-section-bar">
      <div
        class="pp-section-bar__left"
        :title="currentFolder?.name || uiStrings.layersHeader"
      >
        <span class="pp-section-bar__title">
          {{ currentFolder?.name || uiStrings.layersHeader }}
        </span>
        <span class="pp-section-bar__count">
          ({{ currentFolderLayers.length }}/{{
            FREE_LIMITS.maxLayersPerFolder
          }})
        </span>
      </div>

      <div class="pp-section-bar__actions">
        <button
          type="button"
          class="pp-icon-btn"
          :title="uiStrings.uploadButton"
          @click="triggerFileUpload"
        >
          <AppIcon name="upload" :size="13" />
        </button>
        <button
          v-if="currentFolder"
          type="button"
          class="pp-icon-btn"
          :title="uiStrings.renameFolderTitle"
          @click="handleRenameFolder(currentFolder.id, currentFolder.name)"
        >
          <AppIcon name="pencil" :size="12" />
        </button>
        <button
          v-if="currentFolder"
          type="button"
          class="pp-icon-btn"
          :class="{ 'pp-icon-btn--disabled': folders.length <= 1 }"
          :title="
            folders.length <= 1
              ? uiStrings.toastCannotDeleteLastFolder
              : uiStrings.deleteFolderTitle
          "
          @click="confirmRemoveFolder(currentFolder.id)"
        >
          <AppIcon name="trash" :size="12" />
        </button>
        <button
          type="button"
          class="pp-icon-btn"
          :title="
            windowState.viewMode === 'grid'
              ? uiStrings.listViewTitle
              : uiStrings.gridViewTitle
          "
          @click="toggleViewMode"
        >
          <AppIcon
            :name="windowState.viewMode === 'grid' ? 'list' : 'grid'"
            :size="13"
          />
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
        :class="getLayerCardClass(layer.id)"
        draggable="true"
        @dragstart="onLayerDragStart($event, layer.id)"
        @dragend="onLayerDragEnd"
        @dragover="onDragOverLayer($event, layer.id)"
        @dragleave="onDragLeaveLayer(layer.id)"
        @drop.prevent="onDropOnLayer(layer.id)"
        @click="selectLayer(layer)"
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
            <AppIcon name="pencil" :size="12" />
          </button>
          <button
            type="button"
            class="pp-layer-card__tool-btn"
            :title="uiStrings.deleteTitle"
            @click="confirmRemoveLayer(layer.id)"
          >
            <AppIcon name="trash" :size="12" />
          </button>
        </div>
        <div class="pp-layer-card__footer" :title="layer.name">
          {{ layer.name }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="pp-layers-list"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDropFiles"
    >
      <div
        v-for="layer in currentFolderLayers"
        :key="layer.id"
        class="pp-layer-row"
        :class="getLayerRowClass(layer.id)"
        draggable="true"
        @dragstart="onLayerDragStart($event, layer.id)"
        @dragend="onLayerDragEnd"
        @dragover="onDragOverLayer($event, layer.id)"
        @dragleave="onDragLeaveLayer(layer.id)"
        @drop.prevent="onDropOnLayer(layer.id)"
        @click="selectLayer(layer)"
      >
        <div class="pp-layer-row__left">
          <img
            v-if="layerObjectUrls[layer.id]"
            :src="layerObjectUrls[layer.id]"
            :alt="layer.name"
            class="pp-layer-row__thumb"
          />
          <div style="min-width: 0">
            <div class="pp-layer-row__title">{{ layer.name }}</div>
            <div class="pp-layer-row__meta">
              {{ layer.naturalWidth }}×{{ layer.naturalHeight }} ·
              {{ layer.scaleMode }}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 3px" @click.stop>
          <button
            type="button"
            class="pp-icon-btn"
            :title="uiStrings.renameTitle"
            @click="handleRenameLayer(layer.id, layer.name)"
          >
            <AppIcon name="pencil" :size="12" />
          </button>
          <button
            type="button"
            class="pp-icon-btn"
            :title="uiStrings.deleteTitle"
            @click="confirmRemoveLayer(layer.id)"
          >
            <AppIcon name="trash" :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
