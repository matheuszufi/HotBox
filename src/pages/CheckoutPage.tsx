import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Clock, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../contexts';
import { Button, Card, CardContent, Input } from '../components/ui';
import { orderService } from '../services/orderService';
import type { CreateOrderData } from '../types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    paymentMethod: 'card' as 'cash' | 'card' | 'pix',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Endereço de entrega é obrigatório';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Método de pagamento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (cart.items.length === 0) return;

    setLoading(true);
    
    try {
      const orderData: CreateOrderData = {
        items: cart.items,
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined
      };

      await orderService.createOrder(orderData);
      clearCart();
      navigate('/order-success');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      setErrors({ submit: 'Erro ao finalizar pedido. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Carrinho vazio
            </h2>
            <p className="text-gray-600 mb-6">
              Adicione itens ao carrinho antes de finalizar o pedido.
            </p>
            <Button
              onClick={() => navigate('/make-order')}
              className="w-full"
            >
              Ver Cardápio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/make-order')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Cardápio
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
          <p className="text-gray-600 mt-2">Revise seu pedido e preencha os dados de entrega</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Endereço de Entrega */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold">Endereço de Entrega</h3>
                  </div>
                  <Input
                    placeholder="Digite seu endereço completo"
                    value={formData.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    className={errors.deliveryAddress ? 'border-red-500' : ''}
                  />
                  {errors.deliveryAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>
                  )}
                </CardContent>
              </Card>

              {/* Método de Pagamento */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold">Método de Pagamento</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'card', label: 'Cartão', icon: '💳' },
                      { value: 'pix', label: 'PIX', icon: '📱' },
                      { value: 'cash', label: 'Dinheiro', icon: '💵' }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => handleInputChange('paymentMethod', method.value)}
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          formData.paymentMethod === method.value
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="font-medium">{method.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-2">{errors.paymentMethod}</p>
                  )}
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Observações (opcional)</h3>
                  <textarea
                    placeholder="Alguma observação especial sobre seu pedido?"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Resumo do Pedido
                </h3>

                {/* Itens */}
                <div className="space-y-3 mb-4">
                  {cart.items.map((item) => (
                    <div key={item.menuItem.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.menuItem.name}</p>
                        <p className="text-gray-600 text-xs">
                          {item.quantity}x {formatPrice(item.menuItem.price)}
                        </p>
                        {item.observations && (
                          <p className="text-gray-500 text-xs italic">
                            Obs: {item.observations}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-sm">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(cart.total)}
                    </span>
                  </div>

                  {/* Tempo estimado */}
                  <div className="flex items-center text-gray-600 text-sm mb-6">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Tempo estimado: 30-45 min</span>
                  </div>

                  {/* Botão de finalizar */}
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || cart.items.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
