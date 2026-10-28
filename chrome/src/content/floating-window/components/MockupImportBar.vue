<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useStorage } from '../composables/useStorage'
import { useMockupImport } from './mockupImport'

const { windowState, uiStrings } = useStorage()
const { fileInputRef, triggerFileUpload, onFileSelected, pasteFromClipboard } =
  useMockupImport()
</script>

<template>
  <div class="pp-import-bar">
    <input
      id="pp-file-upload-input"
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg,.png,.jpg,.jpeg,.webp"
      multiple
      style="display: none"
      @change="onFileSelected"
    />

    <button
      type="button"
      class="pp-import-bar__btn"
      :title="uiStrings.uploadButton"
      @click="triggerFileUpload"
    >
      <AppIcon name="upload" :size="13" />
      <span>{{ uiStrings.uploadButton }}</span>
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner-bar"
      >
        u
      </span>
    </button>
    <button
      type="button"
      class="pp-import-bar__btn"
      :title="uiStrings.pasteButtonTitle"
      @click="pasteFromClipboard"
    >
      <AppIcon name="clipboard" :size="13" />
      <span>{{ uiStrings.pasteButton }}</span>
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner-bar"
      >
        ⌘V
      </span>
    </button>
  </div>
</template>
