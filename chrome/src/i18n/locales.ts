import type { SupportedLocale } from './config'
import { bg } from './locales/bg'
import { el } from './locales/el'
import { en, type UiStrings } from './locales/en'
import { ka } from './locales/ka'
import { ro } from './locales/ro'
import { ru } from './locales/ru'
import { sr } from './locales/sr'
import { uk } from './locales/uk'

export type { UiStrings }

export const LOCALE_DICTIONARY: Record<SupportedLocale, UiStrings> = {
  en,
  ru,
  uk,
  el,
  sr,
  bg,
  ro,
  ka,
}

export function getUiStrings(locale: SupportedLocale): UiStrings {
  return LOCALE_DICTIONARY[locale] ?? en
}
