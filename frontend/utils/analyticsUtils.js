// Frontend analytics utility functions

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
  }).format(amount || 0);
}

/**
 * Format number with appropriate suffix (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {object} Change information
 */
export function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) {
    return {
      value: current || 0,
      percentage: 0,
      isPositive: (current || 0) >= 0,
      formatted: '0%'
    };
  }

  const change = current - previous;
  const percentage = ((change / previous) * 100);

  return {
    value: change,
    percentage: Math.abs(percentage),
    isPositive: change >= 0,
    formatted: `${change >= 0 ? '+' : '-'}${Math.abs(percentage).toFixed(1)}%`
  };
}

/**
 * Format date for charts
 * @param {string} dateString - Date string
 * @param {string} format - Format type
 * @returns {string} Formatted date
 */
export function formatChartDate(dateString, format = 'short') {
  const date = new Date(dateString);

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric'
      });
    case 'medium':
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });
    case 'long':
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    default:
      return date.toLocaleDateString('en-GB');
  }
}

/**
 * Generate color palette for charts
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color strings
 */
export function generateColorPalette(count) {
  const baseColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Generate additional colors if needed
  const colors = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.5) % 360; // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  return colors;
}

/**
 * Calculate trend direction
 * @param {Array} data - Array of data points
 * @param {string} key - Key to analyze
 * @returns {string} Trend direction ('up', 'down', 'stable')
 */
export function calculateTrend(data, key) {
  if (!data || data.length < 2) return 'stable';

  const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined);
  if (values.length < 2) return 'stable';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

/**
 * Aggregate data by time period
 * @param {Array} data - Array of data points
 * @param {string} period - Time period ('day', 'week', 'month')
 * @param {string} dateKey - Key containing date
 * @param {string} valueKey - Key containing value
 * @returns {Array} Aggregated data
 */
export function aggregateDataByPeriod(data, period, dateKey, valueKey) {
  const grouped = {};

  data.forEach(item => {
    const date = new Date(item[dateKey]);
    let groupKey;

    switch (period) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        groupKey = date.toISOString().split('T')[0];
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        [dateKey]: groupKey,
        [valueKey]: 0,
        count: 0
      };
    }

    grouped[groupKey][valueKey] += item[valueKey] || 0;
    grouped[groupKey].count += 1;
  });

  return Object.values(grouped).sort((a, b) => a[dateKey].localeCompare(b[dateKey]));
}

/**
 * Calculate moving average
 * @param {Array} data - Array of data points
 * @param {string} key - Key to calculate average for
 * @param {number} window - Window size for moving average
 * @returns {Array} Data with moving average
 */
export function calculateMovingAverage(data, key, window = 7) {
  return data.map((item, index) => {
    const start = Math.max(0, index - window + 1);
    const values = data.slice(start, index + 1).map(d => d[key] || 0);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      ...item,
      [`${key}_ma`]: average
    };
  });
}

/**
 * Find outliers in data
 * @param {Array} data - Array of data points
 * @param {string} key - Key to analyze
 * @param {number} threshold - Standard deviation threshold
 * @returns {Array} Outlier data points
 */
export function findOutliers(data, key, threshold = 2) {
  const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined);

  if (values.length === 0) return [];

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return data.filter(item => {
    const value = item[key];
    return value !== null && value !== undefined &&
           Math.abs(value - mean) > (threshold * stdDev);
  });
}

/**
 * Generate KPI summary
 * @param {object} data - Analytics data
 * @returns {Array} KPI objects
 */
export function generateKPISummary(data) {
  const kpis = [];

  if (data.userAnalytics?.overview) {
    const users = data.userAnalytics.overview;
    kpis.push(
      {
        title: 'Total Users',
        value: users.total_users || 0,
        format: 'number',
        trend: calculateTrend([], 'total_users'), // Would need historical data
        color: 'primary'
      },
      {
        title: 'Active Users (30d)',
        value: users.active_users_30d || 0,
        format: 'number',
        trend: 'up',
        color: 'success'
      },
      {
        title: 'New Users (30d)',
        value: users.new_users_30d || 0,
        format: 'number',
        trend: 'up',
        color: 'info'
      }
    );
  }

  if (data.salesAnalytics?.trends) {
    const sales = data.salesAnalytics.trends;
    const totalRevenue = sales.reduce((sum, day) => sum + (day.revenue || 0), 0);
    const totalOrders = sales.reduce((sum, day) => sum + (day.orders_count || 0), 0);

    kpis.push(
      {
        title: 'Total Revenue',
        value: totalRevenue,
        format: 'currency',
        trend: calculateTrend(sales, 'revenue'),
        color: 'success'
      },
      {
        title: 'Total Orders',
        value: totalOrders,
        format: 'number',
        trend: calculateTrend(sales, 'orders_count'),
        color: 'primary'
      },
      {
        title: 'Average Order Value',
        value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        format: 'currency',
        trend: 'stable',
        color: 'warning'
      }
    );
  }

  if (data.productAnalytics?.productPerformance) {
    const products = data.productAnalytics.productPerformance;
    const totalProducts = products.length;
    const lowStock = products.filter(p => (p.inventory_quantity || 0) <= 10).length;

    kpis.push(
      {
        title: 'Total Products',
        value: totalProducts,
        format: 'number',
        trend: 'stable',
        color: 'secondary'
      },
      {
        title: 'Low Stock Items',
        value: lowStock,
        format: 'number',
        trend: lowStock > totalProducts * 0.1 ? 'down' : 'stable',
        color: 'error'
      }
    );
  }

  return kpis;
}

/**
 * Format KPI value for display
 * @param {number} value - Value to format
 * @param {string} format - Format type
 * @returns {string} Formatted value
 */
export function formatKPIValue(value, format) {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'number':
      return formatNumber(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default:
      return value.toString();
  }
}

/**
 * Generate chart configuration
 * @param {string} type - Chart type
 * @param {Array} data - Chart data
 * @param {object} options - Chart options
 * @returns {object} Chart configuration
 */
export function generateChartConfig(type, data, options = {}) {
  const baseConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: options.xAxisLabel || 'Time'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: options.yAxisLabel || 'Value'
        }
      }
    }
  };

  switch (type) {
    case 'line':
      return {
        ...baseConfig,
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6,
          },
          line: {
            tension: 0.1,
          },
        },
      };

    case 'bar':
      return {
        ...baseConfig,
        scales: {
          ...baseConfig.scales,
          x: {
            ...baseConfig.scales.x,
            stacked: options.stacked || false,
          },
          y: {
            ...baseConfig.scales.y,
            stacked: options.stacked || false,
          },
        },
      };

    case 'pie':
    case 'doughnut':
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
              },
            },
          },
        },
      };

    default:
      return baseConfig;
  }
}

/**
 * Export data to CSV
 * @param {Array} data - Data to export
 * @param {Array} headers - Column headers
 * @param {string} filename - Export filename
 */
export function exportToCSV(data, headers, filename) {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Calculate growth rate
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @param {string} period - Time period
 * @returns {object} Growth rate information
 */
export function calculateGrowthRate(current, previous, period = 'month') {
  if (!previous || previous === 0) {
    return {
      rate: 0,
      isPositive: true,
      formatted: 'N/A'
    };
  }

  const rate = ((current - previous) / previous) * 100;
  const isPositive = rate >= 0;

  // Adjust for time period
  let annualizedRate = rate;
  switch (period) {
    case 'day':
      annualizedRate = rate * 365;
      break;
    case 'week':
      annualizedRate = rate * 52;
      break;
    case 'month':
      annualizedRate = rate * 12;
      break;
    case 'quarter':
      annualizedRate = rate * 4;
      break;
  }

  return {
    rate: Math.abs(rate),
    annualizedRate: Math.abs(annualizedRate),
    isPositive,
    formatted: `${isPositive ? '+' : '-'}${Math.abs(rate).toFixed(1)}%`,
    annualizedFormatted: `${isPositive ? '+' : '-'}${Math.abs(annualizedRate).toFixed(1)}%/year`
  };
}