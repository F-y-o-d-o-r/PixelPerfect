<script setup lang="ts">
import { useFolderTabs } from './folderTabs'

const {
  folders,
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
} = useFolderTabs()
</script>

<template>
  <div class="pp-folder-bar">
    <div
      class="pp-folder-tabs"
      @dragover="onDragOverTabsContainer"
      @drop.prevent="onDropOnTabsContainer"
    >
      <button
        v-for="folder in folders"
        :key="folder.id"
        type="button"
        class="pp-folder-tab"
        :class="getTabClass(folder.id)"
        :title="folder.name"
        draggable="true"
        @dragstart="onFolderDragStart($event, folder.id)"
        @dragend="onFolderDragEnd"
        @click="selectFolder(folder.id)"
        @dragover="onDragOverFolder($event, folder.id)"
        @dragleave="onDragLeaveFolder($event, folder.id)"
        @drop.prevent="onDropOnFolder(folder.id)"
      >
        <span class="pp-folder-tab__name">{{ folder.name }}</span>
        <span class="pp-folder-tab__count">
          {{ getFolderLayerCount(folder.id) }}
        </span>
      </button>
    </div>

    <button
      type="button"
      class="pp-icon-btn pp-folder-add-btn"
      :title="uiStrings.createFolderTitle"
      @click="handleCreateFolder"
    >
      <svg
        class="pp-folder-add-icon"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
      >
        <path d="M7 2.5v9M2.5 7h9" />
      </svg>
    </button>
  </div>
</template>
