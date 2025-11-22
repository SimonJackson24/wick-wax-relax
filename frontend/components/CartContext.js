import { createContext, useContext, useState, useEffect } from 'react';
import { usePWA } from './PWAContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const { isOnline: pwaOnline } = usePWA();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem('cart');
      }
    }

    // Load offline queue
    const savedQueue = localStorage.getItem('cartOfflineQueue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Error parsing offline queue:', error);
        localStorage.removeItem('cartOfflineQueue');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save offline queue whenever it changes
  useEffect(() => {
    localStorage.setItem('cartOfflineQueue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Sync online status with PWA context
  useEffect(() => {
    setIsOnline(pwaOnline);
  }, [pwaOnline]);

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, [isOnline, offlineQueue]);

  const addToCart = (product, variant, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.variantId === variant.id && item.productId === product.id
      );

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.variantId === variant.id && item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, {
          id: `${product.id}-${variant.id}`,
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          quantity,
          image: product.image || null,
          attributes: variant.attributes || {}
        }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const processOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    console.log('Processing offline queue:', offlineQueue.length, 'items');

    for (const queueItem of offlineQueue) {
      try {
        // Process each queued operation
        switch (queueItem.type) {
          case 'add_to_cart':
            await addToCart(queueItem.product, queueItem.variant, queueItem.quantity);
            break;
          case 'update_quantity':
            await updateQuantity(queueItem.itemId, queueItem.quantity);
            break;
          case 'remove_from_cart':
            await removeFromCart(queueItem.itemId);
            break;
          default:
            console.warn('Unknown queue item type:', queueItem.type);
        }
      } catch (error) {
        console.error('Error processing offline queue item:', error);
        // Keep failed items in queue for retry
        continue;
      }
    }

    // Clear processed queue
    setOfflineQueue([]);
  };

  const addToOfflineQueue = (operation) => {
    const queueItem = {
      ...operation,
      timestamp: Date.now(),
      id: `queue_${Date.now()}_${Math.random()}`,
    };
    setOfflineQueue(prev => [...prev, queueItem]);
  };

  const value = {
    cartItems,
    offlineQueue,
    isOnline,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    processOfflineQueue,
    addToOfflineQueue,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};