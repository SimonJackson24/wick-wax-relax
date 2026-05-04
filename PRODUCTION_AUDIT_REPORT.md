# Production Audit Report: Wick Wax & Relax E-commerce PWA

**Audit Date:** 2026-04-23
**Application:** Wick Wax & Relax E-commerce Platform
**Stack:** Next.js 14 (Frontend), Express.js (Backend), PostgreSQL, Redis

---

## Executive Summary

The application is a well-structured e-commerce PWA with comprehensive features including product management, order processing, subscriptions, and multi-channel integration (Amazon, Etsy). However, there are several **critical issues** and **missing implementations** that must be addressed before production deployment.

---

## Critical Issues (Must Fix Before Production)

### 1. **WISHLIST/FEATURES NOT PERSISTED** 🔴 CRITICAL
**Location:** Frontend (ProductCard.js), No Backend Endpoint

The favorite/wishlist functionality in `ProductCard.js` uses local `useState` only:
```javascript
const [isFavorite, setIsFavorite] = useState(false);
```

**Impact:** Favorites are lost on page refresh, not synced across devices, not saved to database.

**Fix Required:**
- Create `wishlists` table in database
- Create backend `/api/wishlist` routes (GET, POST, DELETE)
- Connect frontend wishlist to backend API
- Add wishlist context or service layer

---

### 2. **HARDCODED JWT SECRET FALLBACKS** 🔴 CRITICAL
**Location:** Multiple route files

```javascript
jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', ...)
```

**Impact:** If environment variables are misconfigured, authentication falls back to known default keys.

**Fix Required:** Fail fast on startup if JWT_SECRET is not configured.

---

### 3. **NO DATABASE MIGRATIONS FOR USER_IMMUTABLE** 🟠 HIGH
**Issue:** The orders table references `user_id` but migration 001_initial_schema.sql does not include this column. The order creation in `orderService.createOrder()` doesn't include `user_id`.

**Impact:** Orders may not be properly linked to users for order history and analytics.

---

### 4. **CART STATE ONLY IN LOCALSTORAGE** 🟠 HIGH
**Location:** CartContext.js

The cart is stored in localStorage but not synced to the backend.

**Impact:** Users lose cart on device change/browser clear.

---

## Security Issues

### 5. **WEAK RATE LIMITING ON AUTH** 🟡 MEDIUM
**Location:** auth.js

The auth rate limit is 5 attempts per 15 minutes.

---

### 6. **NO INPUT LENGTH LIMITS ON SEARCH** 🟡 MEDIUM
**Location:** search.js

The search service should enforce input limits.

---

### 7. **CORS ORIGIN WHITELISTING** 🟡 MEDIUM
**Location:** server.js

**Fix Required:** Replace placeholder domains with actual production domain.

---

### 8. **NO ADMIN PASSWORD CHANGE ENFORCEMENT** 🟡 MEDIUM
**Issue:** Default admin credentials exist (`admin@wickwaxrelax.co.uk` / `admin123`)

---

## Missing Functionality

### 9. **NO WISHLIST ENDPOINTS** 🔴
No backend routes for wishlist management.

### 10. **NO REVIEWS/RATINGS ENDPOINTS** 🟠
No endpoints for product reviews/ratings.

### 11. **NO NEWSLETTER ENDPOINTS** 🟠
Newsletter component exists but no backend.

---

## Well-Implemented Features ✅

### Authentication & Security ✅
- JWT with access/refresh token rotation
- httpOnly cookies for tokens
- bcrypt password hashing (12 rounds)
- Rate limiting on auth endpoints
- Input validation with express-validator
- XSS sanitization middleware
- Helmet.js security headers
- GDPR consent tracking

### API Endpoints ✅
| Endpoint Area | Status |
|--------------|--------|
| Auth (register, login, logout, refresh, reset) | ✅ Complete |
| Products (CRUD, categories, search) | ✅ Complete |
| Orders (create, status, tracking) | ✅ Complete |
| Users (profile, addresses) | ✅ Complete |
| Admin (dashboard, analytics, management) | ✅ Complete |
| Subscriptions | ✅ Complete |
| GDPR | ✅ Complete |
| Webhooks (Revolut) | ✅ Complete |

### Database Schema ✅
- Proper foreign key relationships
- UUID primary keys
- Audit logging tables
- GDPR consent tracking
- Performance indexes

---

## Recommendations by Priority

### P0 - Must Fix Before Production
1. Implement wishlist backend and connect to UI
2. Fix JWT secret fallback - fail if not configured
3. Add user_id to orders table
4. Update CORS whitelist with real domain
5. Force password change on default admin

### P1 - Should Fix Before Production
6. Implement server-side cart persistence
7. Add product reviews/ratings endpoints
8. Implement newsletter subscription backend
9. Increase auth rate limit security

---

## Deployment Checklist

- [ ] Set production JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Configure FRONTEND_URL with real domain
- [ ] Update CORS allowedOrigins with production URL
- [ ] Change default admin password
- [ ] Configure SMTP settings for emails
- [ ] Set up Redis Cloud connection
- [ ] Configure Sentry DSN for error tracking
- [ ] Run database migrations
- [ ] Verify SSL certificates
- [ ] Test payment flow with Revolut sandbox
- [ ] Verify PWA installation works
- [ ] Test offline cart functionality
- [ ] Validate all forms with accessibility tools
