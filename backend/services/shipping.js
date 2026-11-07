const { query } = require('../config/database');

// Shipping service (roadmap 1.19-1.22).
//
// The store previously charged items only — shipping was never added to
// an order total, and the free_shipping_threshold setting was read by
// nothing. This service makes both live:
//   * listRates(zone) — the options a shopper can pick at checkout
//   * calculateShipping({ zone, weightGrams, subtotal }) — the actual
//     cost, honouring per-rate free_over_amount (which the admin
//     threshold setting feeds into the UK rates).

// Map a destination country to a shipping zone.
function zoneForCountry(country) {
  const c = String(country || 'GB').trim().toUpperCase();
  if (c === 'GB' || c === 'UK') return 'UK';
  // EU member states (27) + GB territories handled as UK above.
  const EU = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE',
  ]);
  if (EU.has(c)) return 'EU';
  return 'WORLDWIDE';
}

// Rates available for a zone, ordered for display.
async function listRates(zone = 'UK') {
  const result = await query(
    `SELECT id, zone, method_code, name, description, price,
            min_weight_grams, max_weight_grams, free_over_amount,
            estimated_days_min, estimated_days_max, sort_order
       FROM shipping_rates
      WHERE zone = ? AND is_active = TRUE
      ORDER BY sort_order, price ASC`,
    [zone]
  );
  return result.rows.map((r) => ({
    id: r.id,
    zone: r.zone,
    methodCode: r.method_code,
    name: r.name,
    description: r.description,
    price: parseFloat(r.price),
    minWeightGrams: r.min_weight_grams,
    maxWeightGrams: r.max_weight_grams,
    freeOverAmount: r.free_over_amount != null ? parseFloat(r.free_over_amount) : null,
    estimatedDaysMin: r.estimated_days_min,
    estimatedDaysMax: r.estimated_days_max,
    sortOrder: r.sort_order,
  }));
}

// Calculate the shipping cost for a basket.
//
// weightGrams: total weight of the items (may be null when products have
//              no weight set — then the weight-banded rates that require
//              a band are skipped and the flat rate applies).
// subtotal:    basket value, used for free_over_amount.
async function calculateShipping({ zone = 'UK', weightGrams = null, subtotal = 0 }) {
  const rates = await listRates(zone);
  if (rates.length === 0) {
    return { available: false, cost: 0, options: [], reason: 'No shipping rates configured for this zone' };
  }

  const weight = weightGrams != null ? Number(weightGrams) : null;

  // Which rates can carry this basket? A rate applies when the basket
  // weight falls inside its band (or the band is open-ended).
  const applicable = rates.filter((r) => {
    if (weight == null) return r.minWeightGrams == null && r.maxWeightGrams == null;
    const aboveMin = r.minWeightGrams == null || weight >= r.minWeightGrams;
    const belowMax = r.maxWeightGrams == null || weight <= r.maxWeightGrams;
    return aboveMin && belowMax;
  });

  // Fall back to the cheapest open-ended rate when no band matched
  // (e.g. a heavy parcel with only weight-banded rates configured).
  const candidates = applicable.length > 0
    ? applicable
    : rates.filter((r) => r.minWeightGrams == null && r.maxWeightGrams == null);
  const usable = candidates.length > 0 ? candidates : rates;

  const withPrices = usable.map((r) => {
    const isFree = r.freeOverAmount != null && Number(subtotal) >= r.freeOverAmount;
    return {
      ...r,
      cost: isFree ? 0 : r.price,
      freeApplied: isFree,
    };
  });

  const cheapest = withPrices.reduce((min, r) => (r.cost < min.cost ? r : min), withPrices[0]);

  return {
    available: true,
    cost: cheapest.cost,
    options: withPrices,
    methodCode: cheapest.methodCode,
    freeApplied: cheapest.freeApplied,
  };
}

// Estimate delivery window for a chosen method (used on the PDP and at
// checkout). Returns null when no rate matches.
async function estimateDelivery({ zone = 'UK', weightGrams = null, subtotal = 0 }) {
  const result = await calculateShipping({ zone, weightGrams, subtotal });
  if (!result.available || !result.options.length) return null;
  const chosen = result.options[0];
  if (chosen.estimatedDaysMin == null && chosen.estimatedDaysMax == null) return null;
  return {
    methodCode: chosen.methodCode,
    name: chosen.name,
    daysMin: chosen.estimatedDaysMin,
    daysMax: chosen.estimatedDaysMax,
    cost: chosen.cost,
  };
}

module.exports = { listRates, calculateShipping, estimateDelivery, zoneForCountry };
