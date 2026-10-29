<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useStorage } from '../composables/useStorage'
import { useTheme } from '../composables/useTheme'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { windowState, uiStrings } = useStorage()
const { resolvedTheme } = useTheme(() => windowState.theme)

function handleClose(): void {
  emit('close')
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <div
    class="pp-shortcuts-backdrop"
    :data-theme="resolvedTheme"
    @click="handleBackdropClick"
  >
    <div class="pp-shortcuts-modal" @click.stop>
      <div class="pp-shortcuts-header">
        <div class="pp-shortcuts-title">
          <AppIcon name="help" :size="14" />
          <span>{{ uiStrings.shortcutsModalTitle }}</span>
        </div>
        <button
          type="button"
          class="pp-shortcuts-close"
          :title="uiStrings.shortcutsClose"
          @click="handleClose"
        >
          <AppIcon name="close" :size="14" />
        </button>
      </div>

      <div class="pp-shortcuts-toggle-bar">
        <span>{{ uiStrings.shortcutsToggleHints }}</span>
        <label class="pp-shortcuts-switch">
          <input
            v-model="windowState.showHotkeys"
            type="checkbox"
          />
          <span class="pp-shortcuts-slider" />
        </label>
      </div>

      <div class="pp-shortcuts-body">
        <!-- Navigation & Focus -->
        <div class="pp-shortcuts-section">
          <div class="pp-shortcuts-section-title">
            {{ uiStrings.shortcutsCatNav }}
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.shortcutsFocusToggleWidget }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">⌥ / Alt</span>
              <span>+</span>
              <span class="pp-shortcuts-kbd">S</span>
              <span style="opacity: 0.4">/</span>
              <span class="pp-shortcuts-kbd">`</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.shortcutsFocusPage }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">Esc</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.collapseWindowTitle }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">m</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.shortcutsToggleTheme }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">t</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.shortcutsModalTitle }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">?</span>
            </div>
          </div>
        </div>

        <!-- Layers & Folders -->
        <div class="pp-shortcuts-section">
          <div class="pp-shortcuts-section-title">
            {{ uiStrings.shortcutsCatLayers }}
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.layersHeader }} (prev / next)</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">[</span>
              <span class="pp-shortcuts-kbd">]</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.createFolderTitle }} (prev / next)</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">{</span>
              <span class="pp-shortcuts-kbd">}</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">Folder 1 – 3</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">⌥ / Alt</span>
              <span>+</span>
              <span class="pp-shortcuts-kbd">1..3</span>
            </div>
          </div>
        </div>

        <!-- Nudge & Alignment -->
        <div class="pp-shortcuts-section">
          <div class="pp-shortcuts-section-title">
            {{ uiStrings.shortcutsCatMove }}
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.moveMockup }} / {{ uiStrings.lockMockup }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">i</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">1px (Shift: 10px)</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">h</span>
              <span class="pp-shortcuts-kbd">j</span>
              <span class="pp-shortcuts-kbd">k</span>
              <span class="pp-shortcuts-kbd">l</span>
              <span style="opacity: 0.4">/</span>
              <span class="pp-shortcuts-kbd">←↑↓→</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.snapCenterXTitle }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">x</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.snapTopYTitle }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">y</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.snapToTopCenterTitle }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">0</span>
              <span style="opacity: 0.4">/</span>
              <span class="pp-shortcuts-kbd">Home</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.resetLabel }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">r</span>
            </div>
          </div>
        </div>

        <!-- Opacity & View -->
        <div class="pp-shortcuts-section">
          <div class="pp-shortcuts-section-title">
            {{ uiStrings.shortcutsCatView }}
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.showMockup }} / {{ uiStrings.hiddenMockup }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">s</span>
              <span style="opacity: 0.4">/</span>
              <span class="pp-shortcuts-kbd">Space</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.blendInvert }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">v</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.opacityLabel }} 10% – 90%</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">1..9</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.opacityLabel }} ±10% (Shift: ±1%)</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">-</span>
              <span class="pp-shortcuts-kbd">+</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.uploadButton }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">u</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.pasteButton }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">⌘ / Ctrl</span>
              <span>+</span>
              <span class="pp-shortcuts-kbd">V</span>
            </div>
          </div>
        </div>

        <!-- Mouse & Drag -->
        <div class="pp-shortcuts-section">
          <div class="pp-shortcuts-section-title">
            {{ uiStrings.shortcutsCatMouse }}
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.movePillSnap }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">⌥ / Alt</span>
              <span>+ Drag</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.movePillLockAxis }}</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">⇧ / Shift</span>
              <span>+ Drag</span>
            </div>
          </div>
          <div class="pp-shortcuts-row">
            <span class="pp-shortcuts-desc">{{ uiStrings.opacityLabel }} ±5%</span>
            <div class="pp-shortcuts-keys">
              <span class="pp-shortcuts-kbd">Scroll</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
