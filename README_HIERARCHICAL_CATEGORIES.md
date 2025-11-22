# Hierarchical Categories Implementation Guide

This guide provides step-by-step instructions for implementing the new hierarchical category structure for Wick Wax Relax scented melts.

## Overview

The new hierarchical category system replaces the flat single-level categorization with a multi-level hierarchy that properly organizes products through parent categories and subcategories.

## Prerequisites

- Node.js and npm installed
- Access to the PostgreSQL database
- Admin access to the Wick Wax Relax application

## Implementation Steps

### Step 1: Database Migration

1. Navigate to the project root directory
2. Run the database migration script:
   ```bash
   psql -d your_database_name -f migrations/012_hierarchical_categories.sql
   ```
3. Verify that the new tables have been created:
   - `category_hierarchy`
   - `category_mapping`
   - `product_category_hierarchy`

### Step 2: Backend Implementation

1. The backend services and routes have already been created:
   - `backend/services/hierarchicalCategories.js`
   - `backend/routes/categories.js`
2. Restart the backend server to load the new routes:
   ```bash
   cd backend
   npm start
   ```

### Step 3: Frontend Implementation

1. Update the navigation component:
   - Replace `Navigation` with `NavigationWithCategories` in your layout
   - In `frontend/pages/_app.js` or your layout component, update the import:
     ```javascript
     import NavigationWithCategories from '../components/NavigationWithCategories';
     ```
   - Replace the Navigation component usage:
     ```javascript
     <NavigationWithCategories />
     ```

2. Update the products page:
   - Run the deployment script to automatically update the products page:
     ```bash
     cd frontend
     npm run deploy:categories
     ```
   - Or manually replace `frontend/pages/products.js` with `frontend/pages/products-new.js`

3. Restart the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

### Step 4: Admin Setup

1. Navigate to the admin dashboard: `http://localhost:3000/admin`
2. Click on "Categories" to access the hierarchical categories management
3. Click "Migrate Existing Categories" to migrate your current categories to the new hierarchy
4. Review and adjust the category structure as needed

### Step 5: Testing

1. Test the navigation dropdown to ensure categories display correctly
2. Navigate to category pages (e.g., `http://localhost:3000/category/floral`)
3. Test the filtering on the products page with the new hierarchical categories
4. Verify that products appear in the correct categories

## New Category Structure

The new hierarchy consists of three main parent categories:

### 1. Seasons
- **Spring**: Fresh and floral scents that capture the renewal of springtime
- **Summer**: Bright and breezy scents that evoke warm summer days
- **Autumn**: Warm and spicy scents that reflect the cozy atmosphere of autumn
- **Winter**: Comforting and rich scents that bring warmth to cold winter days

### 2. Collections
- **Limited Edition**: Exclusive seasonal and special edition scented melts
- **Best Sellers**: Our most popular scented melts that customers love
- **Signature Series**: Our premium collection of carefully crafted signature scents

### 3. Aroma Profiles
- **Floral**: Delicate and romantic floral scents (rose, jasmine, lavender)
- **Fruity**: Sweet and juicy fruit scents that brighten any space
- **Spicy**: Warm and exotic spice blends that add depth and comfort
- **Fresh**: Clean and invigorating scents that evoke freshness and clarity
- **Woody**: Earthy and grounding woody scents (sandalwood, cedar)

## Troubleshooting

### Categories Not Showing

1. Check that the database migration has been run successfully
2. Verify that categories are marked as active in the database
3. Check the browser console for JavaScript errors
4. Ensure the backend server is running and accessible

### Products Not Appearing in Categories

1. Verify that products have been properly associated with categories
2. Check the product-category relationships in the database
3. Run the migration tool to ensure existing products are associated with the new categories

### Navigation Not Working

1. Ensure the `NavigationWithCategories` component is being used
2. Check for errors in the browser console
3. Verify that the API endpoints are accessible

### Filters Not Applying

1. Check that the `HierarchicalSearchFilters` component is properly integrated
2. Verify the API requests are being made correctly
3. Check the browser's Network tab for API responses

## Rollback Instructions

If you need to rollback to the previous categorization system:

1. Restore the original products page:
   ```bash
   cd frontend/pages
   mv products.js products-hierarchical.js
   mv products.js.backup products.js
   ```
2. Restore the original navigation component
3. Revert the database migration (if needed)

## Future Enhancements

1. **Category Images**: Add support for category images and banners
2. **Featured Products**: Highlight featured products in category pages
3. **Category Descriptions**: Add rich text descriptions for categories
4. **Advanced Filtering**: Add more filtering options based on category attributes
5. **Analytics**: Track category performance and user navigation patterns

## Support

If you encounter any issues during implementation:

1. Check the implementation documentation: `HIERARCHICAL_CATEGORIES_IMPLEMENTATION.md`
2. Review the deployment summary: `HIERARCHICAL_CATEGORIES_DEPLOYMENT_SUMMARY.md`
3. Check the browser console and server logs for errors
4. Refer to the troubleshooting section above

## Conclusion

The new hierarchical category system provides a much better organization for Wick Wax Relax products, improving both the user experience and the admin management capabilities. The implementation maintains backward compatibility while providing a clear path for future enhancements.