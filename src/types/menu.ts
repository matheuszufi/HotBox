export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  quantityType: 'g' | 'un'; // gramas ou unidade
  quantity: number; // quantidade em gramas ou unidades
  ingredients?: string[];
  allergens?: string[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  observations?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartContextType {
  cart: Cart;
  addItem: (item: MenuItem, quantity?: number, observations?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
}
