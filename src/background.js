// Track which tabs have content scripts ready
const readyTabs = new Set();

// Initialize default settings
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({
    isEnabled: false,
    targetLang: 'en',
    translationEngine: 'google',
    gamePackage: null
  });
});

// Listen for content script ready messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady' && sender.tab) {
    readyTabs.add(sender.tab.id);
    console.log('Content script ready in tab:', sender.tab.id);
    sendResponse({ success: true });
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId);
});

// Helper function to check if content script is ready
async function isContentScriptReady(tabId) {
  if (readyTabs.has(tabId)) {
    return true;
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    if (response.success) {
      readyTabs.add(tabId);
      return true;
    }
  } catch (error) {
    console.log('Content script not ready in tab:', tabId);
    return false;
  }
  return false;
}

// Helper function to inject content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content.js']
    });
    return true;
  } catch (error) {
    console.error('Failed to inject content script:', error);
    return false;
  }
}

// Helper function to safely send message to content script
async function sendMessageToContentScript(tabId, message) {
  try {
    // Check if content script is ready
    if (!await isContentScriptReady(tabId)) {
      // Try to inject content script
      if (!await injectContentScript(tabId)) {
        throw new Error('Could not inject content script');
      }
      // Wait a bit for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Send the message
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    console.error('Error sending message to content script:', error);
    throw error;
  }
}