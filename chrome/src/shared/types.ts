import type { SupportedLocale } from '@/i18n/config'

export type ScaleMode = '1x' | '2x' | 'auto'

export type BlendMode = 'normal' | 'difference' | 'invert' | 'multiply'

export type BreakpointType = 'all' | 'desktop' | 'tablet' | 'mobile'

export type UrlBindingType = 'exact' | 'prefix' | 'pattern' | 'domain'

export interface UrlBinding {
  type: UrlBindingType
  value: string
}

export interface Folder {
  id: string
  name: string
  urlBinding: UrlBinding
  createdAt: number
  lastActiveLayerId?: string | null
}

export interface LayerMetadata {
  id: string
  name: string
  folderId: string | null
  urlBinding: UrlBinding
  x: number
  y: number
  opacity: number
  visible: boolean
  locked: boolean
  scaleMode: ScaleMode
  blendMode?: BlendMode
  naturalWidth: number
  naturalHeight: number
  breakpoint: BreakpointType
  thumbnailDataUrl?: string
  createdAt: number
}

export type ThemeMode = 'dark' | 'light' | 'system'

export type ViewMode = 'grid' | 'list'

export type VimMode = 'locked' | 'move'

export interface FloatingWindowPosition {
  x: number
  y: number
  dockCorner?:
    'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'free'
  dockEdgeX?: 'left' | 'right' | 'center' | 'none'
  dockEdgeY?: 'top' | 'bottom' | 'center' | 'none'
}

export interface FloatingWindowState {
  visible: boolean
  minimized: boolean
  showHotkeys: boolean
  position: FloatingWindowPosition
  viewMode: ViewMode
  activeFolderId: string | null
  activeLayerId: string | null
  theme: ThemeMode
  vimMode: VimMode
  locale: SupportedLocale
}

export type ExtensionMessage =
  | { type: 'PP_TOGGLE_FLOATING_WINDOW' }
  | { type: 'PP_PING' }
  | { type: 'PP_URL_CHANGED'; url: string }
