import { createContext, useContext, useState, useEffect } from 'react';
import { usePWA } from './PWAContext';
import axios from 'axios';

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
  const [promoCode, setPromoCode] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [savedForLater, setSavedForLater] = useState([]);
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

    const savedQueue = localStorage.getItem('cartOfflineQueue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Error parsing offline queue:', error);
        localStorage.removeItem('cartOfflineQueue');
      }
    }

    const savedLater = localStorage.getItem('savedForLater');
    if (savedLater) {
      try {
        setSavedForLater(JSON.parse(savedLater));
      } catch (error) {
        console.error('Error parsing saved for later:', error);
        localStorage.removeItem('savedForLater');
      }
    }

    const savedPromo = localStorage.getItem('appliedPromo');
    if (savedPromo) {
      try {
        setPromoCode(JSON.parse(savedPromo));
      } catch (error) {
        localStorage.removeItem('appliedPromo');
      }
    }
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cart-updated'));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('cartOfflineQueue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
  }, [savedForLater]);

  useEffect(() => {
    if (promoCode) {
      localStorage.setItem('appliedPromo', JSON.stringify(promoCode));
    } else {
      localStorage.removeItem('appliedPromo');
    }
  }, [promoCode]);

  useEffect(() => {
    setIsOnline(pwaOnline);
  }, [pwaOnline]);

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
        return prevItems.map(item =>
          item.variantId === variant.id && item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
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
    setPromoCode(null);
    setPromoError('');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getDiscountAmount = () => {
    if (!promoCode) return 0;
    const subtotal = getCartTotal();
    if (promoCode.discount_type === 'percentage') {
      return subtotal * (promoCode.discount_value / 100);
    }
    return Math.min(promoCode.discount_value, subtotal);
  };

  const applyPromoCode = async (code) => {
    try {
      const response = await axios.post('/api/promo/validate', {
        code,
        subtotal: getCartTotal()
      });
      if (response.data.valid) {
        setPromoCode({
          code: response.data.code,
          discount_type: response.data.discount_type,
          discount_value: parseFloat(response.data.discount_value)
        });
        setPromoError('');
        return { success: true, message: response.data.message };
      } else {
        setPromoError(response.data.message || 'Invalid promo code');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to validate promo code';
      setPromoError(msg);
      return { success: false, error: msg };
    }
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setPromoError('');
  };

  const saveForLater = (item) => {
    setSavedForLater(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
    removeFromCart(item.id);
  };

  const moveToCart = (savedItem) => {
    addToCart(
      { id: savedItem.productId, name: savedItem.productName, image: savedItem.image },
      { id: savedItem.variantId, name: savedItem.variantName, price: savedItem.price, attributes: savedItem.attributes || {} },
      savedItem.quantity
    );
    setSavedForLater(prev => prev.filter(i => i.id !== savedItem.id));
  };

  const removeSavedForLater = (itemId) => {
    setSavedForLater(prev => prev.filter(i => i.id !== itemId));
  };

  const processOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    console.log('Processing offline queue:', offlineQueue.length, 'items');
    for (const queueItem of offlineQueue) {
      try {
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
        continue;
      }
    }
    setOfflineQueue([]);
  };

  const addToOfflineQueue = (operation) => {
    const queueItem = {
      ...operation,
      timestamp: Date.now(),
      id: `queue_${Date.now()}_${Math.random()}`
    };
    setOfflineQueue(prev => [...prev, queueItem]);
  };

  const value = {
    cartItems,
    offlineQueue,
    isOnline,
    promoCode,
    promoError,
    savedForLater,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getDiscountAmount,
    applyPromoCode,
    removePromoCode,
    saveForLater,
    moveToCart,
    removeSavedForLater,
    processOfflineQueue,
    addToOfflineQueue,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
