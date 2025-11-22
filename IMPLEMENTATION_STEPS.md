# Hierarchical Categories Implementation Steps

This guide provides step-by-step instructions to complete the implementation of the new hierarchical category structure for Wick Wax Relax.

## Step 1: Database Migration

Run the database migration script to set up the new hierarchical category structure:

### For Linux/macOS:
```bash
chmod +x migrate-database.sh
./migrate-database.sh
```

### For Windows:
```cmd
migrate-database.bat
```

### Manual Migration:
If the scripts don't work, you can run the migration manually:
```bash
psql -d your_database_name -f migrations/012_hierarchical_categories.sql
```

## Step 2: Restart Backend Server

After the database migration, restart the backend server to load the new routes and services:

```bash
cd backend
npm start
```

## Step 3: Restart Frontend Development Server

Restart the frontend development server to load the updated components:

```bash
cd frontend
npm run dev
```

## Step 4: Access Admin Interface

1. Navigate to the admin dashboard: `http://localhost:3000/admin`
2. Click on "Categories" to access the hierarchical categories management
3. Click "Migrate Existing Categories" to migrate your current categories to the new hierarchy
4. Review and adjust the category structure as needed

## Step 5: Test the Implementation

1. Test the navigation dropdown to ensure categories display correctly
2. Navigate to category pages (e.g., `http://localhost:3000/category/floral`)
3. Test the filtering on the products page with the new hierarchical categories
4. Verify that products appear in the correct categories

## Step 6: Verify All Components

Check that the following components are working correctly:

1. **Navigation**: The dropdown menu should show the hierarchical categories
2. **Category Pages**: Each category page should display products in that category
3. **Product Filtering**: The filters sidebar should allow selection of hierarchical categories
4. **Admin Interface**: The admin interface should allow management of categories

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

## Files Created/Modified

### Database:
- `migrations/012_hierarchical_categories.sql` (new)

### Backend:
- `backend/services/hierarchicalCategories.js` (new)
- `backend/routes/categories.js` (modified)

### Frontend:
- `frontend/components/HierarchicalCategories.js` (new)
- `frontend/components/HierarchicalSearchFilters.js` (new)
- `frontend/components/NavigationWithCategories.js` (new)
- `frontend/pages/category/[slug].js` (new)
- `frontend/pages/admin/hierarchical-categories.js` (new)
- `frontend/pages/products.js` (modified)
- `frontend/pages/index.js` (modified)

### Documentation:
- `HIERARCHICAL_CATEGORIES_IMPLEMENTATION.md` (new)
- `README_HIERARCHICAL_CATEGORIES.md` (new)

### Scripts:
- `scripts/deploy-hierarchical-categories.js` (new)
- `migrate-database.sh` (new)
- `migrate-database.bat` (new)

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

## Support

If you encounter any issues during implementation:

1. Check the implementation documentation: `HIERARCHICAL_CATEGORIES_IMPLEMENTATION.md`
2. Review the deployment summary: `HIERARCHICAL_CATEGORIES_DEPLOYMENT_SUMMARY.md`
3. Check the browser console and server logs for errors
4. Refer to the troubleshooting section above

## Conclusion

The new hierarchical category system provides a much better organization for Wick Wax Relax products, improving both the user experience and the admin management capabilities. The implementation maintains backward compatibility while providing a clear path for future enhancements.