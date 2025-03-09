class GameTranslator {
  constructor() {
    this.isEnabled = false;
    this.targetLang = 'en';
    this.translationEngine = 'google';
    this.gamePackage = null;
    this.observer = null;
    this.tooltipElement = null;
    this.init();
  }

  async init() {
    // Load settings
    const settings = await chrome.storage.local.get([
      'isEnabled',
      'targetLang',
      'translationEngine',
      'gamePackage'
    ]);
    
    this.isEnabled = settings.isEnabled || false;
    this.targetLang = settings.targetLang || 'en';
    this.translationEngine = settings.translationEngine || 'google';
    this.gamePackage = settings.gamePackage;

    console.log('Initializing Game Translator:', {
      isEnabled: this.isEnabled,
      targetLang: this.targetLang,
      translationEngine: this.translationEngine,
      hasGamePackage: !!this.gamePackage
    });

    this.setupMessageListener();
    this.createTooltip();

    // Start translation if enabled and game package is available
    if (this.isEnabled && this.gamePackage) {
      this.startTranslation();
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        for (let [key, { newValue }] of Object.entries(changes)) {
          switch (key) {
            case 'isEnabled':
              this.isEnabled = newValue;
              if (newValue) {
                this.startTranslation();
              } else {
                this.stopTranslation();
              }
              break;
            case 'targetLang':
              this.targetLang = newValue;
              if (this.isEnabled) {
                this.translatePage();
              }
              break;
            case 'gamePackage':
              this.gamePackage = newValue;
              if (this.isEnabled) {
                this.translatePage();
              }
              break;
          }
        }
      }
    });
  }

  createTooltip() {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'game-translator-tooltip';
    document.body.appendChild(this.tooltipElement);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        switch (message.action) {
          case 'toggleTranslation':
            this.isEnabled = message.state;
            if (this.isEnabled) {
              this.startTranslation();
            } else {
              this.stopTranslation();
            }
            sendResponse({ success: true });
            break;
          case 'updateSettings':
            this.updateSettings()
              .then(() => sendResponse({ success: true }))
              .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep the message channel open for async response
          case 'ping':
            sendResponse({ success: true });
            break;
          default:
            console.log('Unknown message action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
  }

  async updateSettings() {
    const settings = await chrome.storage.local.get([
      'targetLang',
      'translationEngine',
      'gamePackage'
    ]);
    
    this.targetLang = settings.targetLang || this.targetLang;
    this.translationEngine = settings.translationEngine || this.translationEngine;
    this.gamePackage = settings.gamePackage;

    if (this.isEnabled) {
      this.translatePage();
    }
  }

  startTranslation() {
    console.log('Starting translation with settings:', {
      targetLang: this.targetLang,
      translationEngine: this.translationEngine,
      gamePackage: this.gamePackage
    });
    this.translatePage();
    this.setupObserver();
  }

  stopTranslation() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.revertTranslations();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.translateNodes(mutation.addedNodes);
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  translatePage() {
    if (!this.gamePackage) return;
    this.translateNodes([document.body]);
  }

  translateNodes(nodes) {
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        this.translateTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        this.translateElement(node);
      }
    });
  }

  translateElement(element) {
    if (element.classList.contains('game-translator-processed')) return;
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      this.translateTextNode(node);
    }

    element.classList.add('game-translator-processed');
  }

  translateTextNode(node) {
    if (!node.textContent.trim()) return;
    if (!this.gamePackage || !this.gamePackage.conversionTable) {
      console.log('No game package loaded or invalid package structure');
      return;
    }
    
    // Skip if node is inside our tooltip or is already processed
    if (node.parentElement && 
        (node.parentElement.classList.contains('game-translator-tooltip') ||
         node.parentElement.classList.contains('game-translator-keyword'))) {
      return;
    }
    
    const conversionTable = this.gamePackage.conversionTable;
    const definitionTable = this.gamePackage.definitionTable;
    
    let text = node.textContent;
    let modified = false;
    
    // Create a map of all possible source languages
    const sourceLanguages = Object.keys(conversionTable).filter(lang => lang !== this.targetLang);
    
    for (const sourceLang of sourceLanguages) {
      const sourceWords = conversionTable[sourceLang];
      const targetWords = conversionTable[this.targetLang];
      
      if (!sourceWords || !targetWords) continue;
      
      // Sort words by length (longest first) to handle overlapping terms correctly
      const wordIndices = sourceWords.map((word, index) => ({word, index}))
        .filter(({word}) => word && typeof word === 'string')
        .sort((a, b) => b.word.length - a.word.length);
      
      for (const {word, index} of wordIndices) {
        if (!text.includes(word)) continue;
        
        const translation = targetWords[index];
        const definition = (definitionTable[this.targetLang] && definitionTable[this.targetLang][index]) ||
                         (definitionTable[sourceLang] && definitionTable[sourceLang][index]);
        
        if (!translation) continue;
        
        // Use regex to preserve case and handle word boundaries
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        text = text.replace(regex, (match) => {
          modified = true;
          const span = document.createElement('span');
          span.textContent = translation;
          span.classList.add('game-translator-keyword');
          
          if (definition) {
            span.dataset.definition = definition;
          }
          
          return span.outerHTML;
        });
      }
    }
    
    if (modified) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      
      // Add event listeners to all translated keywords
      tempDiv.querySelectorAll('.game-translator-keyword').forEach(el => {
        this.addTooltipListener(el);
      });
      
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      if (node.parentNode) {
        node.parentNode.replaceChild(fragment, node);
      }
    }
  }

  addTooltipListener(element) {
    element.addEventListener('mouseover', (e) => {
      const definition = e.target.dataset.definition;
      if (definition) {
        this.tooltipElement.textContent = definition;
        this.tooltipElement.style.display = 'block';
        this.tooltipElement.style.left = e.pageX + 10 + 'px';
        this.tooltipElement.style.top = e.pageY + 10 + 'px';
      }
    });

    element.addEventListener('mouseout', () => {
      this.tooltipElement.style.display = 'none';
    });
  }

  revertTranslations() {
    document.querySelectorAll('.game-translator-processed').forEach(element => {
      element.classList.remove('game-translator-processed');
    });
    // Note: This is a simplified reversion. In a real implementation,
    // we would need to store original text and restore it.
  }
}

// Initialize the translator
const translator = new GameTranslator();