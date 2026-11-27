/**
 * Shared axe-core configuration for the accessibility tests.
 *
 * This file is referenced by `jest.config.js` (setupFilesAfterEnv) and by
 * `__tests__/accessibility.test.js` (as the `axe` config) — it was missing
 * from the repository, which meant the whole Jest suite failed to start:
 *
 *   Validation Error: Module <rootDir>/jest.accessibility.js in the
 *   setupFilesAfterEnv option was not found.
 *
 * Colour contrast is switched off here because jsdom has no layout engine:
 * it cannot compute a background colour for an element, so the rule can
 * only ever return "incomplete" there. The real contrast check for this
 * project runs in a browser (axe-core against the built site) and is
 * recorded in docs/design/mobile-pass-2026-11/SCORECARD.md.
 */
const axe = {
  rules: {
    'color-contrast': { enabled: false },
  },
};

module.exports = { axe };
