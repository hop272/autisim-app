# Change summary

## What changed
- Replaced the broken React Native-style screen modules with a browser-first TypeScript implementation that runs from the existing HTML shell.
- Added a lightweight local store so task, sensory, energy, and recovery state are shared across screens.
- Introduced a simple DOM-based UI layer so the app can run without external React or React Native dependencies.
- Added build configuration and a stylesheet so the app can be built and opened in a browser.

## Why these changes matter
- The app now matches the MVP focus from the product spec: task breakdown, sensory check-ins, energy budgeting, and recovery mode.
- The structure is easier to port to a mobile wrapper later while still supporting a web version now.
- The implementation keeps the tone calm, low-friction, and privacy-aware rather than over-engineered.
