# Wick Wax & Relax Deployment Fix Plan

This plan outlines the necessary steps to resolve the build errors and successfully deploy the application.

- [ ] **Step 1: Correct Material-UI Imports**
  - Update `frontend/components/HierarchicalSearchFilters.js` to import `TreeView` and `TreeItem` from `@mui/lab` instead of `@mui/material`.
  - Install `@mui/lab` as a dependency.

- [ ] **Step 2: Ensure SSR Compatibility**
  - Create a new `DynamicHierarchicalSearchFilters.js` component that dynamically imports `HierarchicalSearchFilters.js` with SSR disabled.
  - Update `frontend/pages/products.js` to use the new dynamic component.