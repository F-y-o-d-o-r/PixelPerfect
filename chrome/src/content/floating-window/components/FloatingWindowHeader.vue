<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  LANGUAGE_LABELS,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/i18n/config'
import { DOM_HOST_IDS, EXTENSION_VERSION } from '@/shared/constants'
import { useStorage } from '../composables/useStorage'
import { useWindowDrag } from '../composables/useWindowDrag'

const { windowState, uiStrings } = useStorage()
const { startDragFloatingWindow } = useWindowDrag()

const isMenuOpen = ref(false)
const isLanguageListOpen = ref(false)

const themeIcon = computed(() => {
  if (windowState.theme === 'dark') return '🌙'
  if (windowState.theme === 'light') return '☀️'
  return '🌗'
})

const themeButtonTitle = computed(() => {
  if (windowState.theme === 'dark') return uiStrings.value.darkTheme
  if (windowState.theme === 'light') return uiStrings.value.lightTheme
  return uiStrings.value.systemThemeAuto
})

function closeDropdownMenu(): void {
  isMenuOpen.value = false
  isLanguageListOpen.value = false
}

function toggleMinimized(): void {
  windowState.minimized = !windowState.minimized
  closeDropdownMenu()
}

function cycleTheme(): void {
  if (windowState.theme === 'dark') {
    windowState.theme = 'light'
  } else if (windowState.theme === 'light') {
    windowState.theme = 'system'
  } else {
    windowState.theme = 'dark'
  }
}

function toggleMenu(): void {
  isMenuOpen.value = !isMenuOpen.value
  if (!isMenuOpen.value) {
    isLanguageListOpen.value = false
  }
}

function selectLocale(locale: SupportedLocale): void {
  windowState.locale = locale
  closeDropdownMenu()
}

function resetWindowToTopRightCorner(): void {
  windowState.position = {
    x: 0,
    y: 0,
    dockCorner: 'top-right',
    dockEdgeX: 'right',
    dockEdgeY: 'top',
  }
  closeDropdownMenu()
}

function handleGlobalPointerDown(event: PointerEvent): void {
  if (!isMenuOpen.value) return
  const host = document.getElementById(DOM_HOST_IDS.FLOATING_WINDOW)
  if (!host) return

  const path = event.composedPath()
  const clickedInsideDropdown = path.some(
    (node) =>
      node instanceof HTMLElement &&
      (node.classList.contains('pp-dropdown') ||
        node.classList.contains('pp-menu-toggle-btn'))
  )
  if (!clickedInsideDropdown) {
    closeDropdownMenu()
  }
}

onMounted(() => {
  window.addEventListener('pointerdown', handleGlobalPointerDown, {
    capture: true,
  })
})

onUnmounted(() => {
  window.removeEventListener('pointerdown', handleGlobalPointerDown, {
    capture: true,
  })
})
</script>

<template>
  <header class="pp-header" @pointerdown="startDragFloatingWindow">
    <button
      type="button"
      class="pp-header__collapse"
      :title="uiStrings.collapseWindowTitle"
      @click="toggleMinimized"
    >
      <span class="pp-collapse-symbol">−</span>
      <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">m</span>
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
        :class="{ 'pp-icon-btn--active': windowState.showHotkeys }"
        title="Hotkeys (?)"
        @click="windowState.showHotkeys = !windowState.showHotkeys"
      >
        ?
      </button>
      <button
        type="button"
        class="pp-icon-btn"
        :title="themeButtonTitle"
        @click="cycleTheme"
      >
        {{ themeIcon }}
      </button>
      <button
        type="button"
        class="pp-icon-btn pp-menu-toggle-btn"
        :class="{ 'pp-icon-btn--active': isMenuOpen }"
        :title="uiStrings.menuTitle"
        @click="toggleMenu"
      >
        ☰
      </button>
    </div>
  </header>

  <div v-if="isMenuOpen" class="pp-dropdown" @click.stop>
    <button
      type="button"
      class="pp-dropdown__item"
      @click="isLanguageListOpen = !isLanguageListOpen"
    >
      <span>🌐 {{ LANGUAGE_LABELS[windowState.locale] }}</span>
      <span>{{ windowState.locale.toUpperCase() }} ▾</span>
    </button>

    <div v-if="isLanguageListOpen" class="pp-lang-list">
      <button
        v-for="code in SUPPORTED_LOCALES"
        :key="code"
        type="button"
        class="pp-lang-list__item"
        :class="{ 'pp-lang-list__item--active': windowState.locale === code }"
        @click="selectLocale(code)"
      >
        <span>{{ LANGUAGE_LABELS[code] }}</span>
        <span>{{
          windowState.locale === code ? '✓' : code.toUpperCase()
        }}</span>
      </button>
    </div>

    <button
      type="button"
      class="pp-dropdown__item"
      @click="resetWindowToTopRightCorner"
    >
      <span>{{ uiStrings.resetWindowCorner }}</span>
      <span>↗</span>
    </button>
    <div class="pp-dropdown__divider" />
    <div class="pp-dropdown__item pp-dropdown__item--muted">
      <span>Pixel Perfect by ITITI</span>
      <span>v{{ EXTENSION_VERSION }}</span>
    </div>
  </div>
</template>
