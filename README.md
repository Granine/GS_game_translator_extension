# Game Translator Chrome Extension

A powerful Chrome extension designed to translate game content using customizable translation tables and providing contextual definitions for gaming terminology.

## Features

- **Custom Translation Tables**: Support for multiple language pairs with case-sensitive keyword matching
- **Contextual Definitions**: Hover-based definition display for translated terms
- **Game Packages**: Bundle translation tables and settings into shareable JSON packages
- **Real-time Translation**: Dynamic content translation as you browse
- **Multiple Language Support**: Flexible support for any language pair
- **Non-invasive UI**: Clean tooltip-based interface for definitions

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `game_translator` directory

## Usage

1. Click the extension icon in your browser toolbar
2. Select your target language from the dropdown
3. Upload a game package JSON file (see format below)
4. Toggle translation on/off using the button

## Game Package Format

```json
{
  "conversionTable": {
    "english": ["Term1", "Term2"],
    "japanese": ["用語1", "用語2"],
    "mandarin": ["术语1", "术语2"]
  },
  "definitionTable": {
    "english": ["Definition1", "Definition2"],
    "japanese": ["定義1", "定義2"],
    "mandarin": ["定义1", "定义2"]
  }
}
```

## Requirements

- Chrome Browser (Version 88 or higher)
- Permissions:
  - Storage (for saving settings)
  - ActiveTab (for page translation)
  - Scripting (for dynamic content handling)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, feature requests, or questions, please open an issue in the GitHub repository.