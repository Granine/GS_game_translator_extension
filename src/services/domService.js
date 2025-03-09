import Logger from '../utils/logger.js';

const logger = new Logger('DOMService');

/**
 * Service for handling DOM manipulation and translation application
 */
class DOMService {
  constructor() {
    this.processedNodes = new WeakSet();
    this.observer = null;
    this.translationService = null;
    this.tooltipContainer = null;
  }

  /**
   * Initialize the service
   * @param {TranslationService} translationService - The translation service instance
   */
  initialize(translationService) {
    this.translationService = translationService;
    this.setupTooltip();
    this.setupObserver();
  }

  /**
   * Set up the tooltip container
   */
  setupTooltip() {
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.className = 'game-translator-tooltip';
    this.tooltipContainer.style.cssText = `
      position: fixed;
      display: none;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-size: 14px;
      max-width: 300px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.tooltipContainer);
  }

  /**
   * Set up the mutation observer
   */
  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNode(node);
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Process a DOM node for translation
   * @param {Node} node - The node to process
   */
  processNode(node) {
    try {
      if (this.processedNodes.has(node)) return;

      const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
            if (parent.tagName === 'SCRIPT') return NodeFilter.FILTER_REJECT;
            if (parent.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let textNode;
      while (textNode = walker.nextNode()) {
        this.translateTextNode(textNode);
      }

      this.processedNodes.add(node);
    } catch (error) {
      logger.error('Error processing node', error);
    }
  }

  /**
   * Translate a text node
   * @param {Node} textNode - The text node to translate
   */
  translateTextNode(textNode) {
    try {
      const originalText = textNode.nodeValue;
      const { translatedText, translations } = this.translationService.translateText(
        originalText,
        this.translationService.targetLang
      );

      if (translatedText !== originalText) {
        const span = document.createElement('span');
        span.innerHTML = this.highlightTranslations(translatedText, translations);
        
        const parent = textNode.parentNode;
        parent.replaceChild(span, textNode);

        this.addTooltipListeners(span, translations);
      }
    } catch (error) {
      logger.error('Error translating text node', error);
    }
  }

  /**
   * Highlight translated terms in the text
   * @param {string} text - The translated text
   * @param {Map} translations - Map of translations to definitions
   * @returns {string} - HTML with highlighted translations
   */
  highlightTranslations(text, translations) {
    let result = text;
    translations.forEach((definition, term) => {
      const regex = new RegExp(term, 'g');
      result = result.replace(regex, `<span class="translated-term" data-definition="${definition}">${term}</span>`);
    });
    return result;
  }

  /**
   * Add tooltip event listeners to translated terms
   * @param {Element} container - The container element
   * @param {Map} translations - Map of translations to definitions
   */
  addTooltipListeners(container, translations) {
    const terms = container.getElementsByClassName('translated-term');
    Array.from(terms).forEach(term => {
      term.addEventListener('mouseenter', (e) => {
        const definition = e.target.dataset.definition;
        if (!definition) return;

        this.tooltipContainer.textContent = definition;
        this.tooltipContainer.style.display = 'block';
        
        const rect = e.target.getBoundingClientRect();
        const tooltipRect = this.tooltipContainer.getBoundingClientRect();
        
        let left = rect.left;
        let top = rect.bottom + 5;

        // Adjust position if tooltip would go off screen
        if (left + tooltipRect.width > window.innerWidth) {
          left = window.innerWidth - tooltipRect.width - 5;
        }
        if (top + tooltipRect.height > window.innerHeight) {
          top = rect.top - tooltipRect.height - 5;
        }

        this.tooltipContainer.style.left = `${left}px`;
        this.tooltipContainer.style.top = `${top}px`;
      });

      term.addEventListener('mouseleave', () => {
        this.tooltipContainer.style.display = 'none';
      });
    });
  }

  /**
   * Clean up the service
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.tooltipContainer) {
      this.tooltipContainer.remove();
    }
    this.processedNodes = new WeakSet();
  }
}

export default DOMService;