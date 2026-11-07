// CLP datasheet paste-parser.
//
// Suppliers of fragrance oils publish CLP datasheets listing, per
// concentration band, the signal word, GHS pictograms, H/P statement
// codes and declared allergens. Typing those by hand is slow and
// error-prone; pasting the sheet and extracting programmatically is not.
//
// Everything extracted is echoed back for eyeball verification against
// the sheet — this is a data-entry accelerator, not a compliance oracle.
// The user must still confirm the band they pasted matches the product's
// fragrance load.

// The EU declared fragrance allergens (Regulation (EC) No 1223/2009,
// Annex III) most commonly found on candle/wax-melt CLP sheets, plus
// common label aliases. Matched case-insensitively on word boundaries.
const ALLERGEN_DICTIONARY = [
  'Amyl Cinnamal', 'Amylcinnamyl Alcohol', 'Anise Alcohol', 'Atranol',
  'Benzyl Alcohol', 'Benzyl Benzoate', 'Benzyl Cinnamate', 'Benzyl Salicylate',
  'Benzyl Penicillin', 'Cinnamal', 'Cinnamyl Alcohol', 'Citral', 'Citronellol',
  'Coumarin', 'Eugenol', 'Evernia Prunastri', 'Oakmoss', 'Evernia Furfuracea',
  'Treemoss', 'Farnesol', 'Geraniol', 'Hexyl Cinnamal', 'Hydroxycitronellal',
  'Isoeugenol', 'Limonene', 'Linalool', 'Methyl 2-Octynoate',
  'alpha-Isomethyl Ionone', 'Methyl Ionone', 'Chloroatranol',
];

// Canonical display names for what we match.
const CANONICAL_ALLERGENS = {
  'oakmoss': 'Evernia Prunastri (Oakmoss)',
  'treemoss': 'Evernia Furfuracea (Treemoss)',
  'methyl ionone': 'alpha-Isomethyl Ionone',
};

const H_CODE_RE = /\bH\d{3}\b/g;
const P_CODE_RE = /\bP\d{3}(?:\+\d{3})*\b/g;
const GHS_RE = /\bGHS0[1-9]\b/gi;
const SIGNAL_WORD_RE = /\b(DANGER|WARNING)\b/i;

const uniqueSorted = (arr) => [...new Set(arr)];

function uppercaseCodes(text, re) {
  const matches = text.match(re) || [];
  return uniqueSorted(matches.map((m) => m.toUpperCase()));
}

// Parse a pasted CLP datasheet section into form-ready CLP values.
// Returns { values, summary } where summary lists what was found so the
// admin UI can show it for verification.
function parseClpSheet(text) {
  const input = String(text || '');
  if (!input.trim()) {
    return { values: null, summary: { error: 'Nothing to parse — paste the datasheet text first.' } };
  }

  // Strip markup that commonly sneaks in when pasting from PDFs/HTML.
  const clean = input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');

  const signalMatch = clean.match(SIGNAL_WORD_RE);
  const pictograms = uppercaseCodes(clean, GHS_RE);
  const hazardStatements = uppercaseCodes(clean, H_CODE_RE);
  const precautionaryStatements = uniqueSorted((clean.match(P_CODE_RE) || []).map((m) => m.toUpperCase()));

  // Allergens: word-boundary, case-insensitive dictionary match.
  const allergens = [];
  for (const name of ALLERGEN_DICTIONARY) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
    if (re.test(clean)) {
      allergens.push(CANONICAL_ALLERGENS[name.toLowerCase()] || name);
    }
  }

  const values = {
    clp_signal_word: signalMatch ? signalMatch[1].toUpperCase() : '',
    clp_hazard_pictograms: pictograms,
    clp_hazard_statements: hazardStatements,
    clp_precautionary_statements: precautionaryStatements,
    clp_allergens: allergens.join(', '),
  };

  const found = Object.values(values).some((v) => v && v.length > 0);
  if (!found) {
    return {
      values,
      summary: { error: 'No CLP elements recognised — check you pasted the datasheet text (codes like H317, P102, GHS02).' },
    };
  }

  const summary = {
    signalWord: values.clp_signal_word || 'not found',
    pictograms: pictograms.join(', ') || 'none',
    hazardStatements: hazardStatements.join(', ') || 'none',
    precautionaryStatements: precautionaryStatements.join(', ') || 'none',
    allergens: allergens.length ? allergens.join(', ') : 'none declared',
  };

  return { values, summary };
}

export { parseClpSheet };
