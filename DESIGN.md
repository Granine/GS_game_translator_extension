# Game Translator Extension Design Document

## Overview

The Game Translator is a Chrome extension designed to provide real-time translation of game-specific terminology while preserving context and providing detailed definitions. This document outlines the technical design and implementation details.

## Core Components

### 1. Translation Engine

#### 1.1 Keyword Conversion Table
- **Structure**: Multi-language dictionary with indexed term mapping
- **Format**:
```json
{
  "conversionTable": {
    "english": ["Engine", "Character", "Skill"],
    "japanese": ["エンジン", "キャラクター", "スキル"],
    "mandarin": ["引擎", "角色", "技能"]
  }
}
```
- **Implementation**:
  - Case-sensitive matching
  - Index-based correspondence across languages
  - Support for multiple source languages
  - Longest-match-first algorithm for overlapping terms

#### 1.2 Definition Table
- **Structure**: Parallel to conversion table with corresponding definitions
- **Format**:
```json
{
  "definitionTable": {
    "english": [
      "Core system that powers the game",
      "Playable entity in the game",
      "Special ability that can be used"
    ],
    "japanese": [
      "ゲームを動かすコアシステム",
      "ゲーム内でプレイ可能なエンティティ",
      "使用可能な特殊能力"
    ]
  }
}
```
- **Implementation**:
  - Indexed mapping to conversion table entries
  - Fallback mechanism for missing definitions
  - HTML formatting support in definitions

### 2. Game Package System

#### 2.1 Package Structure
```json
{
  "metadata": {
    "name": "GameTitle",
    "version": "1.0",
    "languages": ["english", "japanese", "mandarin"],
    "defaultTarget": "english"
  },
  "conversionTable": {
    // as above
  },
  "definitionTable": {
    // as above
  },
  "settings": {
    "caseSensitive": true,
    "enablePartialMatch": false,
    "tooltipDelay": 500
  }
}
```

#### 2.2 Package Management
- File validation
- Version control
- Settings persistence
- Multiple package support

### 3. UI Components

#### 3.1 Popup Interface
- Language selection dropdown
- Translation toggle
- Package upload/management
- Settings configuration

#### 3.2 Tooltip System
- Dynamic positioning
- Definition formatting
- Hover interaction
- Fade in/out animations

### 4. Content Processing

#### 4.1 DOM Traversal
- TreeWalker implementation
- Text node identification
- Dynamic content detection
- Performance optimization

#### 4.2 Text Processing
- Regular expression-based matching
- Case preservation
- Word boundary handling
- HTML entity handling

## Technical Implementation

### 1. Extension Architecture

#### 1.1 File Structure
```
game_translator/
├── manifest.json
├── src/
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   ├── background.js
│   └── styles.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

#### 1.2 Component Communication
- Chrome message passing system
- Event-based architecture
- State management via chrome.storage

### 2. Performance Considerations

#### 2.1 Optimization Techniques
- Caching of processed nodes
- Debounced DOM updates
- Efficient regex patterns
- Memory management

#### 2.2 Resource Usage
- Minimal CPU impact
- Memory footprint management
- Network request optimization

### 3. Security Measures

#### 3.1 Content Security
- CSP implementation
- XSS prevention
- Safe HTML handling

#### 3.2 Data Safety
- Local storage encryption
- Package validation
- Safe defaults

## Data Structures

### 1. Translation Entry
```typescript
interface TranslationEntry {
  sourceText: string;
  targetText: string;
  definition?: string;
  context?: string;
  metadata?: {
    category?: string;
    tags?: string[];
  };
}
```

### 2. Game Package
```typescript
interface GamePackage {
  metadata: {
    name: string;
    version: string;
    languages: string[];
    defaultTarget: string;
  };
  conversionTable: {
    [language: string]: string[];
  };
  definitionTable: {
    [language: string]: string[];
  };
  settings: {
    caseSensitive: boolean;
    enablePartialMatch: boolean;
    tooltipDelay: number;
  };
}
```

### 3. Translation State
```typescript
interface TranslationState {
  isEnabled: boolean;
  targetLang: string;
  sourceText: string;
  translatedText: string;
  definitions: Map<string, string>;
  processedNodes: Set<Node>;
}
```

## Error Handling

### 1. Content Script Errors
- Message passing failures
- DOM mutation errors
- Script injection issues

### 2. Package Validation Errors
- JSON parsing
- Schema validation
- Missing required fields

### 3. Translation Errors
- Missing translations
- Invalid language codes
- Context mismatches

## Future Enhancements

### 1. Planned Features
- Machine translation fallback
- Custom dictionary editor
- Context-aware translations
- Multi-package management

### 2. Potential Improvements
- Translation memory
- Collaborative editing
- Cloud sync support
- Performance optimizations

## Testing Strategy

### 1. Unit Tests
- Component testing
- Data structure validation
- Error handling verification

### 2. Integration Tests
- Cross-component communication
- DOM manipulation
- Event handling

### 3. Performance Tests
- Load time measurement
- Memory usage monitoring
- CPU utilization tracking

## Browser Compatibility

### 1. Chrome Support
- Minimum version: 88
- API compatibility
- Feature detection

### 2. Extension API Usage
- Required permissions
- Optional permissions
- API version compatibility

## Deployment

### 1. Build Process
- Source compilation
- Asset optimization
- Package validation

### 2. Distribution
- Chrome Web Store requirements
- Version management
- Update mechanism

## Maintenance

### 1. Logging
- Error tracking
- Usage statistics
- Performance metrics

### 2. Updates
- Version control
- Backward compatibility
- Migration handling