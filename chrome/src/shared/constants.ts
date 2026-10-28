import { detectBrowserLocale } from '@/i18n/config'
import type { FloatingWindowState } from './types'

export const EXTENSION_VERSION = '0.0.1'

export const DOM_HOST_IDS = {
  FLOATING_WINDOW: 'pixel-perfect-ititi-floating-window-host',
  FLOATING_WINDOW_MOUNT: 'pixel-perfect-ititi-floating-window-root',
  OVERLAY: 'pixel-perfect-ititi-overlay-host',
} as const

export const FREE_LIMITS = {
  maxFolders: 3,
  maxLayersPerFolder: 5,
  maxTotalLayers: 15,
} as const

export const STORAGE_KEYS = {
  LAYERS: 'pp_ititi_layers',
  FOLDERS: 'pp_ititi_folders',
  FLOATING_WINDOW: 'pp_ititi_floating_window',
  BLOB_PREFIX: 'pp_ititi_blob_',
} as const

export const DEFAULT_FLOATING_WINDOW_STATE: FloatingWindowState = {
  visible: true,
  minimized: false,
  showHotkeys: false,
  position: {
    x: 0,
    y: 0,
    dockCorner: 'top-right',
  },
  viewMode: 'grid',
  activeFolderId: null,
  activeLayerId: null,
  theme: 'dark',
  vimMode: 'locked',
  locale: detectBrowserLocale(),
}
