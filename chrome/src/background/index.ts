import { logger } from '@/shared/logger'
import type { ExtensionMessage } from '@/shared/types'

const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
  'edge://',
  'about:',
  'view-source:',
  'devtools://',
] as const

const ACTIVE_ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
}

const DISABLED_ICONS = {
  16: 'icons/icon-16-disabled.png',
  32: 'icons/icon-32-disabled.png',
  48: 'icons/icon-48-disabled.png',
  128: 'icons/icon-128-disabled.png',
}

const RESTRICTED_POPUP_PATH = 'popups/restricted.html'

const activeExtensionTabIds = new Set<number>()

function isRestrictedBrowserUrl(url?: string): boolean {
  if (!url) return false
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
}

async function syncTabActionState(
  tabId: number,
  url?: string,
  status?: string
): Promise<void> {
  let targetUrl = url
  let targetStatus = status
  if (!targetUrl || !targetStatus) {
    try {
      const tab = await chrome.tabs.get(tabId)
      targetUrl = targetUrl || tab.url || tab.pendingUrl
      targetStatus = targetStatus || tab.status
    } catch {
      return
    }
  }

  const isRestricted = Boolean(targetUrl && isRestrictedBrowserUrl(targetUrl))

  if (isRestricted) {
    chrome.action.setIcon({ tabId, path: DISABLED_ICONS })
    chrome.action.setPopup({ tabId, popup: RESTRICTED_POPUP_PATH })
    chrome.action.setTitle({
      tabId,
      title: 'Pixel Perfect cannot be used on this page',
    })
    return
  }

  chrome.action.setPopup({ tabId, popup: '' })
  chrome.action.setTitle({
    tabId,
    title: 'Pixel Perfect by ITITI',
  })

  if (targetStatus === 'loading') {
    chrome.action.setIcon({ tabId, path: DISABLED_ICONS })
  } else {
    chrome.action.setIcon({ tabId, path: ACTIVE_ICONS })
  }
}

async function sendToggleFloatingWindowMessage(
  tabId: number
): Promise<{ ok: boolean; visible?: boolean }> {
  const toggleMessage: ExtensionMessage = {
    type: 'PP_TOGGLE_FLOATING_WINDOW',
  }
  try {
    const response = await chrome.tabs.sendMessage(tabId, toggleMessage)
    return { ok: true, visible: response?.visible }
  } catch {
    return { ok: false }
  }
}

async function injectContentScriptIntoTab(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    activeExtensionTabIds.add(tabId)
    return true
  } catch (error) {
    logger.debug('Failed to inject content script into active tab', error)
    activeExtensionTabIds.delete(tabId)
    return false
  }
}

async function handleExtensionActionClick(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id) return
  if (isRestrictedBrowserUrl(tab.url)) {
    syncTabActionState(tab.id, tab.url, tab.status)
    return
  }

  const result = await sendToggleFloatingWindowMessage(tab.id)
  if (!result.ok) {
    const injected = await injectContentScriptIntoTab(tab.id)
    if (injected) {
      chrome.action.setIcon({ tabId: tab.id, path: ACTIVE_ICONS })
      setTimeout(async () => {
        if (tab.id) {
          const retry = await sendToggleFloatingWindowMessage(tab.id)
          if (retry.ok && retry.visible) {
            chrome.action.setIcon({ tabId: tab.id, path: ACTIVE_ICONS })
          }
        }
      }, 60)
    }
    return
  }

  if (result.visible === false) {
    activeExtensionTabIds.delete(tab.id)
  } else {
    activeExtensionTabIds.add(tab.id)
  }
}

chrome.action.onClicked.addListener(handleExtensionActionClick)

chrome.tabs.onActivated.addListener((activeInfo) => {
  syncTabActionState(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const currentUrl = tab.url || tab.pendingUrl
  const currentStatus = changeInfo.status || tab.status
  syncTabActionState(tabId, currentUrl, currentStatus)

  if (changeInfo.status !== 'complete') return
  if (!activeExtensionTabIds.has(tabId)) return
  if (isRestrictedBrowserUrl(currentUrl)) return

  await injectContentScriptIntoTab(tabId)
})

chrome.tabs.onRemoved.addListener((tabId) => {
  activeExtensionTabIds.delete(tabId)
})

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id) {
        syncTabActionState(tab.id, tab.url || tab.pendingUrl, tab.status)
      }
    }
  } catch (error) {
    logger.warn('Failed to initialize tabs state on install', error)
  }
})
