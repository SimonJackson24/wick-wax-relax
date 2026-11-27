import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';
import appTheme from '../src/theme';
import ScentMarquee from '../components/home/ScentMarquee';
import { copiesThatSpan, parseTranslateX } from '../utils/scentMarquee';
import { axe as axeConfig } from '../jest.accessibility';

expect.extend(toHaveNoViolations);

// The global stub in jest.setup.js keeps only `href`; this one forwards the
// other props, so `tabindex` on the duplicate chips can be asserted.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

const SCENTS = [
  { name: 'Lavender Dream', slug: 'lavender-dream', image: '/images/products/lavender-dream.jpg' },
  { name: 'Fireside Vanilla', slug: 'fireside-vanilla', image: '/images/products/fireside-vanilla.jpg' },
  { name: 'Midnight Jasmine', slug: 'midnight-jasmine', image: '/images/products/midnight-jasmine.jpg' },
];

// MUI's useMediaQuery reads window.matchMedia; jest.setup.js stubs it to
// "nothing matches", so reduced motion is switched on per test.
const setReducedMotion = (reduced) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

const renderStrip = (props = {}) => render(
  <ThemeProvider theme={appTheme}>
    <ScentMarquee items={SCENTS} {...props} />
  </ThemeProvider>
);

const mobileRow = (container) => container.querySelector('[data-scent-row]');

describe('ScentMarquee — mobile chip row', () => {
  afterEach(() => setReducedMotion(false));

  it('loops: two identical groups, the second hidden from assistive tech', () => {
    setReducedMotion(false);
    const { container } = renderStrip();
    const track = container.querySelector('[data-scent-track]');
    const groups = [...track.children];
    expect(groups).toHaveLength(2);
    expect(groups[0]).not.toHaveAttribute('aria-hidden');
    expect(groups[1]).toHaveAttribute('aria-hidden', 'true');
    expect(groups[0].querySelectorAll('a')).toHaveLength(SCENTS.length);
    expect(groups[1].querySelectorAll('a')).toHaveLength(SCENTS.length);
  });

  it('keeps the duplicate out of the tab order and the original in it', () => {
    setReducedMotion(false);
    const { container } = renderStrip();
    const [first, second] = container.querySelector('[data-scent-track]').children;
    expect([...first.querySelectorAll('a')].every((a) => a.tabIndex === 0)).toBe(true);
    expect([...second.querySelectorAll('a')].every((a) => a.tabIndex === -1)).toBe(true);
  });

  it('labels the region and links every chip to its product', () => {
    setReducedMotion(false);
    const { container } = renderStrip();
    expect(screen.getByRole('group', { name: 'Explore the scents' })).toBe(mobileRow(container));
    const hrefs = [...container.querySelectorAll('[data-scent-row] a')].map((a) => a.getAttribute('href'));
    expect(new Set(hrefs)).toEqual(new Set(SCENTS.map((s) => `/product/${s.slug}`)));
  });

  it('falls back to a static, focusable, swipeable row under reduced motion', () => {
    setReducedMotion(true);
    const { container } = renderStrip();
    expect(container.querySelector('[data-scent-track]')).toBeNull();
    const row = mobileRow(container);
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row.querySelectorAll('a')).toHaveLength(SCENTS.length);
    expect(container.querySelector('[data-scent-row] [aria-hidden="true"]')).toBeNull();
  });

  it('uses the default scents when none are supplied', () => {
    setReducedMotion(false);
    const { container } = renderStrip({ items: [] });
    const [first] = container.querySelector('[data-scent-track]').children;
    expect(first.querySelectorAll('a')).toHaveLength(8);
  });

  it('has no accessibility violations (marquee)', async () => {
    setReducedMotion(false);
    const { container } = renderStrip();
    expect(await axe(container, axeConfig)).toHaveNoViolations();
  });

  it('has no accessibility violations (reduced motion)', async () => {
    setReducedMotion(true);
    const { container } = renderStrip();
    expect(await axe(container, axeConfig)).toHaveNoViolations();
  });
});

describe('ScentMarquee — a list too short to span the row', () => {
  // jsdom lays nothing out, so stand in for the two measurements the row
  // makes: a 200px copy against a 375px row, so a group needs two copies.
  const originalRect = window.HTMLElement.prototype.getBoundingClientRect;
  const originalWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'clientWidth');

  beforeEach(() => {
    setReducedMotion(false);
    window.HTMLElement.prototype.getBoundingClientRect = function standIn() {
      const isCopy = this.parentElement && this.parentElement.parentElement
        && this.parentElement.parentElement.hasAttribute('data-scent-track');
      const isGroup = this.parentElement && this.parentElement.hasAttribute('data-scent-track');
      const width = isCopy ? 200 : isGroup ? 200 * this.children.length : 0;
      return { width, height: 0, left: 0, right: width, top: 0, bottom: 0, x: 0, y: 0 };
    };
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() { return this.hasAttribute('data-scent-row') ? 375 : 0; },
    });
  });

  afterEach(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalRect;
    if (originalWidth) Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', originalWidth);
    else delete window.HTMLElement.prototype.clientWidth;
    setReducedMotion(false);
  });

  it('repeats the list inside a group, and hides the repeats like the second group', () => {
    const { container } = renderStrip();
    const [first, second] = container.querySelector('[data-scent-track]').children;
    expect(first.children).toHaveLength(2);                       // 200px x 2 >= 375px
    expect(second.children).toHaveLength(2);
    expect(first.children[0]).not.toHaveAttribute('aria-hidden');
    expect(first.children[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('still exposes each scent exactly once, in order', () => {
    const { container } = renderStrip();
    const row = mobileRow(container);
    const copies = row.querySelector('[data-scent-track]').firstChild.children;
    const exposed = [...row.querySelectorAll('a')].filter((a) => !a.closest('[aria-hidden="true"]'));
    expect(exposed).toHaveLength(SCENTS.length);
    expect([...row.querySelectorAll('a')].filter((a) => a.tabIndex >= 0)).toHaveLength(SCENTS.length);
    expect([...copies[1].querySelectorAll('a')].map((a) => a.tabIndex)).toEqual(SCENTS.map(() => -1));
    // …once each, and in the order they were given
    expect(exposed.map((a) => a.textContent.trim())).toEqual(SCENTS.map((scent) => scent.name));
  });
});

describe('scent marquee arithmetic', () => {
  it('one group spans the row for a normal list', () => {
    // 5 chips ≈ 936px against any phone width
    expect(copiesThatSpan(360, 936.2)).toBe(1);
    expect(copiesThatSpan(767, 936.2)).toBe(1);
  });

  it('repeats a short list until a group spans the row', () => {
    expect(copiesThatSpan(375, 365)).toBe(2); // two scents on a phone
    expect(copiesThatSpan(375, 192)).toBe(2); // one scent on a phone
    expect(copiesThatSpan(767, 192)).toBe(4); // one scent on a small tablet
    expect(copiesThatSpan(375, 374)).toBe(2); // a pixel short of the row
  });

  it('does not repeat a copy that already spans the row', () => {
    expect(copiesThatSpan(375, 375)).toBe(1); // exactly as wide
    expect(copiesThatSpan(375, 375.5)).toBe(1);
    expect(copiesThatSpan(375, 374.9)).toBe(1); // within half a pixel
    expect(copiesThatSpan(375, 374.4)).toBe(2); // more than half a pixel short
  });

  it('ignores nonsensical widths', () => {
    expect(copiesThatSpan(375, 0)).toBe(1);
    expect(copiesThatSpan(375, NaN)).toBe(1);
    expect(copiesThatSpan(-1, 100)).toBe(1);
  });

  it('reads the x translation from computed transforms', () => {
    expect(parseTranslateX('matrix(1, 0, 0, 1, -123.5, 0)')).toBe(-123.5);
    expect(parseTranslateX('matrix(1, 0, 0, 1, 0, 0)')).toBe(0);
    expect(parseTranslateX('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -925.7, 0, 0, 1)')).toBe(-925.7);
    expect(parseTranslateX('matrix(1, 0, 0, 1, 8, 0)')).toBe(8);
  });

  it('returns null when there is nothing to read', () => {
    expect(parseTranslateX('none')).toBeNull();
    expect(parseTranslateX('')).toBeNull();
    expect(parseTranslateX(undefined)).toBeNull();
    expect(parseTranslateX(null)).toBeNull();
    expect(parseTranslateX('garbage')).toBeNull();
    expect(parseTranslateX('matrix(1, 0, 0, 1)')).toBeNull(); // too few numbers
    expect(parseTranslateX('matrix(1, 0, 0, 1, x, 0)')).toBeNull(); // not numbers
  });

  it('is not fooled by the digit in "matrix3d"', () => {
    expect(parseTranslateX('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -925.7, 0, 0, 1)')).toBe(-925.7);
    expect(parseTranslateX('matrix(1, 0, 0, 1, -925.7, 0)')).toBe(-925.7);
  });
});
