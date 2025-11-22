// Frontend subscription utility functions

/**
 * Calculate subscription savings over time
 * @param {number} price - Product price
 * @param {number} discountPercentage - Subscription discount percentage
 * @param {string} interval - Subscription interval (WEEKLY, BIWEEKLY, MONTHLY)
 * @param {number} months - Number of months to calculate for
 * @returns {object} Savings calculation
 */
export function calculateSubscriptionSavings(price, discountPercentage, interval, months = 12) {
  const discountAmount = (price * discountPercentage) / 100;
  const discountedPrice = price - discountAmount;

  let deliveriesPerMonth;
  switch (interval.toUpperCase()) {
    case 'WEEKLY':
      deliveriesPerMonth = 4.33; // Average weeks per month
      break;
    case 'BIWEEKLY':
      deliveriesPerMonth = 2.17; // Average bi-weeks per month
      break;
    case 'MONTHLY':
      deliveriesPerMonth = 1;
      break;
    default:
      deliveriesPerMonth = 1;
  }

  const totalDeliveries = Math.floor(deliveriesPerMonth * months);
  const totalRegularPrice = price * totalDeliveries;
  const totalSubscriptionPrice = discountedPrice * totalDeliveries;
  const totalSavings = totalRegularPrice - totalSubscriptionPrice;

  return {
    originalPrice: price,
    discountedPrice: discountedPrice,
    discountAmount: discountAmount,
    discountPercentage: discountPercentage,
    deliveriesPerMonth: deliveriesPerMonth,
    totalDeliveries: totalDeliveries,
    totalRegularPrice: totalRegularPrice,
    totalSubscriptionPrice: totalSubscriptionPrice,
    totalSavings: totalSavings,
    savingsPercentage: (totalSavings / totalRegularPrice) * 100,
    months: months
  };
}

/**
 * Format subscription interval for display
 * @param {string} interval - Subscription interval
 * @returns {string} Formatted interval
 */
export function formatSubscriptionInterval(interval) {
  switch (interval.toUpperCase()) {
    case 'WEEKLY':
      return 'Weekly';
    case 'BIWEEKLY':
      return 'Every 2 weeks';
    case 'MONTHLY':
      return 'Monthly';
    default:
      return interval;
  }
}

/**
 * Get subscription status color for UI
 * @param {string} status - Subscription status
 * @returns {string} Color code
 */
export function getSubscriptionStatusColor(status) {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    case 'EXPIRED':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Check if subscription is due for renewal
 * @param {string} nextOrderDate - Next order date (YYYY-MM-DD)
 * @param {number} daysAhead - Days ahead to check (default: 3)
 * @returns {boolean} Whether subscription is due
 */
export function isSubscriptionDue(nextOrderDate, daysAhead = 3) {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + daysAhead);

  const nextOrder = new Date(nextOrderDate);

  return nextOrder <= dueDate;
}

/**
 * Calculate subscription metrics for dashboard
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {object} Subscription metrics
 */
export function calculateSubscriptionMetrics(subscriptions) {
  const metrics = {
    total: subscriptions.length,
    active: 0,
    paused: 0,
    cancelled: 0,
    expired: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    churnRate: 0
  };

  let totalRevenue = 0;
  let activeSubscriptions = 0;

  subscriptions.forEach(sub => {
    // Count by status
    switch (sub.status.toUpperCase()) {
      case 'ACTIVE':
        metrics.active++;
        activeSubscriptions++;
        break;
      case 'PAUSED':
        metrics.paused++;
        break;
      case 'CANCELLED':
        metrics.cancelled++;
        break;
      case 'EXPIRED':
        metrics.expired++;
        break;
    }

    // Calculate revenue (if available)
    if (sub.product && sub.product.price && sub.plan && sub.plan.discount_percentage) {
      const discountAmount = (sub.product.price * sub.plan.discount_percentage) / 100;
      const discountedPrice = sub.product.price - discountAmount;
      totalRevenue += discountedPrice;
    }
  });

  metrics.totalRevenue = totalRevenue;
  metrics.averageOrderValue = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

  // Calculate churn rate (cancelled + expired) / total
  const churnedSubscriptions = metrics.cancelled + metrics.expired;
  metrics.churnRate = metrics.total > 0 ? (churnedSubscriptions / metrics.total) * 100 : 0;

  return metrics;
}

/**
 * Generate subscription summary for user dashboard
 * @param {Array} subscriptions - User's subscriptions
 * @returns {object} Subscription summary
 */
export function generateSubscriptionSummary(subscriptions) {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE');
  const pausedSubscriptions = subscriptions.filter(sub => sub.status === 'PAUSED');
  const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'CANCELLED');

  const nextDeliveries = activeSubscriptions
    .filter(sub => sub.next_order_date)
    .sort((a, b) => new Date(a.next_order_date) - new Date(b.next_order_date))
    .slice(0, 3); // Next 3 deliveries

  const totalMonthlySavings = activeSubscriptions.reduce((total, sub) => {
    if (sub.product && sub.product.price && sub.plan && sub.plan.discount_percentage) {
      const discountAmount = (sub.product.price * sub.plan.discount_percentage) / 100;
      return total + discountAmount;
    }
    return total;
  }, 0);

  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: activeSubscriptions.length,
    pausedSubscriptions: pausedSubscriptions.length,
    cancelledSubscriptions: cancelledSubscriptions.length,
    nextDeliveries: nextDeliveries,
    totalMonthlySavings: totalMonthlySavings,
    estimatedMonthlySpend: activeSubscriptions.reduce((total, sub) => {
      if (sub.product && sub.product.price && sub.plan && sub.plan.discount_percentage) {
        const discountAmount = (sub.product.price * sub.plan.discount_percentage) / 100;
        const discountedPrice = sub.product.price - discountAmount;
        return total + discountedPrice;
      }
      return total;
    }, 0)
  };
}

/**
 * Validate shipping address for subscription
 * @param {object} address - Shipping address object
 * @returns {object} Validation result
 */
export function validateShippingAddress(address) {
  const errors = [];

  if (!address) {
    errors.push('Shipping address is required');
    return { isValid: false, errors };
  }

  const requiredFields = [
    { field: 'full_name', label: 'Full name' },
    { field: 'address_line1', label: 'Address line 1' },
    { field: 'city', label: 'City' },
    { field: 'postal_code', label: 'Postal code' },
    { field: 'country', label: 'Country' }
  ];

  for (const { field, label } of requiredFields) {
    if (!address[field] || address[field].trim() === '') {
      errors.push(`${label} is required`);
    }
  }

  // Validate postal code format (basic validation)
  if (address.postal_code && !/^[A-Z0-9\s\-]+$/i.test(address.postal_code)) {
    errors.push('Invalid postal code format');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Calculate trial period for subscription
 * @param {string} interval - Subscription interval
 * @returns {number} Trial period in days
 */
export function calculateTrialPeriod(interval) {
  switch (interval.toUpperCase()) {
    case 'WEEKLY':
      return 7; // 1 week trial
    case 'BIWEEKLY':
      return 14; // 2 weeks trial
    case 'MONTHLY':
      return 30; // 1 month trial
    default:
      return 7;
  }
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: GBP)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Get subscription frequency description
 * @param {string} interval - Subscription interval
 * @returns {string} Human-readable frequency
 */
export function getSubscriptionFrequency(interval) {
  switch (interval.toUpperCase()) {
    case 'WEEKLY':
      return 'every week';
    case 'BIWEEKLY':
      return 'every 2 weeks';
    case 'MONTHLY':
      return 'every month';
    default:
      return `every ${interval.toLowerCase()}`;
  }
}

/**
 * Calculate days until next delivery
 * @param {string} nextOrderDate - Next order date (YYYY-MM-DD)
 * @returns {number} Days until next delivery
 */
export function getDaysUntilNextDelivery(nextOrderDate) {
  const today = new Date();
  const nextDelivery = new Date(nextOrderDate);
  const diffTime = nextDelivery - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if subscription needs attention
 * @param {object} subscription - Subscription object
 * @returns {object} Attention flags
 */
export function checkSubscriptionAttention(subscription) {
  const attention = {
    needsAttention: false,
    reasons: []
  };

  // Check if next delivery is due soon
  if (subscription.next_order_date) {
    const daysUntil = getDaysUntilNextDelivery(subscription.next_order_date);
    if (daysUntil <= 3 && daysUntil >= 0) {
      attention.needsAttention = true;
      attention.reasons.push('Next delivery due soon');
    }
  }

  // Check if subscription is paused and hasn't been updated recently
  if (subscription.status === 'PAUSED') {
    const lastUpdated = new Date(subscription.updated_at);
    const daysSinceUpdate = Math.floor((new Date() - lastUpdated) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 30) {
      attention.needsAttention = true;
      attention.reasons.push('Paused for over 30 days');
    }
  }

  // Check if product is out of stock
  if (subscription.product && subscription.product.inventory_quantity === 0) {
    attention.needsAttention = true;
    attention.reasons.push('Product out of stock');
  }

  return attention;
}

/**
 * Generate subscription schedule preview
 * @param {object} plan - Subscription plan
 * @param {Date} startDate - Start date (default: today)
 * @param {number} numberOfDeliveries - Number of deliveries to preview
 * @returns {Array} Array of delivery dates
 */
export function generateSubscriptionSchedule(plan, startDate = new Date(), numberOfDeliveries = 6) {
  const schedule = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < numberOfDeliveries; i++) {
    schedule.push({
      deliveryNumber: i + 1,
      date: new Date(currentDate),
      formattedDate: currentDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    });

    // Calculate next delivery date
    switch (plan.interval.toUpperCase()) {
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'BIWEEKLY':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return schedule;
}