import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { 
  CartContextType, 
  Cart, 
  CartItem, 
  MenuItem 
} from '../types';

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: MenuItem; quantity: number; observations?: string } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart };

const initialCart: Cart = {
  items: [],
  total: 0,
  itemCount: 0,
};

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity, observations } = action.payload;
      const existingItemIndex = state.items.findIndex(
        (cartItem) => cartItem.menuItem.id === item.id
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((cartItem, index) => {
          if (index === existingItemIndex) {
            return {
              ...cartItem,
              quantity: cartItem.quantity + quantity,
              observations: observations || cartItem.observations,
            };
          }
          return cartItem;
        });
      } else {
        // Add new item
        newItems = [
          ...state.items,
          {
            menuItem: item,
            quantity,
            observations,
          },
        ];
      }

      const total = newItems.reduce(
        (sum, cartItem) => sum + cartItem.menuItem.price * cartItem.quantity,
        0
      );
      const itemCount = newItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        (cartItem) => cartItem.menuItem.id !== action.payload
      );
      const total = newItems.reduce(
        (sum, cartItem) => sum + cartItem.menuItem.price * cartItem.quantity,
        0
      );
      const itemCount = newItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: itemId });
      }

      const newItems = state.items.map((cartItem) => {
        if (cartItem.menuItem.id === itemId) {
          return { ...cartItem, quantity };
        }
        return cartItem;
      });

      const total = newItems.reduce(
        (sum, cartItem) => sum + cartItem.menuItem.price * cartItem.quantity,
        0
      );
      const itemCount = newItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'CLEAR_CART':
      return initialCart;

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error parsing stored cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: MenuItem, quantity = 1, observations?: string) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { item, quantity, observations },
    });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (itemId: string): number => {
    const item = cart.items.find((cartItem) => cartItem.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
