/**
 * Validation utilities for game packages and settings
 */
class Validator {
  /**
   * Validate a game package structure
   * @param {Object} package - The game package to validate
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  static validateGamePackage(package) {
    const errors = [];

    // Check if package is an object
    if (!package || typeof package !== 'object') {
      return { isValid: false, errors: ['Invalid package format'] };
    }

    // Validate metadata
    if (!package.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!package.metadata.name) errors.push('Missing package name');
      if (!package.metadata.version) errors.push('Missing package version');
      if (!Array.isArray(package.metadata.languages)) {
        errors.push('Invalid or missing languages array');
      }
    }

    // Validate conversion table
    if (!package.conversionTable) {
      errors.push('Missing conversion table');
    } else {
      const lengths = new Set();
      for (const [lang, terms] of Object.entries(package.conversionTable)) {
        if (!Array.isArray(terms)) {
          errors.push(`Invalid terms array for language: ${lang}`);
          continue;
        }
        lengths.add(terms.length);
      }
      if (lengths.size > 1) {
        errors.push('Inconsistent term array lengths across languages');
      }
    }

    // Validate definition table
    if (package.definitionTable) {
      for (const [lang, definitions] of Object.entries(package.definitionTable)) {
        if (!Array.isArray(definitions)) {
          errors.push(`Invalid definitions array for language: ${lang}`);
          continue;
        }
        if (!package.conversionTable[lang]) {
          errors.push(`Definition table contains unknown language: ${lang}`);
        }
        if (package.conversionTable[lang] && 
            definitions.length > package.conversionTable[lang].length) {
          errors.push(`Too many definitions for language: ${lang}`);
        }
      }
    }

    // Validate settings
    if (package.settings) {
      if (typeof package.settings.caseSensitive !== 'boolean') {
        errors.push('Invalid caseSensitive setting');
      }
      if (typeof package.settings.enablePartialMatch !== 'boolean') {
        errors.push('Invalid enablePartialMatch setting');
      }
      if (typeof package.settings.tooltipDelay !== 'number') {
        errors.push('Invalid tooltipDelay setting');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate extension settings
   * @param {Object} settings - The settings to validate
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  static validateSettings(settings) {
    const errors = [];

    if (typeof settings.isEnabled !== 'boolean') {
      errors.push('Invalid isEnabled setting');
    }

    if (typeof settings.targetLang !== 'string' || !settings.targetLang) {
      errors.push('Invalid targetLang setting');
    }

    if (typeof settings.translationEngine !== 'string' || !settings.translationEngine) {
      errors.push('Invalid translationEngine setting');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a language code
   * @param {string} langCode - The language code to validate
   * @returns {boolean} - Whether the language code is valid
   */
  static isValidLanguage(langCode) {
    // This is a simplified validation
    // In a production environment, you might want to use a proper language code library
    return typeof langCode === 'string' && 
           langCode.length >= 2 && 
           langCode.length <= 5 && 
           /^[a-zA-Z-]+$/.test(langCode);
  }
}

export default Validator;