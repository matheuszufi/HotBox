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
      <div className="lg:sticky lg:top-0 h-auto">
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
              <div className="space-y-4 mb-6">
                {cart.items.map(cartItem => (
                  <div 
                    key={cartItem.menuItem.id} 
                    className="relative rounded-lg p-4 transition-all overflow-hidden border border-primary-100 min-h-[120px]"
                    style={{
                      backgroundImage: `url(${cartItem.menuItem.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Overlay para legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-black/40 rounded-lg"></div>
                    
                    {/* Conteúdo do item */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-white text-sm flex-1 pr-2 drop-shadow-md">
                          {cartItem.menuItem.name}
                        </h4>
                        <button
                          onClick={() => removeItem(cartItem.menuItem.id)}
                          className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 drop-shadow-md"
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
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 bg-white/90 backdrop-blur-sm"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="font-medium text-white min-w-[2rem] text-center drop-shadow-md bg-black/30 px-2 py-1 rounded">
                          {cartItem.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(cartItem.menuItem.id, 1)}
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 bg-white/90 backdrop-blur-sm"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-white drop-shadow-md bg-black/30 px-2 py-1 rounded">
                          {formatPrice(cartItem.menuItem.price * cartItem.quantity)}
                        </div>
                        <div className="text-xs text-white/80 drop-shadow-md mt-1">
                          {formatPrice(cartItem.menuItem.price)} cada
                        </div>
                      </div>
                    </div>
                    
                    {cartItem.observations && (
                      <div className="mt-3 p-2 bg-black/50 backdrop-blur-sm rounded border-l-4 border-yellow-300">
                        <p className="text-xs text-white">
                          <strong>Observação:</strong> {cartItem.observations}
                        </p>
                      </div>
                    )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                {/* Delivery Info */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Informações do pedido</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'} selecionados
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
