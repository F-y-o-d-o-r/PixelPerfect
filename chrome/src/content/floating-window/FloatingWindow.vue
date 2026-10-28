<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import AppIcon from './components/AppIcon.vue'
import FloatingWindowHeader from './components/FloatingWindowHeader.vue'
import MockupImportBar from './components/MockupImportBar.vue'
import FolderTabs from './components/FolderTabs.vue'
import MockupList from './components/MockupList.vue'
import MockupPositionControls from './components/MockupPositionControls.vue'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.vue'
import {
  focusKeyboardReceiverInShadowDom,
  useKeyboard,
} from './composables/useKeyboard'
import { useStorage } from './composables/useStorage'
import { useTheme } from './composables/useTheme'
import { useWindowDrag } from './composables/useWindowDrag'
import { useWindowPosition } from './composables/useWindowPosition'

const {
  layers,
  activeLayer,
  windowState,
  uiStrings,
  statusToast,
  isShortcutsModalOpen,
  isKeyboardControlActive,
  initStorage,
  updateLayer,
  showToast,
} = useStorage()

const { resolvedTheme } = useTheme(() => windowState.theme)
const { startDragFloatingWindow } = useWindowDrag()
const {
  floatingWindowRef,
  isDockedRight,
  isDockedLeft,
  isDockedTop,
  isDockedBottom,
  windowPositionStyle,
  clampAndSnapWindowToViewport,
  snapAfterLayoutChange,
} = useWindowPosition()

useKeyboard()

function toggleMinimized(): void {
  windowState.minimized = !windowState.minimized
}

function toggleMiniShow(): void {
  if (!activeLayer.value) return
  const nextVisible = !activeLayer.value.visible
  updateLayer(activeLayer.value.id, { visible: nextVisible })
  if (!nextVisible && windowState.vimMode === 'move') {
    windowState.vimMode = 'locked'
    updateLayer(activeLayer.value.id, { locked: true })
  }
  showToast(
    nextVisible ? uiStrings.value.showMockup : uiStrings.value.hiddenMockup
  )
  focusKeyboardReceiverInShadowDom()
}

function toggleMiniLock(): void {
  if (!activeLayer.value || !activeLayer.value.visible) return
  const nextLocked = windowState.vimMode === 'move'
  windowState.vimMode = nextLocked ? 'locked' : 'move'
  updateLayer(activeLayer.value.id, { locked: nextLocked })
  showToast(
    nextLocked ? uiStrings.value.toastLocked : uiStrings.value.toastMove
  )
  focusKeyboardReceiverInShadowDom()
}

function handleWindowClick(event: MouseEvent): void {
  isKeyboardControlActive.value = true
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT')) {
    return
  }
  focusKeyboardReceiverInShadowDom()
}

watch(
  () => [windowState.minimized, layers.value.length, windowState.activeLayerId],
  snapAfterLayoutChange
)

onMounted(() => {
  initStorage()
  window.addEventListener('resize', clampAndSnapWindowToViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', clampAndSnapWindowToViewport)
})
</script>

<template>
  <div
    v-if="windowState.visible"
    ref="floatingWindowRef"
    class="pp-floating-window"
    :class="{
      'pp-floating-window--edge-top': isDockedTop,
      'pp-floating-window--edge-bottom': isDockedBottom,
      'pp-floating-window--edge-left': isDockedLeft,
      'pp-floating-window--edge-right': isDockedRight,
    }"
    :data-theme="resolvedTheme"
    :style="windowPositionStyle"
    @click="handleWindowClick"
  >
    <input
      id="pp-keyboard-focus-receiver"
      type="text"
      readonly
      tabindex="-1"
      aria-hidden="true"
      class="pp-keyboard-receiver"
    />
    <div
      v-if="windowState.minimized"
      class="pp-minibar"
      @pointerdown="startDragFloatingWindow"
    >
      <button
        type="button"
        class="pp-minibar__expand"
        :title="uiStrings.expandWindowTitle"
        @click="toggleMinimized"
      >
        <span class="pp-collapse-symbol">+</span>
        <span
          v-if="windowState.showHotkeys"
          class="pp-hotkey-hint pp-hotkey-hint--corner"
        >
          m
        </span>
      </button>

      <button
        type="button"
        class="pp-minibar__btn"
        :class="{
          'pp-minibar__btn--disabled': !activeLayer,
        }"
        @click="toggleMiniShow"
      >
        <AppIcon :name="activeLayer?.visible ? 'eye-off' : 'eye'" :size="14" />
        <span>{{
          activeLayer?.visible ? uiStrings.hiddenMockup : uiStrings.showMockup
        }}</span>
        <span
          v-if="windowState.showHotkeys"
          class="pp-hotkey-hint pp-hotkey-hint--corner-bar"
        >
          s
        </span>
      </button>

      <button
        type="button"
        class="pp-minibar__btn"
        :class="{
          'pp-minibar__btn--active': windowState.vimMode === 'move',
          'pp-minibar__btn--disabled': !activeLayer || !activeLayer.visible,
        }"
        :disabled="!activeLayer || !activeLayer.visible"
        @click="toggleMiniLock"
      >
        <AppIcon
          :name="windowState.vimMode === 'move' ? 'lock' : 'move'"
          :size="13"
        />
        <span>{{
          windowState.vimMode === 'move'
            ? uiStrings.lockMockup
            : uiStrings.moveMockup
        }}</span>
        <span
          v-if="windowState.showHotkeys"
          class="pp-hotkey-hint pp-hotkey-hint--corner-bar"
        >
          i
        </span>
      </button>
    </div>

    <div v-else class="pp-panel">
      <FloatingWindowHeader />

      <div class="pp-body">
        <MockupImportBar />
        <div class="pp-card">
          <FolderTabs />
          <MockupList />
        </div>
        <MockupPositionControls />
      </div>
    </div>
  </div>

  <KeyboardShortcutsModal
    v-if="isShortcutsModalOpen"
    @close="isShortcutsModalOpen = false"
  />

  <div v-if="statusToast" class="pp-toast">
    {{ statusToast }}
  </div>
</template>
