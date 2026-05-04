import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load wishlist from API on mount (if authenticated)
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/wishlist', {
        params: { limit: 100 }
      });

      if (response.data?.items) {
        setWishlistItems(response.data.items);
        setWishlistProductIds(new Set(response.data.items.map(item => item.product_id)));
        setWishlistCount(response.data.items.length);
      }
    } catch (err) {
      // If 401 (not authenticated), silently ignore
      if (err.response?.status !== 401) {
        console.error('Error fetching wishlist:', err);
        setError('Failed to load wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = useCallback(async (productId, variantId = null) => {
    setError(null);
    try {
      const response = await axios.post('/api/wishlist', {
        productId,
        variantId
      });

      // Update local state optimistically
      setWishlistProductIds(prev => new Set([...prev, productId]));
      setWishlistCount(prev => prev + 1);

      // Refresh full wishlist to get product details
      await fetchWishlist();

      return { success: true, ...response.data };
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError('Failed to add item to wishlist');
      return { success: false, error: err.response?.data?.error || 'Failed to add item' };
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    setError(null);
    try {
      await axios.delete(`/api/wishlist/${productId}`);

      // Update local state optimistically
      setWishlistProductIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setWishlistCount(prev => Math.max(0, prev - 1));
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));

      return { success: true };
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError('Failed to remove item from wishlist');
      return { success: false, error: err.response?.data?.error || 'Failed to remove item' };
    }
  }, []);

  const toggleWishlist = useCallback(async (productId, variantId = null) => {
    if (wishlistProductIds.has(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId, variantId);
    }
  }, [wishlistProductIds, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlistProductIds.has(productId);
  }, [wishlistProductIds]);

  const clearWishlist = async () => {
    try {
      await axios.delete('/api/wishlist');
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      setWishlistCount(0);
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setError('Failed to clear wishlist');
    }
  };

  const refreshWishlist = () => {
    return fetchWishlist();
  };

  const value = {
    wishlistItems,
    wishlistProductIds,
    wishlistCount,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist,
    fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
