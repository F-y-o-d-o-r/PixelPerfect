import { logger } from '@/shared/logger'
import type { ExtensionMessage } from '@/shared/types'

const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
] as const

const activeExtensionTabIds = new Set<number>()

function isRestrictedBrowserUrl(url: string): boolean {
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
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

async function injectContentScriptIntoTab(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    activeExtensionTabIds.add(tabId)
  } catch (error) {
    logger.error('Failed to inject content script into active tab', error)
  }
}

async function handleExtensionActionClick(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id || !tab.url) return
  if (isRestrictedBrowserUrl(tab.url)) return

  const result = await sendToggleFloatingWindowMessage(tab.id)
  if (!result.ok) {
    await injectContentScriptIntoTab(tab.id)
    return
  }

  if (result.visible === false) {
    activeExtensionTabIds.delete(tab.id)
  } else {
    activeExtensionTabIds.add(tab.id)
  }
}

chrome.action.onClicked.addListener(handleExtensionActionClick)

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  if (!activeExtensionTabIds.has(tabId)) return
  if (!tab.url || isRestrictedBrowserUrl(tab.url)) return

  await injectContentScriptIntoTab(tabId)
})

chrome.tabs.onRemoved.addListener((tabId) => {
  activeExtensionTabIds.delete(tabId)
})
