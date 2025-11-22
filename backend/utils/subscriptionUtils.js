// Subscription utility functions

const { query } = require('../config/database');

/**
 * Calculate subscription savings over time
 * @param {number} price - Product price
 * @param {number} discountPercentage - Subscription discount percentage
 * @param {string} interval - Subscription interval (WEEKLY, BIWEEKLY, MONTHLY)
 * @param {number} months - Number of months to calculate for
 * @returns {object} Savings calculation
 */
function calculateSubscriptionSavings(price, discountPercentage, interval, months = 12) {
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
 * Validate subscription data
 * @param {object} subscriptionData - Subscription data to validate
 * @returns {object} Validation result
 */
function validateSubscriptionData(subscriptionData) {
  const errors = [];
  const { planId, productId, variantId, shippingAddress } = subscriptionData;

  if (!planId) {
    errors.push('Subscription plan ID is required');
  }

  if (!productId) {
    errors.push('Product ID is required');
  }

  if (!variantId) {
    errors.push('Product variant ID is required');
  }

  if (shippingAddress) {
    const requiredFields = ['full_name', 'address_line1', 'city', 'postal_code', 'country'];
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        errors.push(`Shipping address ${field.replace('_', ' ')} is required`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Calculate next billing date
 * @param {string} interval - Subscription interval
 * @param {Date} fromDate - Date to calculate from (default: today)
 * @returns {Date} Next billing date
 */
function calculateNextBillingDate(interval, fromDate = new Date()) {
  const nextDate = new Date(fromDate);

  switch (interval.toUpperCase()) {
    case 'WEEKLY':
      nextDate.setDate(fromDate.getDate() + 7);
      break;
    case 'BIWEEKLY':
      nextDate.setDate(fromDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(fromDate.getMonth() + 1);
      break;
    default:
      nextDate.setDate(fromDate.getDate() + 7); // Default to weekly
  }

  return nextDate;
}

/**
 * Format subscription interval for display
 * @param {string} interval - Subscription interval
 * @returns {string} Formatted interval
 */
function formatSubscriptionInterval(interval) {
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
function getSubscriptionStatusColor(status) {
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
function isSubscriptionDue(nextOrderDate, daysAhead = 3) {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + daysAhead);

  const nextOrder = new Date(nextOrderDate);

  return nextOrder <= dueDate;
}

/**
 * Calculate subscription metrics
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {object} Subscription metrics
 */
function calculateSubscriptionMetrics(subscriptions) {
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
 * Generate subscription summary for user
 * @param {Array} subscriptions - User's subscriptions
 * @returns {object} Subscription summary
 */
function generateSubscriptionSummary(subscriptions) {
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
function validateShippingAddress(address) {
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
 * Calculate subscription trial period
 * @param {string} interval - Subscription interval
 * @returns {number} Trial period in days
 */
function calculateTrialPeriod(interval) {
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
 * Check if subscription can be upgraded/downgraded
 * @param {object} currentPlan - Current subscription plan
 * @param {object} newPlan - New subscription plan
 * @returns {object} Upgrade/downgrade information
 */
function checkPlanChange(currentPlan, newPlan) {
  const currentDiscount = currentPlan.discount_percentage;
  const newDiscount = newPlan.discount_percentage;

  const isUpgrade = newDiscount > currentDiscount;
  const isDowngrade = newDiscount < currentDiscount;
  const isSame = newDiscount === currentDiscount;

  let priceDifference = 0;
  if (currentPlan.interval === newPlan.interval) {
    // Same interval, compare discounts
    priceDifference = newDiscount - currentDiscount;
  } else {
    // Different intervals - would need more complex calculation
    // For now, just compare discounts
    priceDifference = newDiscount - currentDiscount;
  }

  return {
    canChange: true,
    isUpgrade: isUpgrade,
    isDowngrade: isDowngrade,
    isSame: isSame,
    priceDifference: priceDifference,
    requiresProration: currentPlan.interval !== newPlan.interval,
    effectiveDate: 'immediate' // Could be 'next_billing_cycle'
  };
}

/**
 * Generate subscription invoice preview
 * @param {object} subscription - Subscription object
 * @param {Date} billingDate - Billing date
 * @returns {object} Invoice preview
 */
function generateSubscriptionInvoicePreview(subscription, billingDate = new Date()) {
  const { product, plan } = subscription;

  if (!product || !plan) {
    throw new Error('Invalid subscription data');
  }

  const originalPrice = product.price;
  const discountAmount = (originalPrice * plan.discount_percentage) / 100;
  const discountedPrice = originalPrice - discountAmount;

  const invoice = {
    subscriptionId: subscription.id,
    billingDate: billingDate.toISOString().split('T')[0],
    dueDate: billingDate.toISOString().split('T')[0], // Same day for subscriptions
    items: [
      {
        description: `${product.name} (${product.variant_name}) - ${formatSubscriptionInterval(plan.interval)} subscription`,
        quantity: 1,
        unitPrice: originalPrice,
        discount: discountAmount,
        total: discountedPrice
      }
    ],
    subtotal: originalPrice,
    discountTotal: discountAmount,
    tax: 0, // Could be calculated based on location
    total: discountedPrice,
    currency: 'GBP',
    plan: {
      name: plan.name,
      interval: plan.interval,
      discountPercentage: plan.discount_percentage
    },
    product: {
      name: product.name,
      variant: product.variant_name,
      sku: product.sku
    }
  };

  return invoice;
}

module.exports = {
  calculateSubscriptionSavings,
  validateSubscriptionData,
  calculateNextBillingDate,
  formatSubscriptionInterval,
  getSubscriptionStatusColor,
  isSubscriptionDue,
  calculateSubscriptionMetrics,
  generateSubscriptionSummary,
  validateShippingAddress,
  calculateTrialPeriod,
  checkPlanChange,
  generateSubscriptionInvoicePreview
};