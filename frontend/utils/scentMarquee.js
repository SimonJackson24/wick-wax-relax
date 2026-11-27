/**
 * Pure helpers for the mobile scent-chip marquee
 * (components/home/ScentMarquee.js). Kept out of the component so the loop
 * arithmetic can be unit-tested without a browser.
 */

/**
 * The x translation out of a computed `matrix(...)` / `matrix3d(...)` value,
 * or null when there is no transform to read.
 *
 * Only the numbers inside the brackets are read: fishing for digits in the
 * whole string would pick up the "3" in "matrix3d" and count one too many.
 * Chrome reports a 3D translation as a flat matrix; WebKit keeps matrix3d.
 */
export const parseTranslateX = (matrix) => {
  if (typeof matrix !== 'string') return null;
  const open = matrix.indexOf('(');
  const close = matrix.lastIndexOf(')');
  if (open === -1 || close < open) return null;
  const values = matrix.slice(open + 1, close).split(',').map(Number);
  if (values.length !== 6 && values.length !== 16) return null;
  if (values.some((value) => !Number.isFinite(value))) return null;
  return values.length === 16 ? values[12] : values[4];
};

/**
 * How many times a group has to repeat the chip list so that one group
 * spans the whole row. The track holds two identical groups and travels
 * exactly one group per cycle, so a group must be at least as wide as the
 * row, or the right edge would run empty for part of the loop.
 */
export const copiesThatSpan = (rowWidth, copyWidth) => {
  if (!(copyWidth > 0) || !(rowWidth >= 0)) return 1;
  // A copy that falls up to half a pixel short of the row still covers it
  // for practical purposes, so that case is not rounded up.
  return Math.max(1, Math.ceil((rowWidth - 0.5) / copyWidth));
};
