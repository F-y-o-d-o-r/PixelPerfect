<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LANGUAGE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config'
import { EXTENSION_VERSION } from '@/shared/constants'
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
  activeLayer,
  windowState,
  uiStrings,
  statusToast,
  initStorage,
  updateLayer,
} = useStorage()

const { resolvedTheme } = useTheme(() => windowState.theme)
const { startDragFloatingWindow } = useWindowDrag()
useKeyboard()

const isMenuOpen = ref(false)

onMounted(() => {
  initStorage()
})

const windowPositionStyle = computed(() => {
  if (windowState.position.dockCorner === 'top-right') {
    return {
      top: `${windowState.position.y}px`,
      right: `${windowState.position.x}px`,
    }
  }
  return {
    top: `${windowState.position.y}px`,
    left: `${windowState.position.x}px`,
  }
})

const isDockedToTopRightCorner = computed(
  () =>
    windowState.position.dockCorner === 'top-right' &&
    windowState.position.x === 0 &&
    windowState.position.y === 0
)

function toggleMinimized(): void {
  windowState.minimized = !windowState.minimized
  isMenuOpen.value = false
}

function cycleTheme(): void {
  windowState.theme = resolvedTheme.value === 'dark' ? 'light' : 'dark'
}

function cycleLocale(): void {
  const currentIndex = SUPPORTED_LOCALES.indexOf(windowState.locale)
  const nextIndex = (currentIndex + 1) % SUPPORTED_LOCALES.length
  windowState.locale = SUPPORTED_LOCALES[nextIndex]
}

function toggleMiniShow(): void {
  if (!activeLayer.value) return
  updateLayer(activeLayer.value.id, { visible: !activeLayer.value.visible })
}

function toggleMiniLock(): void {
  if (!activeLayer.value) return
  const nextLocked = windowState.vimMode === 'move'
  windowState.vimMode = nextLocked ? 'locked' : 'move'
  updateLayer(activeLayer.value.id, { locked: nextLocked })
}

function resetWindowToTopRightCorner(): void {
  windowState.position = {
    x: 0,
    y: 0,
    dockCorner: 'top-right',
  }
  isMenuOpen.value = false
}

function closeFloatingWindow(): void {
  isMenuOpen.value = false
  windowState.visible = false
}

function handleWindowClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT')) {
    return
  }
  focusKeyboardReceiverInShadowDom()
}

function handleKeyboardTrapBlur(): void {
  if (windowState.vimMode === 'move' && activeLayer.value) {
    windowState.vimMode = 'locked'
    updateLayer(activeLayer.value.id, { locked: true })
    setTimeout(() => {
      if (windowState.visible) {
        focusKeyboardReceiverInShadowDom()
      }
    }, 0)
  }
}
</script>

<template>
  <div
    v-if="windowState.visible"
    class="pp-floating-window"
    :class="{ 'pp-floating-window--docked-corner': isDockedToTopRightCorner }"
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
      @blur="handleKeyboardTrapBlur"
    />
    <div v-if="windowState.minimized" class="pp-minibar">
      <button
        type="button"
        class="pp-minibar__expand"
        :title="uiStrings.expandWindowTitle"
        @pointerdown="startDragFloatingWindow"
        @click="toggleMinimized"
      >
        +
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
        <span>{{ activeLayer?.visible ? '👁' : '🙈' }}</span>
        <span>{{ uiStrings.showMockup }}</span>
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
        <span>{{ windowState.vimMode === 'move' ? '🔓' : '🔒' }}</span>
        <span>{{
          windowState.vimMode === 'move'
            ? uiStrings.moveMockup
            : uiStrings.lockMockup
        }}</span>
      </button>
    </div>

    <div v-else class="pp-panel">
      <header class="pp-header" @pointerdown="startDragFloatingWindow">
        <button
          type="button"
          class="pp-header__collapse"
          :title="uiStrings.collapseWindowTitle"
          @click="toggleMinimized"
        >
          −
        </button>

        <div class="pp-header__brand">
          <svg class="pp-header__logo" viewBox="0 0 512 512">
            <rect width="512" height="512" rx="114" fill="#0E1015" />
            <g transform="translate(256, 280)">
              <g transform="scale(1.15, 0.58) rotate(45)">
                <path
                  d="M -90,-115 L -90,115 A 15,15 0 0,0 -75,130 L -55,130 A 15,15 0 0,0 -40,115 L -40,30 L 15,30 A 80,80 0 0,0 95,-50 A 80,80 0 0,0 15,-130 L -70,-130 A 20,20 0 0,0 -90,-115 Z M -40,-85 L 15,-85 A 35,35 0 0,1 50,-50 A 35,35 0 0,1 15,-15 L -40,-15 Z"
                  fill="#FFFFFF"
                  fill-rule="evenodd"
                  opacity="0.92"
                />
              </g>
              <g transform="translate(0, -95) scale(1.15, 0.58) rotate(45)">
                <path
                  d="M -90,-115 L -90,115 A 15,15 0 0,0 -75,130 L -55,130 A 15,15 0 0,0 -40,115 L -40,30 L 15,30 A 80,80 0 0,0 95,-50 A 80,80 0 0,0 15,-130 L -70,-130 A 20,20 0 0,0 -90,-115 Z M -40,-85 L 15,-85 A 35,35 0 0,1 50,-50 A 35,35 0 0,1 15,-15 L -40,-15 Z"
                  fill="#38BDF8"
                  fill-rule="evenodd"
                />
              </g>
            </g>
          </svg>
          <span>Pixel Perfect</span>
        </div>

        <div class="pp-header__actions">
          <button
            type="button"
            class="pp-icon-btn"
            :title="
              resolvedTheme === 'dark'
                ? uiStrings.lightTheme
                : uiStrings.darkTheme
            "
            @click="cycleTheme"
          >
            {{ resolvedTheme === 'dark' ? '🌙' : '☀️' }}
          </button>
          <button
            type="button"
            class="pp-icon-btn"
            :class="{ 'pp-icon-btn--active': isMenuOpen }"
            :title="uiStrings.menuTitle"
            @click="isMenuOpen = !isMenuOpen"
          >
            ☰
          </button>
        </div>
      </header>

      <div v-if="isMenuOpen" class="pp-dropdown">
        <button
          type="button"
          class="pp-dropdown__item"
          @click="
            windowState.theme = 'system';
            isMenuOpen = false
          "
        >
          <span>{{ uiStrings.systemThemeAuto }}</span>
          <span v-if="windowState.theme === 'system'">✓</span>
        </button>
        <button type="button" class="pp-dropdown__item" @click="cycleLocale">
          <span>🌐 {{ LANGUAGE_LABELS[windowState.locale] }}</span>
          <span>{{ windowState.locale.toUpperCase() }}</span>
        </button>
        <button
          type="button"
          class="pp-dropdown__item"
          @click="resetWindowToTopRightCorner"
        >
          <span>{{ uiStrings.resetWindowCorner }}</span>
          <span>↗</span>
        </button>
        <div class="pp-dropdown__divider" />
        <button
          type="button"
          class="pp-dropdown__item"
          @click="closeFloatingWindow"
        >
          <span>{{ uiStrings.hideWindow }}</span>
          <span>✕</span>
        </button>
        <div class="pp-dropdown__divider" />
        <div class="pp-dropdown__item pp-dropdown__item--muted">
          <span>Pixel Perfect by ITITI</span>
          <span>v{{ EXTENSION_VERSION }}</span>
        </div>
      </div>

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
