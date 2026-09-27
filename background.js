/**
 * SinhalaUniPro - Background Service Worker
 */

importScripts('converter.js');

chrome.runtime.onInstalled.addListener(() => {
  // Create Context Menu for selected text
  chrome.contextMenus.create({
    id: 'convert-selection',
    title: 'Convert Singlish "%s" to Sinhala',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'open-editor',
    title: 'Open SinhalaUniPro Full Editor',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'convert-selection' && info.selectionText) {
    const converted = SinhalaConverter.convert(info.selectionText);
    
    // Save to storage for quick access
    await chrome.storage.local.set({
      lastSelectionConverted: {
        original: info.selectionText,
        converted: converted,
        timestamp: Date.now()
      }
    });

    // Also copy to clipboard via scripting in current tab if possible
    if (tab && tab.id) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            navigator.clipboard.writeText(text).catch(() => {});
          },
          args: [converted]
        });
      } catch (e) {
        // Tab might not allow script execution (e.g. chrome://)
      }
    }
  } else if (info.menuItemId === 'open-editor') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('editor.html')
    });
  }
});

// Global keyboard command listener
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-inline-sinhala') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle-sinhala-mode' }).catch(() => {});
    }
  }
});

