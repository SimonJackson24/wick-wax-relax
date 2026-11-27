import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import appTheme from '../src/theme';
import TrustBadges from '../components/TrustBadges';
import { axe as axeConfig } from '../jest.accessibility';

expect.extend(toHaveNoViolations);

// The trust strip is rendered with the app's own theme — the bee is sized and
// coloured by it, like the five Material icons beside it.
const renderStrip = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <TrustBadges />
    </ThemeProvider>
  );

// The opening of the bee's body outline, and of the Material leaf it replaced.
const HONEYBEE_BODY = 'M12 3.2C13.077 3.2 13.95 4.073 13.95 5.15';
const LEAF = 'M12 3c-4.8 0-9 3.86-9 9';

// Each badge is a group with its promise as a tooltip; the strip renders two
// copies of the list (the mobile marquee and the desktop row), so take the first.
const badgeIcon = (container, detail) =>
  container.querySelector(`[title="${detail}"] svg`);

describe('TrustBadges', () => {
  it('lists all six promises', () => {
    const { container } = renderStrip();
    const labels = [...new Set([...container.querySelectorAll('[title] p, [title] span')].map((el) => el.textContent))];
    expect(labels).toEqual(
      expect.arrayContaining(['Ethical Beeswax', 'Sustainable Wax', 'Handmade in UK', '100% Vegan', 'Eco Packaging', 'Secure Checkout'])
    );
  });

  it('gives Ethical Beeswax the honeybee, not the leaf', () => {
    const { container } = renderStrip();
    const svg = badgeIcon(container, 'Queen bees kept with intact wings');
    const body = svg.querySelector('path').getAttribute('d');
    expect(body.startsWith(HONEYBEE_BODY)).toBe(true);
    expect(body).not.toContain(LEAF);
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('leaves the leaf on Sustainable Wax alone', () => {
    const { container } = renderStrip();
    const leaf = badgeIcon(container, 'Premium plant-based blend');
    expect(leaf.querySelector('path').getAttribute('d').startsWith(LEAF)).toBe(true);
  });

  it('keeps the bee decorative: the label, not the icon, carries the meaning', () => {
    const { container } = renderStrip();
    expect(badgeIcon(container, 'Queen bees kept with intact wings').getAttribute('aria-hidden')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderStrip();
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });
});
