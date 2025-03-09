document.addEventListener('DOMContentLoaded', async function() {
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const packageStatus = document.getElementById('packageStatus');
  const toggleButton = document.getElementById('toggleTranslation');
  const targetLangSelect = document.getElementById('targetLang');
  const translationEngineSelect = document.getElementById('translationEngine');

  // Load initial settings
  const settings = await chrome.storage.local.get(['isEnabled', 'targetLang', 'translationEngine', 'gamePackage']);
  if (settings.targetLang) targetLangSelect.value = settings.targetLang;
  if (settings.translationEngine) translationEngineSelect.value = settings.translationEngine;
  toggleButton.textContent = settings.isEnabled ? 'Disable Translation' : 'Enable Translation';

  // Handle upload button click
  uploadBtn.addEventListener('click', function() {
    console.log('Upload button clicked');
    fileInput.click();
  });

  // Load saved settings
  chrome.storage.local.get(['isEnabled', 'targetLang', 'translationEngine'], function(result) {
    toggleButton.textContent = result.isEnabled ? 'Disable Translation' : 'Enable Translation';
    if (result.targetLang) targetLangSelect.value = result.targetLang;
    if (result.translationEngine) translationEngineSelect.value = result.translationEngine;
  });

  // Handle translation toggle
  toggleButton.addEventListener('click', function() {
    chrome.storage.local.get('isEnabled', function(result) {
      const newState = !result.isEnabled;
      chrome.storage.local.set({ isEnabled: newState });
      toggleButton.textContent = newState ? 'Disable Translation' : 'Enable Translation';
      
      // Notify content script with error handling
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleTranslation',
            state: newState
          }).catch(error => {
            console.log('Content script not loaded in this tab (this is normal)');
          });
        }
      });
    });
  });

  // Handle language selection
  targetLangSelect.addEventListener('change', function() {
    chrome.storage.local.set({ targetLang: this.value });
    notifyContentScript();
  });

  // Handle translation engine selection
  translationEngineSelect.addEventListener('change', function() {
    chrome.storage.local.set({ translationEngine: this.value });
    notifyContentScript();
  });

  // Handle game package upload
  fileInput.addEventListener('change', async function(e) {
    console.log('File input change event triggered');
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      packageStatus.textContent = 'No file selected';
      return;
    }

    console.log('File selected:', file.name);
    packageStatus.textContent = 'Loading package...';
    
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
      });

      console.log('File content loaded, parsing JSON...');
      const package = JSON.parse(text);
      
      // Validate package structure
      if (!package.conversionTable || !package.definitionTable) {
        throw new Error('Invalid package structure');
      }
      
      console.log('Package structure valid, saving to storage...');
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ gamePackage: package }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });

      console.log('Package saved successfully');
      packageStatus.textContent = 'Game package loaded successfully!';
      notifyContentScript();
    } catch (error) {
      console.error('Error processing game package:', error);
      packageStatus.textContent = 'Error: ' + error.message;
    } finally {
      // Reset file input to allow selecting the same file again
      fileInput.value = '';
    }
  });

  async function notifyContentScript() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tabs[0]) {
        console.log('No active tab found');
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings' })
        .catch(error => {
          console.log('Content script not loaded in this tab (this is normal)');
        });
    } catch (error) {
      console.error('Error in notifyContentScript:', error);
    }
  }
});