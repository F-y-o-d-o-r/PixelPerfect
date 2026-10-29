<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useMockupPositionControls } from './mockupPositionControls'

const {
  activeLayer,
  windowState,
  uiStrings,
  moveBy,
  snapActiveLayerTopCenter,
} = useMockupPositionControls()
</script>

<template>
  <div class="pp-dpad">
    <div />
    <button
      type="button"
      class="pp-dpad__btn"
      :disabled="!activeLayer?.visible"
      @click="moveBy(0, -1, $event)"
    >
      <AppIcon name="arrow-up" :size="13" />
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner"
      >
        k
      </span>
    </button>
    <div />

    <button
      type="button"
      class="pp-dpad__btn"
      :disabled="!activeLayer?.visible"
      @click="moveBy(-1, 0, $event)"
    >
      <AppIcon name="arrow-left" :size="13" />
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner"
      >
        h
      </span>
    </button>
    <button
      type="button"
      class="pp-dpad__btn pp-dpad__btn--center"
      :disabled="!activeLayer?.visible"
      :title="uiStrings.snapToTopCenterTitle"
      @click="snapActiveLayerTopCenter"
    >
      <svg
        class="pp-dpad__center-svg"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <circle
          cx="7"
          cy="7"
          r="4.5"
          stroke="currentColor"
          stroke-width="1.2"
        />
        <path
          d="M7 1v2M7 11v2M1 7h2M11 7h2"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </svg>
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner"
      >
        0
      </span>
    </button>
    <button
      type="button"
      class="pp-dpad__btn"
      :disabled="!activeLayer?.visible"
      @click="moveBy(1, 0, $event)"
    >
      <AppIcon name="arrow-right" :size="13" />
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner"
      >
        l
      </span>
    </button>

    <div />
    <button
      type="button"
      class="pp-dpad__btn"
      :disabled="!activeLayer?.visible"
      @click="moveBy(0, 1, $event)"
    >
      <AppIcon name="arrow-down" :size="13" />
      <span
        v-if="windowState.showHotkeys"
        class="pp-hotkey-hint pp-hotkey-hint--corner"
      >
        j
      </span>
    </button>
    <div />
  </div>
</template>
