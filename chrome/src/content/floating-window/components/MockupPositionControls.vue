<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import MockupDpad from './MockupDpad.vue'
import {
  SCALE_MODES,
  useMockupPositionControls,
} from './mockupPositionControls'

const {
  activeLayer,
  windowState,
  uiStrings,
  opacityPercent,
  toggleVisible,
  toggleLock,
  toggleInvertMode,
  onCoordInput,
  onOpacityInput,
  setScaleMode,
  snapActiveLayerCenterX,
  snapActiveLayerTopY,
  resetActiveLayerOrigin,
} = useMockupPositionControls()
</script>

<template>
  <template v-if="activeLayer">
    <div class="pp-quickbar">
      <button type="button" class="pp-quickbar__btn" @click="toggleVisible">
        <AppIcon :name="activeLayer.visible ? 'eye-off' : 'eye'" :size="14" />
        <span>{{
          activeLayer.visible ? uiStrings.hiddenMockup : uiStrings.showMockup
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
        class="pp-quickbar__btn"
        :class="{ 'pp-quickbar__btn--disabled': !activeLayer.visible }"
        :disabled="!activeLayer.visible"
        @click="toggleLock"
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

    <div
      class="pp-card"
      :class="{ 'pp-card--disabled': !activeLayer.visible }"
    >
      <div class="pp-origin-header">
        <span class="pp-opacity__label-group">
          <span>{{ uiStrings.originLabel }}</span>
          <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">
            Shift 10px
          </span>
        </span>
        <button
          type="button"
          class="pp-origin-reset"
          :disabled="!activeLayer.visible"
          @click="resetActiveLayerOrigin"
        >
          <span>{{ uiStrings.resetLabel }}</span>
          <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">r</span>
        </button>
      </div>

      <div class="pp-origin-grid">
        <MockupDpad />

        <div class="pp-coords">
          <div class="pp-coord-row">
            <button
              type="button"
              class="pp-coord-snap-btn"
              :disabled="!activeLayer.visible"
              :title="uiStrings.snapCenterXTitle"
              @click="snapActiveLayerCenterX"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1v12M2 7h3m7 0H9m-6-2l-2 2 2 2m8-4l2 2-2 2"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span
                v-if="windowState.showHotkeys"
                class="pp-hotkey-hint pp-hotkey-hint--corner"
              >
                x
              </span>
            </button>
            <label class="pp-coord-field">
              <input
                type="number"
                class="pp-coord-field__input"
                :disabled="!activeLayer.visible"
                :value="activeLayer.x"
                @input="onCoordInput('x', $event)"
                @keydown.enter="($event.target as HTMLElement).blur()"
                @keydown.escape="($event.target as HTMLElement).blur()"
              />
              <button
                type="button"
                class="pp-coord-field__label-btn"
                :disabled="!activeLayer.visible"
                :title="uiStrings.snapCenterXTitle"
                @click.prevent="snapActiveLayerCenterX"
              >
                X
              </button>
            </label>
          </div>

          <div class="pp-coord-row">
            <button
              type="button"
              class="pp-coord-snap-btn"
              :disabled="!activeLayer.visible"
              :title="uiStrings.snapTopYTitle"
              @click="snapActiveLayerTopY"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 2h12M7 13V5m-3 3l3-3 3 3"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span
                v-if="windowState.showHotkeys"
                class="pp-hotkey-hint pp-hotkey-hint--corner"
              >
                y
              </span>
            </button>
            <label class="pp-coord-field">
              <input
                type="number"
                class="pp-coord-field__input"
                :disabled="!activeLayer.visible"
                :value="activeLayer.y"
                @input="onCoordInput('y', $event)"
                @keydown.enter="($event.target as HTMLElement).blur()"
                @keydown.escape="($event.target as HTMLElement).blur()"
              />
              <button
                type="button"
                class="pp-coord-field__label-btn"
                :disabled="!activeLayer.visible"
                :title="uiStrings.snapTopYTitle"
                @click.prevent="snapActiveLayerTopY"
              >
                Y
              </button>
            </label>
          </div>

          <div class="pp-coord-row">
            <button
              type="button"
              class="pp-coord-snap-btn"
              :disabled="!activeLayer.visible"
              :class="{
                'pp-coord-snap-btn--active': activeLayer.blendMode === 'invert',
              }"
              :title="
                activeLayer.blendMode === 'invert'
                  ? `${uiStrings.blendInvert} (${uiStrings.blendNormal})`
                  : uiStrings.blendInvert
              "
              @click="toggleInvertMode"
            >
              <AppIcon name="invert" :size="13" />
              <span
                v-if="windowState.showHotkeys"
                class="pp-hotkey-hint pp-hotkey-hint--corner"
              >
                v
              </span>
            </button>

            <div class="pp-scale-group">
              <button
                v-for="mode in SCALE_MODES"
                :key="mode.value"
                type="button"
                class="pp-scale-btn"
                :disabled="!activeLayer.visible"
                :class="{
                  'pp-scale-btn--active': activeLayer.scaleMode === mode.value,
                }"
                @click="setScaleMode(mode.value)"
              >
                {{ mode.label }}
              </button>
              <span
                v-if="windowState.showHotkeys"
                class="pp-hotkey-hint pp-hotkey-hint--corner"
              >
                z
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="pp-opacity">
        <div class="pp-opacity__header">
          <span class="pp-opacity__label-group">
            <span>{{ uiStrings.opacityLabel }}</span>
            <span v-if="windowState.showHotkeys" class="pp-hotkey-hint">
              - / + · 1–9
            </span>
          </span>
          <span class="pp-opacity__value">{{ opacityPercent }}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          :disabled="!activeLayer.visible"
          :value="opacityPercent"
          class="pp-opacity__slider"
          @input="onOpacityInput"
        />
      </div>
    </div>
  </template>
</template>
