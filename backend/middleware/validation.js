const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// General validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Check if error is authentication-related
    const authError = errors.array().find(e => e.location === 'headers' && e.param === 'authorization');
    return res.status(authError ? 401 : 400).json({
      error: authError ? 'Authentication failed' : 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Rate limiting for sensitive operations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Auth validation rules
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .exists()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Product validation rules
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('scent_profile')
    .isObject()
    .withMessage('Scent profile must be a valid object'),
  body('base_price')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  handleValidationErrors
];

const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('scent_profile')
    .optional()
    .isObject()
    .withMessage('Scent profile must be a valid object'),
  body('base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  handleValidationErrors
];

// Order validation rules
const validateOrderCreation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product_id')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shipping_address')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shipping_address.full_name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Full name is required'),
  body('shipping_address.address_line1')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Address line 1 is required'),
  body('shipping_address.city')
    .trim()
    .isLength({ min: 1 })
    .withMessage('City is required'),
  body('shipping_address.postal_code')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Postal code is required'),
  body('shipping_address.country')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Country is required'),
  handleValidationErrors
];

// User profile validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

// Parameter validation
const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validateProductIdParam = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        // Robust XSS sanitization using multiple techniques
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/<\?[\s\S]*?\?>/g, '') // Remove PHP tags
          .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
          .replace(/&/g, '&')
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/"/g, '"')
          .replace(/'/g, '&#x27;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Rate limiters
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later');
const generalRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests, please try again later');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 1000, 'API rate limit exceeded');

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProductCreation,
  validateProductUpdate,
  validateOrderCreation,
  validateProfileUpdate,
  validateIdParam,
  validateProductIdParam,
  validatePagination,
  sanitizeInput,
  authRateLimit,
  generalRateLimit,
  apiRateLimit
};