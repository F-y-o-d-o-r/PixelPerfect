import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { ThemeMode } from '@/shared/types'

export function useTheme(currentThemeMode: () => ThemeMode) {
  const systemDark = ref(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  let mediaQuery: MediaQueryList | null = null

  const onSystemThemeChange = (e: MediaQueryListEvent) => {
    systemDark.value = e.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', onSystemThemeChange)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onSystemThemeChange)
  })

  const resolvedTheme = computed<'dark' | 'light'>(() => {
    const mode = currentThemeMode()
    if (mode === 'system') {
      return systemDark.value ? 'dark' : 'light'
    }
    return mode
  })

  return {
    resolvedTheme,
  }
}
