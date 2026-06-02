const CUTOFF_HOUR = 15;
const CUTOFF_MINUTE = 0;

export function getUKDate() {
  return new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
}

export function isWorkingDay(date) {
  const day = date.getDay();
  return day >= 1 && day <= 6;
}

export function getDispatchInfo() {
  const now = getUKDate();
  const isBeforeCutoff = now.getHours() < CUTOFF_HOUR || (now.getHours() === CUTOFF_HOUR && now.getMinutes() < CUTOFF_MINUTE);

  if (isWorkingDay(now) && isBeforeCutoff) {
    return {
      dispatchDate: now,
      dispatchLabel: 'Today',
      dispatchMessage: 'Order before 3pm for same-day dispatch',
    };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let nextDispatch = tomorrow;
  while (!isWorkingDay(nextDispatch)) {
    nextDispatch.setDate(nextDispatch.getDate() + 1);
  }

  return {
    dispatchDate: nextDispatch,
    dispatchLabel: nextDispatch.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    dispatchMessage: `Order now for dispatch ${nextDispatch.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`,
  };
}

export function getShippingOptions(cartTotal = 0) {
  const freeThreshold = 40;

  const options = [
    {
      id: 'next_day',
      label: 'Next Day 1st Class',
      price: 4.99,
      priceLabel: '£4.99',
      deliveryDays: '1 working day',
      eligible: true,
    },
    {
      id: 'standard_48',
      label: '2nd Class',
      price: 2.99,
      priceLabel: '£2.99',
      deliveryDays: '2 working days',
      eligible: true,
    },
  ];

  if (cartTotal >= freeThreshold) {
    options.unshift({
      id: 'free_next_day',
      label: 'Next Day 1st Class',
      price: 0,
      priceLabel: 'FREE',
      deliveryDays: '1 working day',
      eligible: true,
      badge: `Free over £${freeThreshold}`,
    });
    options[1].bestDeal = false;
    options[2].bestDeal = false;
  } else {
    options[0].bestDeal = true;
    options[1].bestDeal = false;
    const remaining = freeThreshold - cartTotal;
    if (remaining > 0) {
      options[0].thresholdNote = `Spend £${remaining.toFixed(2)} more for free next-day delivery`;
    }
  }

  return {
    options,
    freeShippingThreshold: freeThreshold,
    cartTotal,
  };
}

export function getShippingCost(cartTotal = 0) {
  const freeThreshold = 40;
  if (cartTotal >= freeThreshold) return 0;
  return 2.99;
}

export function getDeliveryEstimator(cartTotal = 0) {
  const now = getUKDate();
  const dispatch = getDispatchInfo();
  const shipping = getShippingOptions(cartTotal);

  const workingDaysToAdd = (baseDate, days) => {
    const result = new Date(baseDate);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (isWorkingDay(result)) {
        added++;
      }
    }
    return result;
  };

  const dispatchDate = dispatch.dispatchDate;
  const deliveryEstimates = shipping.options.map(option => {
    const days = option.id === 'free_next_day' || option.id === 'next_day' ? 1 : 2;
    const deliveryDate = workingDaysToAdd(dispatchDate, days);
    return {
      id: option.id,
      label: option.label,
      priceLabel: option.priceLabel,
      badge: option.badge,
      thresholdNote: option.thresholdNote,
      deliveryLabel: deliveryDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
    };
  });

  const asOf = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return {
    dispatch,
    shipping: {
      ...shipping,
      deliveryEstimates,
    },
    asOf,
    cutoffHour: CUTOFF_HOUR,
    cutoffLabel: '3pm',
    daysUntilFree: cartTotal < 40 ? Math.ceil((40 - cartTotal) / 20) : 0,
  };
}

export function getDeliveryDate(cartTotal = 0) {
  const estimator = getDeliveryEstimator(cartTotal);
  if (!estimator.shipping.deliveryEstimates || estimator.shipping.deliveryEstimates.length === 0) {
    return '2-3 working days';
  }
  // Return the earliest (free/next-day) delivery estimate
  const first = estimator.shipping.deliveryEstimates[0];
  return first.deliveryLabel;
}
