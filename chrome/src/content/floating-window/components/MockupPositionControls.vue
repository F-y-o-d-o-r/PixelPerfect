<script setup lang="ts">
import { computed } from 'vue'
import type { ScaleMode } from '@/shared/types'
import { useStorage } from '../composables/useStorage'

const {
  activeLayer,
  windowState,
  uiStrings,
  updateLayer,
  snapActiveLayerTopCenter,
  resetActiveLayerOrigin,
  setScaleMode,
} = useStorage()

const opacityPercent = computed(() =>
  activeLayer.value ? Math.round(activeLayer.value.opacity * 100) : 50
)

function toggleVisible(): void {
  if (!activeLayer.value) return
  updateLayer(activeLayer.value.id, { visible: !activeLayer.value.visible })
}

function toggleLock(): void {
  if (!activeLayer.value) return
  const nextLocked = windowState.vimMode === 'move'
  windowState.vimMode = nextLocked ? 'locked' : 'move'
  updateLayer(activeLayer.value.id, { locked: nextLocked })
}

function moveBy(deltaX: number, deltaY: number, event?: MouseEvent): void {
  if (!activeLayer.value) return
  const stepMultiplier = event?.shiftKey ? 10 : 1
  updateLayer(activeLayer.value.id, {
    x: activeLayer.value.x + deltaX * stepMultiplier,
    y: activeLayer.value.y + deltaY * stepMultiplier,
  })
}

function onCoordInput(axis: 'x' | 'y', event: Event): void {
  if (!activeLayer.value) return
  const parsedValue = Number.parseInt(
    (event.target as HTMLInputElement).value,
    10
  )
  if (!Number.isNaN(parsedValue)) {
    updateLayer(activeLayer.value.id, { [axis]: parsedValue })
  }
}

function onOpacityInput(event: Event): void {
  if (!activeLayer.value) return
  const parsedValue = Number.parseInt(
    (event.target as HTMLInputElement).value,
    10
  )
  if (!Number.isNaN(parsedValue)) {
    updateLayer(activeLayer.value.id, {
      opacity: Math.min(1, Math.max(0, parsedValue / 100)),
    })
  }
}

const scaleModes: { value: ScaleMode; label: string }[] = [
  { value: '1x', label: '1x' },
  { value: '2x', label: '2x' },
  { value: 'auto', label: 'Auto' },
]
</script>

<template>
  <template v-if="activeLayer">
    <div class="pp-quickbar">
      <button
        type="button"
        class="pp-quickbar__btn"
        :class="{ 'pp-quickbar__btn--active': activeLayer.visible }"
        @click="toggleVisible"
      >
        <span>{{ activeLayer.visible ? '👁' : '🙈' }}</span>
        <span>{{
          activeLayer.visible ? uiStrings.showMockup : uiStrings.hiddenMockup
        }}</span>
      </button>

      <button
        type="button"
        class="pp-quickbar__btn"
        :class="{ 'pp-quickbar__btn--active': windowState.vimMode === 'move' }"
        @click="toggleLock"
      >
        <span>{{ windowState.vimMode === 'move' ? '🔓' : '🔒' }}</span>
        <span>{{
          windowState.vimMode === 'move'
            ? `${uiStrings.moveMockup} (i)`
            : uiStrings.lockMockup
        }}</span>
      </button>
    </div>

    <div class="pp-card">
      <div class="pp-origin-header">
        <span>{{ uiStrings.originLabel }}</span>
        <button
          type="button"
          class="pp-origin-reset"
          @click="resetActiveLayerOrigin"
        >
          {{ uiStrings.resetLabel }}
        </button>
      </div>

      <div class="pp-origin-grid">
        <div class="pp-dpad">
          <div />
          <button
            type="button"
            class="pp-dpad__btn"
            @click="moveBy(0, -1, $event)"
          >
            ▲
          </button>
          <div />

          <button
            type="button"
            class="pp-dpad__btn"
            @click="moveBy(-1, 0, $event)"
          >
            ◀
          </button>
          <button
            type="button"
            class="pp-dpad__btn pp-dpad__btn--center"
            :title="uiStrings.snapToTopCenterTitle"
            @click="snapActiveLayerTopCenter"
          >
            ⌖
          </button>
          <button
            type="button"
            class="pp-dpad__btn"
            @click="moveBy(1, 0, $event)"
          >
            ▶
          </button>

          <div />
          <button
            type="button"
            class="pp-dpad__btn"
            @click="moveBy(0, 1, $event)"
          >
            ▼
          </button>
          <div />
        </div>

        <div class="pp-coords">
          <label class="pp-coord-field">
            <input
              type="number"
              class="pp-coord-field__input"
              :value="activeLayer.x"
              @input="onCoordInput('x', $event)"
            />
            <span class="pp-coord-field__label">X</span>
          </label>

          <label class="pp-coord-field">
            <input
              type="number"
              class="pp-coord-field__input"
              :value="activeLayer.y"
              @input="onCoordInput('y', $event)"
            />
            <span class="pp-coord-field__label">Y</span>
          </label>

          <div class="pp-scale-group">
            <button
              v-for="mode in scaleModes"
              :key="mode.value"
              type="button"
              class="pp-scale-btn"
              :class="{
                'pp-scale-btn--active': activeLayer.scaleMode === mode.value,
              }"
              @click="setScaleMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="pp-opacity">
        <div class="pp-opacity__header">
          <span>{{ uiStrings.opacityLabel }}</span>
          <span class="pp-opacity__value">{{ opacityPercent }}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          :value="opacityPercent"
          class="pp-opacity__slider"
          @input="onOpacityInput"
        />
      </div>
    </div>

    <div class="pp-vim-bar">
      <span>{{ uiStrings.vimModeLabel }}</span>
      <span
        class="pp-vim-bar__badge"
        :class="{
          'pp-vim-bar__badge--move': windowState.vimMode === 'move',
        }"
      >
        {{
          windowState.vimMode === 'move'
            ? uiStrings.vimMoveBadge
            : uiStrings.vimLockedBadge
        }}
      </span>
    </div>
  </template>
</template>
