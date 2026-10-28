<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import FloatingWindowHeader from './components/FloatingWindowHeader.vue'
import MockupFoldersAndList from './components/MockupFoldersAndList.vue'
import MockupPositionControls from './components/MockupPositionControls.vue'
import {
  focusKeyboardReceiverInShadowDom,
  useKeyboard,
} from './composables/useKeyboard'
import { useStorage } from './composables/useStorage'
import { useTheme } from './composables/useTheme'
import { useWindowDrag } from './composables/useWindowDrag'

const {
  layers,
  activeLayer,
  windowState,
  uiStrings,
  statusToast,
  initStorage,
  updateLayer,
  showToast,
} = useStorage()

const { resolvedTheme } = useTheme(() => windowState.theme)
const { startDragFloatingWindow } = useWindowDrag()
useKeyboard()

const floatingWindowRef = ref<HTMLElement | null>(null)
let isPointerDownInWindow = false

const isDockedRight = computed(
  () =>
    windowState.position.dockEdgeX === 'right' ||
    (windowState.position.dockCorner === 'top-right' &&
      windowState.position.x === 0) ||
    windowState.position.dockCorner === 'bottom-right'
)

const isDockedLeft = computed(
  () =>
    windowState.position.dockEdgeX === 'left' ||
    windowState.position.dockCorner === 'top-left' ||
    windowState.position.dockCorner === 'bottom-left'
)

const isDockedTop = computed(
  () =>
    windowState.position.dockEdgeY === 'top' ||
    (windowState.position.dockCorner === 'top-right' &&
      windowState.position.y === 0) ||
    windowState.position.dockCorner === 'top-left'
)

const isDockedBottom = computed(
  () =>
    windowState.position.dockEdgeY === 'bottom' ||
    windowState.position.dockCorner === 'bottom-right' ||
    windowState.position.dockCorner === 'bottom-left'
)

const windowPositionStyle = computed(() => {
  const horizontalStyle = isDockedRight.value
    ? { left: 'auto', right: '0px' }
    : { left: `${windowState.position.x}px`, right: 'auto' }
  const verticalStyle = isDockedBottom.value
    ? { top: 'auto', bottom: '0px' }
    : { top: `${windowState.position.y}px`, bottom: 'auto' }
  return {
    ...horizontalStyle,
    ...verticalStyle,
  }
})

function toggleMinimized(): void {
  windowState.minimized = !windowState.minimized
}

function toggleMiniShow(): void {
  if (!activeLayer.value) return
  updateLayer(activeLayer.value.id, { visible: !activeLayer.value.visible })
  focusKeyboardReceiverInShadowDom()
}

function toggleMiniLock(): void {
  if (!activeLayer.value) return
  const nextLocked = windowState.vimMode === 'move'
  windowState.vimMode = nextLocked ? 'locked' : 'move'
  updateLayer(activeLayer.value.id, { locked: nextLocked })
  focusKeyboardReceiverInShadowDom()
}

function onWindowPointerDown(): void {
  isPointerDownInWindow = true
  setTimeout(() => {
    isPointerDownInWindow = false
  }, 150)
}

function handleKeyboardReceiverBlur(): void {
  if (isPointerDownInWindow) return
  if (windowState.vimMode === 'move' && activeLayer.value) {
    windowState.vimMode = 'locked'
    updateLayer(activeLayer.value.id, { locked: true })
    showToast(uiStrings.value.toastLocked)
  }
}

function handleWindowClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT')) {
    return
  }
  focusKeyboardReceiverInShadowDom()
}

function clampAndSnapWindowToViewport(): void {
  const element = floatingWindowRef.value
  if (!element || !windowState.visible) return

  const rect = element.getBoundingClientRect()
  const viewportWidth = Math.min(
    window.innerWidth,
    document.documentElement.clientWidth || window.innerWidth
  )
  const viewportHeight = Math.min(
    window.innerHeight,
    document.documentElement.clientHeight || window.innerHeight
  )

  let nextX = windowState.position.x
  let nextY = windowState.position.y
  let nextEdgeX = windowState.position.dockEdgeX ?? (isDockedRight.value ? 'right' : isDockedLeft.value ? 'left' : 'none')
  let nextEdgeY = windowState.position.dockEdgeY ?? (isDockedTop.value ? 'top' : isDockedBottom.value ? 'bottom' : 'none')
  let changed = false

  if (nextEdgeY !== 'bottom' && rect.bottom >= viewportHeight - 20) {
    nextY = 0
    nextEdgeY = 'bottom'
    changed = true
  } else if (nextEdgeY !== 'top' && rect.top < 0) {
    nextY = 0
    nextEdgeY = 'top'
    changed = true
  }

  if (nextEdgeX !== 'right' && rect.right >= viewportWidth - 20) {
    nextX = 0
    nextEdgeX = 'right'
    changed = true
  } else if (nextEdgeX !== 'left' && rect.left < 0) {
    nextX = 0
    nextEdgeX = 'left'
    changed = true
  }

  if (!changed) return

  let nextCorner: typeof windowState.position.dockCorner = 'free'
  if (nextEdgeX === 'right' && nextEdgeY === 'top') nextCorner = 'top-right'
  else if (nextEdgeX === 'left' && nextEdgeY === 'top') nextCorner = 'top-left'
  else if (nextEdgeX === 'right' && nextEdgeY === 'bottom') nextCorner = 'bottom-right'
  else if (nextEdgeX === 'left' && nextEdgeY === 'bottom') nextCorner = 'bottom-left'

  windowState.position = {
    x: nextX,
    y: nextY,
    dockCorner: nextCorner,
    dockEdgeX: nextEdgeX,
    dockEdgeY: nextEdgeY,
  }
}

watch(
  () => [windowState.minimized, layers.value.length, windowState.activeLayerId],
  async () => {
    await nextTick()
    clampAndSnapWindowToViewport()
  }
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
    @pointerdown="onWindowPointerDown"
    @click="handleWindowClick"
  >
    <input
      id="pp-keyboard-focus-receiver"
      type="text"
      readonly
      tabindex="-1"
      aria-hidden="true"
      class="pp-keyboard-receiver"
      @blur="handleKeyboardReceiverBlur"
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
        <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">m</span>
      </button>

      <button
        type="button"
        class="pp-minibar__btn"
        :class="{
          'pp-minibar__btn--active': activeLayer?.visible,
          'pp-minibar__btn--disabled': !activeLayer,
        }"
        @click="toggleMiniShow"
      >
        <span>{{ activeLayer?.visible ? '🙈' : '👁' }}</span>
        <span>{{
          activeLayer?.visible ? uiStrings.hiddenMockup : uiStrings.showMockup
        }}</span>
        <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">s</span>
      </button>

      <button
        type="button"
        class="pp-minibar__btn"
        :class="{
          'pp-minibar__btn--active': windowState.vimMode === 'move',
          'pp-minibar__btn--disabled': !activeLayer,
        }"
        @click="toggleMiniLock"
      >
        <span>{{ windowState.vimMode === 'move' ? '🔒' : '🔓' }}</span>
        <span>{{
          windowState.vimMode === 'move'
            ? uiStrings.lockMockup
            : uiStrings.moveMockup
        }}</span>
        <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">i</span>
      </button>
    </div>

    <div v-else class="pp-panel">
      <FloatingWindowHeader />

      <div class="pp-body">
        <MockupFoldersAndList />
        <MockupPositionControls />
      </div>
    </div>

    <div v-if="statusToast" class="pp-toast">
      {{ statusToast }}
    </div>
  </div>
</template>
