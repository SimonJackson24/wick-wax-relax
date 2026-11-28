import React, { useEffect, useState } from 'react';
import Link from '@mui/material/Link';

/**
 * Email links that survive Cloudflare's Email Address Obfuscation.
 *
 * The problem: Cloudflare (Scrape Shield → Email Address Obfuscation)
 * rewrites any email-looking text or `mailto:` href in the SERVER HTML into
 * `<a href="/cdn-cgi/l/email-protection#…">`. That path 404s for us when
 * the obfuscated anchor survives hydration, so the visitor hits a 404.
 *
 * The fix here is total: the complete address never appears in the server
 * HTML at all. Before hydration the component renders a plain label ("by
 * email"); after mount it becomes a real `mailto:` link assembled from
 * parts in the browser — Cloudflare never sees it, because it is never on
 * the wire.
 *
 * Everything that renders an email address on this site goes through here.
 */

const USER_PART = 'info';
const DOMAIN_PART = 'wickwaxrelax.co.uk';

/** The contact address, assembled at runtime — never a single source string. */
export const contactEmail = () => `${USER_PART}@${DOMAIN_PART}`;

/**
 * A clickable mailto link for the contact address.
 *
 * Server render: the plain `label` text (no address, no href to mangle).
 * After mount: the full address as a mailto link.
 */
export const EmailLink = ({ label = 'by email', ...props }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span {...props}>{label}</span>;
  }
  const address = contactEmail();
  return (
    <Link href={`mailto:${address}`} {...props}>
      {props.children || address}
    </Link>
  );
};

/**
 * For content strings that mention the contact address (legal-page
 * paragraphs): the server render replaces the address with `label`
 * ("by email"); after mount the real mailto link takes its place.
 * Non-strings pass through untouched.
 */
export const EmailText = ({ value, label = 'by email' }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (typeof value !== 'string' || !value.includes('@')) return value;
  const pattern = new RegExp(`\\S*@\\S*`, 'gi');
  const parts = value.split(pattern);
  if (parts.length === 1) return value;
  if (!mounted) {
    // No address on the wire: the sentence just says "by email".
    return [parts[0], label].join('');
  }
  return parts.map((part, i) => (
    <React.Fragment key={`${i}`}>
      {part}
      {i < parts.length - 1 && (
        <Link href={`mailto:${contactEmail()}`} sx={{ whiteSpace: 'nowrap' }}>
          {contactEmail()}
        </Link>
      )}
    </React.Fragment>
  ));
};
