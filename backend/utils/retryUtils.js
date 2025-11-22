class RetryUtils {
  // Retry a function with exponential backoff
  static async withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = (error) => true
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry if this is the last attempt or condition not met
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  // Simple delay utility
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if error is retryable
  static isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED') {
      return true;
    }

    // Retry on 5xx server errors
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Retry on rate limiting (429)
    if (error.response && error.response.status === 429) {
      return true;
    }

    return false;
  }

  // Circuit breaker pattern
  static createCircuitBreaker(fn, options = {}) {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000,
      monitoringPeriod = 10000
    } = options;

    let failures = 0;
    let lastFailureTime = 0;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      const now = Date.now();

      // Check if circuit should transition from OPEN to HALF_OPEN
      if (state === 'OPEN' && now - lastFailureTime > recoveryTimeout) {
        state = 'HALF_OPEN';
      }

      // If circuit is OPEN, fail fast
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }

      try {
        const result = await fn(...args);

        // Success - reset failure count and close circuit
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        // Check if we should open the circuit
        if (failures >= failureThreshold) {
          state = 'OPEN';
          console.log('Circuit breaker opened due to repeated failures');
        }

        throw error;
      }
    };
  }
}

module.exports = RetryUtils;