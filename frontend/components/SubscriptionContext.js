import { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionItems, setSubscriptionItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('subscriptionBasket');
    if (saved) {
      try {
        setSubscriptionItems(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('subscriptionBasket');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('subscriptionBasket', JSON.stringify(subscriptionItems));
    window.dispatchEvent(new Event('subscription-updated'));
  }, [subscriptionItems]);

  const addToSubscription = (product, variant, quantity = 1) => {
    setSubscriptionItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.variantId === variant.id && item.productId === product.id
      );
      if (existingItem) {
        return prevItems.map(item =>
          item.variantId === variant.id && item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
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
    });
  };

  const removeFromSubscription = (itemId) => {
    setSubscriptionItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) { removeFromSubscription(itemId); return; }
    setSubscriptionItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, quantity } : item)
    );
  };

  const clearSubscription = () => setSubscriptionItems([]);

  const getSubscriptionTotal = () =>
    subscriptionItems.reduce((t, item) => t + item.price * item.quantity, 0);

  const getSubscriptionItemCount = () =>
    subscriptionItems.reduce((t, item) => t + item.quantity, 0);

  return (
    <SubscriptionContext.Provider value={{
      subscriptionItems, addToSubscription, removeFromSubscription,
      updateQuantity, clearSubscription, getSubscriptionTotal,
      getSubscriptionItemCount,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
