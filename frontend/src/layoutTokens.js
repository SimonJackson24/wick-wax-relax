/**
 * Layout scale — one source of truth for section rhythm and gutters.
 *
 * Before this file each section invented its own vertical padding (7 / 10 /
 * 11 / 12 in MUI's 8px scale), which is why the mobile page felt like
 * stacked blocks of different heights. Two values only:
 *
 *   SECTION_PY          major sections   56px mobile / 96px desktop
 *   SECTION_PY_COMPACT  bands & strips    40px mobile / 56px desktop
 *
 * GUTTER is the horizontal page inset: 20px mobile / 32px desktop (the
 * hero and the scent row use 20px, so every section's left edge lines up).
 * Values are MUI spacing units (8px each), so they can be dropped straight
 * into `sx`.
 */
export const SECTION_PY = { xs: 7, md: 12 };
export const SECTION_PY_COMPACT = { xs: 5, md: 7 };
export const GUTTER = { xs: 2.5, md: 4 };

/** Minimum comfortable tap target (WCAG 2.5.5 / platform guidance). */
export const TAP_TARGET = 44;
