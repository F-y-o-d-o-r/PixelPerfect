const LOG_PREFIX = '[Pixel Perfect by ITITI]'

function isDevelopmentMode(): boolean {
  return Boolean(import.meta.env?.DEV)
}

export const logger = {
  debug(message: string, details?: unknown): void {
    if (!isDevelopmentMode()) return
    if (details !== undefined) {
      console.debug(LOG_PREFIX, message, details)
      return
    }
    console.debug(LOG_PREFIX, message)
  },

  info(message: string, details?: unknown): void {
    if (!isDevelopmentMode()) return
    if (details !== undefined) {
      console.info(LOG_PREFIX, message, details)
      return
    }
    console.info(LOG_PREFIX, message)
  },

  warn(message: string, details?: unknown): void {
    if (details !== undefined) {
      console.warn(LOG_PREFIX, message, details)
      return
    }
    console.warn(LOG_PREFIX, message)
  },

  error(message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(LOG_PREFIX, message, error)
      return
    }
    console.error(LOG_PREFIX, message)
  },
}
