import { ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import { useCart } from '../../contexts';
import { Button } from '../ui';

interface CartSidebarProps {
  className?: string;
}

export function CartSidebar({ className = '' }: CartSidebarProps) {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, change: number) => {
    const currentItem = cart.items.find(item => item.menuItem.id === itemId);
    if (!currentItem) return;
    
    const newQuantity = currentItem.quantity + change;
    
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCart();
    }
  };

  const handleFinishOrder = () => {
    // TODO: Implement order submission
    alert('Funcionalidade em desenvolvimento! Em breve você poderá finalizar seu pedido.');
  };

  return (
    <div className={`w-full lg:w-80 bg-white shadow-xl border-l border-gray-200 ${className}`}>
      <div className="lg:sticky lg:top-0 h-auto lg:h-screen overflow-y-auto">
        <div className="p-6">
          {/* Cart Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Carrinho</h2>
            </div>
            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {cart.itemCount}
            </span>
          </div>

          {/* Cart Items */}
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carrinho vazio
              </h3>
              <p className="text-gray-500 text-sm">
                Adicione alguns pratos deliciosos do nosso cardápio
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cart.items.map(cartItem => (
                  <div key={cartItem.menuItem.id} className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm flex-1 pr-2">
                        {cartItem.menuItem.name}
                      </h4>
                      <button
                        onClick={() => removeItem(cartItem.menuItem.id)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        title="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(cartItem.menuItem.id, -1)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                          {cartItem.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(cartItem.menuItem.id, 1)}
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-primary-600">
                          {formatPrice(cartItem.menuItem.price * cartItem.quantity)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPrice(cartItem.menuItem.price)} cada
                        </div>
                      </div>
                    </div>
                    
                    {cartItem.observations && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-200">
                        <p className="text-xs text-gray-700">
                          <strong>Observação:</strong> {cartItem.observations}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                {/* Delivery Info */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Tempo estimado</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {Math.max(...cart.items.map(item => item.menuItem.preparationTime))} - {Math.max(...cart.items.map(item => item.menuItem.preparationTime)) + 10} minutos
                  </p>
                </div>

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart.itemCount} itens)</span>
                    <span className="font-medium">{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa de entrega</span>
                    <span className="font-medium text-green-600">Grátis</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPrice(cart.total)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleFinishOrder}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 font-medium"
                  >
                    Finalizar Pedido
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-600 hover:text-gray-800"
                    onClick={handleClearCart}
                  >
                    Limpar Carrinho
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
