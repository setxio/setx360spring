'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  store: string;
  storeId: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  store: string;
  storeId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  moveToCart: (productId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, info } = useToast();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('setx_cart');
      const savedWishlist = localStorage.getItem('setx_wishlist');
      
      if (savedCart) setCartItems(JSON.parse(savedCart));
      if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
    } catch (e) {
      console.error('Error loading cart/wishlist from localStorage:', e);
    }
  }, []);

  // Sync cartItems to localStorage
  const updateCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('setx_cart', JSON.stringify(items));
  };

  // Sync wishlistItems to localStorage
  const updateWishlist = (items: WishlistItem[]) => {
    setWishlistItems(items);
    localStorage.setItem('setx_wishlist', JSON.stringify(items));
  };

  // Helper to extract fields from generic product structure
  const parseProduct = (product: any) => {
    const id = product.id || '';
    const name = product.name || 'Unknown Product';
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    
    // Support image_urls array, image_url, or single image field
    let image = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500';
    if (product.image_urls && product.image_urls.length > 0) {
      image = product.image_urls[0];
    } else if (product.image_url) {
      image = product.image_url;
    } else if (product.image) {
      image = product.image;
    }

    const store = product.store_name || product.stores?.name || product.store || 'Local Merchant';
    const storeId = product.store_id || product.stores?.id || product.storeId || 'unknown-merchant';

    return { id, name, price, image, store, storeId };
  };

  const addToCart = (product: any, quantity = 1) => {
    const parsed = parseProduct(product);
    if (!parsed.id) return;

    const existingIndex = cartItems.findIndex(item => item.id === parsed.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      updateCart(updated);
    } else {
      updateCart([...cartItems, { ...parsed, quantity }]);
    }
    success(`Added ${parsed.name} to your cart.`);
  };

  const removeFromCart = (productId: string) => {
    const item = cartItems.find(item => item.id === productId);
    const updated = cartItems.filter(item => item.id !== productId);
    updateCart(updated);
    if (item) {
      info(`Removed ${item.name} from your cart.`);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cartItems.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    updateCart(updated);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const addToWishlist = (product: any) => {
    const parsed = parseProduct(product);
    if (!parsed.id) return;

    const exists = wishlistItems.some(item => item.id === parsed.id);
    if (exists) {
      info(`${parsed.name} is already in your wishlist.`);
      return;
    }

    updateWishlist([...wishlistItems, {
      id: parsed.id,
      name: parsed.name,
      price: parsed.price,
      image: parsed.image,
      store: parsed.store,
      storeId: parsed.storeId
    }]);
    success(`Added ${parsed.name} to your wishlist.`);
  };

  const removeFromWishlist = (productId: string) => {
    const item = wishlistItems.find(item => item.id === productId);
    const updated = wishlistItems.filter(item => item.id !== productId);
    updateWishlist(updated);
    if (item) {
      info(`Removed ${item.name} from your wishlist.`);
    }
  };

  const moveToCart = (productId: string) => {
    const item = wishlistItems.find(item => item.id === productId);
    if (!item) return;

    // Remove from wishlist
    const updatedWishlist = wishlistItems.filter(w => w.id !== productId);
    updateWishlist(updatedWishlist);

    // Add to cart
    addToCart(item, 1);
  };

  // Derive cart totals
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      wishlistItems,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      moveToCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
