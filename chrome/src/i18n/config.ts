export const SUPPORTED_LOCALES = [
  'en',
  'ru',
  'uk',
  'el',
  'sr',
  'bg',
  'ro',
  'ka',
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LANGUAGE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  el: 'Ελληνικά',
  sr: 'Српски',
  bg: 'Български',
  ro: 'Română',
  ka: 'ქართული',
}

export function isSupportedLocale(code: string): code is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(code)
}

export function detectBrowserLocale(): SupportedLocale {
  const rawLocale =
    (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.()) ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    DEFAULT_LOCALE

  const baseCode = rawLocale.toLowerCase().split(/[-_]/)[0]
  if (isSupportedLocale(baseCode)) {
    return baseCode
  }
  return DEFAULT_LOCALE
}
