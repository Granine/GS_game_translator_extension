import Logger from '../utils/logger.js';

const logger = new Logger('TranslationService');

/**
 * Service for handling translations and definitions
 */
class TranslationService {
  constructor() {
    this.conversionTable = null;
    this.definitionTable = null;
    this.settings = null;
    this.targetLang = null;
  }

  /**
   * Initialize the service with a game package
   * @param {Object} package - The game package containing translations and definitions
   * @param {string} targetLang - The target language
   */
  initialize(package, targetLang) {
    try {
      this.conversionTable = package.conversionTable;
      this.definitionTable = package.definitionTable;
      this.settings = package.settings;
      this.targetLang = targetLang;

      logger.info('Translation service initialized', {
        languages: Object.keys(this.conversionTable),
        targetLang
      });
    } catch (error) {
      logger.error('Failed to initialize translation service', error);
      throw new Error('Translation service initialization failed');
    }
  }

  /**
   * Find the best matching term in the source text
   * @param {string} text - The text to search in
   * @param {string} sourceLang - The source language
   * @returns {Object} - { term, index, position }
   */
  findBestMatch(text, sourceLang) {
    try {
      const sourceTerms = this.conversionTable[sourceLang];
      if (!sourceTerms) {
        throw new Error(`Language not found: ${sourceLang}`);
      }

      let bestMatch = null;
      let bestIndex = -1;
      let bestPosition = -1;

      sourceTerms.forEach((term, index) => {
        const position = this.settings.caseSensitive ?
          text.indexOf(term) :
          text.toLowerCase().indexOf(term.toLowerCase());

        if (position !== -1 && (!bestMatch || term.length > bestMatch.length)) {
          bestMatch = term;
          bestIndex = index;
          bestPosition = position;
        }
      });

      return bestMatch ? { term: bestMatch, index: bestIndex, position: bestPosition } : null;
    } catch (error) {
      logger.error('Error finding best match', error, { text, sourceLang });
      return null;
    }
  }

  /**
   * Get the translation for a term
   * @param {string} term - The term to translate
   * @param {string} sourceLang - The source language
   * @returns {Object} - { translation, definition }
   */
  getTranslation(term, sourceLang) {
    try {
      const match = this.findBestMatch(term, sourceLang);
      if (!match) return null;

      const targetTerms = this.conversionTable[this.targetLang];
      const targetDefinitions = this.definitionTable?.[this.targetLang];

      return {
        translation: targetTerms[match.index],
        definition: targetDefinitions?.[match.index] || null
      };
    } catch (error) {
      logger.error('Error getting translation', error, { term, sourceLang });
      return null;
    }
  }

  /**
   * Translate a block of text
   * @param {string} text - The text to translate
   * @param {string} sourceLang - The source language
   * @returns {Object} - { translatedText, translations }
   */
  translateText(text, sourceLang) {
    try {
      let translatedText = text;
      const translations = new Map();
      let lastMatch = null;

      while (true) {
        const match = this.findBestMatch(translatedText, sourceLang);
        if (!match || (lastMatch && match.position === lastMatch.position)) break;

        const translation = this.getTranslation(match.term, sourceLang);
        if (!translation) break;

        translatedText = translatedText.slice(0, match.position) +
                        translation.translation +
                        translatedText.slice(match.position + match.term.length);

        translations.set(translation.translation, translation.definition);
        lastMatch = match;
      }

      return { translatedText, translations };
    } catch (error) {
      logger.error('Error translating text', error, { text, sourceLang });
      return { translatedText: text, translations: new Map() };
    }
  }

  /**
   * Get available languages
   * @returns {string[]} - List of available languages
   */
  getAvailableLanguages() {
    return Object.keys(this.conversionTable || {});
  }

  /**
   * Check if a language is supported
   * @param {string} lang - The language code to check
   * @returns {boolean} - Whether the language is supported
   */
  isLanguageSupported(lang) {
    return Boolean(this.conversionTable?.[lang]);
  }
}

export default TranslationService;