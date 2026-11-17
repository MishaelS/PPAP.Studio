# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- `src/backend/constants.js`: shared constants and small helpers (`clamp`, `makeId`, `cx`, `percent`, `safeFileName`, `isTypingTarget`).
- Changelog.
- `resources/` folder for app assets: `locales/`, `icons/`, `fonts/`, `sounds/`.
- Russian and English translations with a language switcher in the toolbar (choice is remembered).
- SVG icons for toolbar, browser and channel buttons; logo and favicon.

### Changed
- Frontend modules and tests take magic numbers, strings and helpers from `constants.js` instead of defining them locally.
- All user-facing text moved from code to `resources/locales/*.json`.

## [0.0.1] - 2026-11-17

### Added
- Step sequencer in the browser: Channel Rack with 16/32 steps, mute/solo, volume and pan per channel.
- Built-in drum kit synthesized with Web Audio (13 sounds), sample browser with preview and drag and drop.
- Transport: play/stop (Space), BPM.
- Autosave to localStorage, JSON project export/import with validation and readable errors.
- WAV export.
- Docker setup (site + Postgres) and `run.sh` for start, tests, logs and reset.
- Unit tests (Vitest).
