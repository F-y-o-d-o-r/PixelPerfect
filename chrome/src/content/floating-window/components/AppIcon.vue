<script setup lang="ts">
export type IconName =
  | 'upload'
  | 'clipboard'
  | 'pencil'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'move'
  | 'grid'
  | 'list'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'invert'
  | 'sun'
  | 'moon'
  | 'theme-system'
  | 'menu'
  | 'globe'
  | 'corner-reset'
  | 'help'
  | 'close'

withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    strokeWidth?: number | string
  }>(),
  {
    size: 14,
    strokeWidth: 1.7,
  }
)
</script>

<template>
  <svg
    class="pp-svg-icon"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Upload: Tray and arrow -->
    <template v-if="name === 'upload'">
      <path d="M2.5 11.5v1.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1.5" />
      <path d="M8 2.5v7.5M5 5.5l3-3 3 3" />
    </template>

    <!-- Clipboard: Paper board and sheet -->
    <template v-else-if="name === 'clipboard'">
      <path
        d="M6 2.5h4a.75.75 0 0 0 .75-.75v-.25A.75.75 0 0 0 10 .75H6a.75.75 0 0 0-.75.75v.25c0 .414.336.75.75.75z"
      />
      <path
        d="M5 2.5H3.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1H11"
      />
      <path d="M5.5 7h5M5.5 10.5h5" />
    </template>

    <!-- Pencil / Edit -->
    <template v-else-if="name === 'pencil'">
      <path d="M11.75 2.25a1.414 1.414 0 0 1 2 2L5 13H2.5v-2.5l9.25-8.25z" />
      <path d="M9.75 4.25l2 2" />
    </template>

    <!-- Trash / Delete bin -->
    <template v-else-if="name === 'trash'">
      <path d="M2.5 4.5h11" />
      <path d="M6 4.5V2.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.75" />
      <path d="M4 4.5l.75 8.75a1 1 0 0 0 1 .75h4.5a1 1 0 0 0 1-.75l.75-8.75" />
      <path d="M6.5 7.5v3.5M9.5 7.5v3.5" />
    </template>

    <!-- Eye open / Show -->
    <template v-else-if="name === 'eye'">
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1.5 8 1.5 8z"
      />
      <circle cx="8" cy="8" r="2.25" />
    </template>

    <!-- Eye off / Hide -->
    <template v-else-if="name === 'eye-off'">
      <path
        d="M6.5 3.6A6.2 6.2 0 0 1 8 3.5c4 0 6.5 4.5 6.5 4.5a11.2 11.2 0 0 1-2.2 2.8M9.5 9.5a2.25 2.25 0 0 1-3-3M3.7 4.7A11.2 11.2 0 0 0 1.5 8s2.5 4.5 6.5 4.5c1.4 0 2.6-.4 3.6-1.1"
      />
      <path d="M2 2l12 12" />
    </template>

    <!-- Padlock / Lock -->
    <template v-else-if="name === 'lock'">
      <rect x="3.5" y="7" width="9" height="7" rx="1.5" />
      <path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" />
      <circle cx="8" cy="10.25" r="0.8" fill="currentColor" />
    </template>

    <!-- Move 4-way arrow -->
    <template v-else-if="name === 'move'">
      <path
        d="M8 1.5v13M1.5 8h13M5 4.5L8 1.5l3 3M5 11.5L8 14.5l3-3M4.5 5L1.5 8l3 3M11.5 5l3 3-3 3"
      />
    </template>

    <!-- Grid view -->
    <template v-else-if="name === 'grid'">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.75" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="0.75" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="0.75" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="0.75" />
    </template>

    <!-- List view -->
    <template v-else-if="name === 'list'">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </template>

    <!-- D-pad Up -->
    <template v-else-if="name === 'arrow-up'">
      <path
        d="M3.75 10L8 5.75l4.25 4.25"
        :stroke-width="Number(strokeWidth) + 0.3"
      />
    </template>

    <!-- D-pad Down -->
    <template v-else-if="name === 'arrow-down'">
      <path
        d="M3.75 6L8 10.25l4.25-4.25"
        :stroke-width="Number(strokeWidth) + 0.3"
      />
    </template>

    <!-- D-pad Left -->
    <template v-else-if="name === 'arrow-left'">
      <path
        d="M10 3.75L5.75 8l4.25 4.25"
        :stroke-width="Number(strokeWidth) + 0.3"
      />
    </template>

    <!-- D-pad Right -->
    <template v-else-if="name === 'arrow-right'">
      <path
        d="M6 3.75L10.25 8l-4.25 4.25"
        :stroke-width="Number(strokeWidth) + 0.3"
      />
    </template>

    <!-- Invert colors (dual-tone circle) -->
    <template v-else-if="name === 'invert'">
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 2.25A5.75 5.75 0 0 0 8 13.75V2.25z" fill="currentColor" />
    </template>

    <!-- Sun / Light theme -->
    <template v-else-if="name === 'sun'">
      <circle cx="8" cy="8" r="3.25" />
      <path
        d="M8 1.5v1.5M8 13v1.5M1.5 8h1.5M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"
      />
    </template>

    <!-- Moon / Dark theme -->
    <template v-else-if="name === 'moon'">
      <path d="M13.2 10.8A6 6 0 1 1 5.2 2.8a5 5 0 0 0 8 8z" />
    </template>

    <!-- System theme (half and half) -->
    <template v-else-if="name === 'theme-system'">
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 2.25A5.75 5.75 0 0 1 8 13.75V2.25z" fill="currentColor" />
    </template>

    <!-- Menu hamburger -->
    <template v-else-if="name === 'menu'">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </template>

    <!-- Globe -->
    <template v-else-if="name === 'globe'">
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12" />
      <ellipse cx="8" cy="8" rx="3.2" ry="6" />
    </template>

    <!-- Corner reset ↗ -->
    <template v-else-if="name === 'corner-reset'">
      <path d="M4 12L12 4M6 4h6v6" />
    </template>

    <!-- Help / Question mark circle -->
    <template v-else-if="name === 'help'">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6.4 6.2a1.75 1.75 0 0 1 3.2.9c0 1.1-1.6 1.4-1.6 2.3" />
      <circle cx="8" cy="11.7" r="0.65" stroke="none" fill="currentColor" />
    </template>

    <!-- Close cross -->
    <template v-else-if="name === 'close'">
      <path d="M4 4l8 8M12 4l-8 8" />
    </template>
  </svg>
</template>

<style scoped>
.pp-svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
