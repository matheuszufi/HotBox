import { useState } from 'react';
import { Plus, Minus, Package, Search } from 'lucide-react';
import { useCart } from '../contexts';
import { Button, Card, CardContent, Input, CartSidebar } from '../components';
import { menuCategories, getItemsByCategory } from '../data/menu';
import type { MenuItem } from '../types';

export function MyOrdersPage() {
  const { addItem, getItemQuantity, updateQuantity, removeItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('graos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar itens baseado na categoria selecionada e termo de busca
  const filteredItems = getItemsByCategory(selectedCategory).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (item: MenuItem) => {
    addItem(item, 1);
  };

  const handleQuantityChange = (item: MenuItem, change: number) => {
    const currentQuantity = getItemQuantity(item.id);
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Menu Section - Left Side */}
      <div className="flex-1 p-6 lg:pr-3">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cardápio</h1>
            <p className="text-gray-600">Escolha seus pratos favoritos e monte seu pedido</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar pratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2">
            {menuCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map(item => {
              const quantity = getItemQuantity(item.id);
              
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Item Image */}
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback para ícone se a imagem não carregar
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.className = 'h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center';
                            parent.innerHTML = `<div class="text-6xl">${menuCategories.find(cat => cat.id === item.category)?.icon || '🍽️'}</div>`;
                          }
                        }}
                      />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                        <span className="text-lg font-bold text-primary-600">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <Package className="h-4 w-4 mr-1" />
                          <span>{item.quantity}{item.quantityType === 'g' ? 'g' : ' un'}</span>
                        </div>
                        
                        {!item.available && (
                          <span className="text-red-500 text-sm font-medium">
                            Indisponível
                          </span>
                        )}
                      </div>
                      
                      {/* Add to Cart / Quantity Controls */}
                      {quantity === 0 ? (
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.available}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="mx-3 font-semibold text-lg">
                            {quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Ingredients */}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            <strong>Ingredientes:</strong> {item.ingredients.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum prato encontrado
              </h3>
              <p className="text-gray-600">
                Tente buscar por outro termo ou categoria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section - Right Side (Fixed) */}
      <CartSidebar className="cart-sidebar" />
    </div>
  );
}
