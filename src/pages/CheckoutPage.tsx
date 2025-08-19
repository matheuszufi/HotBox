import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Clock, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { useCart, useAuth } from '../contexts';
import { Button, Card, CardContent, Input } from '../components/ui';
import { orderService } from '../services/orderService';
import type { CreateOrderData } from '../types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  
  // Verificar se usuário está logado
  useEffect(() => {
    if (!user) {
      console.log('❌ Usuário não autenticado, redirecionando para login');
      navigate('/login');
      return;
    }
  }, [user, navigate]);
  
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    paymentMethod: 'card' as 'cash' | 'card' | 'pix',
    notes: '',
    deliveryType: 'today' as 'today' | 'scheduled',
    deliveryDate: '',
    deliveryTime: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    for (let hour = 10; hour <= 14; hour++) {
      // Para horários de hoje, só mostrar horários futuros
      if (formData.deliveryType === 'today') {
        if (hour < currentHour || (hour === currentHour && currentMinutes >= 30)) {
          continue; // Pular horários passados
        }
      }
      
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 14) {
        // Para hoje, verificar se o horário :30 ainda é válido
        if (formData.deliveryType === 'today' && hour === currentHour && currentMinutes >= 0) {
          // Se já passou dos 30 min da hora atual, não incluir
        } else {
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
    }
    return slots;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7); // Até 7 dias no futuro
    return maxDate.toISOString().split('T')[0];
  };

  const calculateDiscount = () => {
    if (formData.deliveryType === 'scheduled') {
      return cart.total * 0.02; // 2% de desconto
    }
    return 0;
  };

  const getFinalTotal = () => {
    return cart.total - calculateDiscount();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Endereço de entrega é obrigatório';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Método de pagamento é obrigatório';
    }

    // Horário é obrigatório para ambos os tipos de entrega
    if (!formData.deliveryTime) {
      newErrors.deliveryTime = 'Horário de entrega é obrigatório';
    }

    if (formData.deliveryType === 'scheduled') {
      if (!formData.deliveryDate) {
        newErrors.deliveryDate = 'Data de entrega é obrigatória';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando submit do pedido');
    console.log('📋 FormData:', formData);
    console.log('🛒 Cart:', cart);
    
    if (!validateForm()) {
      console.log('❌ Validação falhou');
      return;
    }
    
    if (cart.items.length === 0) {
      console.log('❌ Carrinho vazio');
      return;
    }

    if (!user) {
      console.log('❌ Usuário não autenticado');
      navigate('/login');
      return;
    }

    setLoading(true);
    
    try {
      console.log('⏳ Criando dados do pedido...');
      
      const orderData: CreateOrderData = {
        items: cart.items,
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        deliveryType: formData.deliveryType,
        deliveryDate: formData.deliveryType === 'scheduled' 
          ? formData.deliveryDate 
          : new Date().toISOString().split('T')[0], // Hoje no formato YYYY-MM-DD
        deliveryDateTime: (() => {
          if (formData.deliveryType === 'scheduled' && formData.deliveryDate && formData.deliveryTime) {
            // Para pedidos agendados: combinar data e hora
            return `${formData.deliveryDate}T${formData.deliveryTime}:00`;
          } else if (formData.deliveryTime) {
            // Para pedidos de hoje com horário específico
            const today = new Date().toISOString().split('T')[0];
            return `${today}T${formData.deliveryTime}:00`;
          } else {
            // Para pedidos sem horário específico, usar horário atual + 30 min
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            return now.toISOString();
          }
        })(),
        scheduledDate: formData.deliveryType === 'scheduled' ? formData.deliveryDate : undefined,
        scheduledTime: formData.deliveryTime || undefined
      };

      // Adicionar informações de agendamento nas observações se for entrega agendada
      if (formData.deliveryType === 'scheduled' && formData.deliveryDate && formData.deliveryTime) {
        const scheduledInfo = `Entrega agendada para ${new Date(formData.deliveryDate).toLocaleDateString('pt-BR')} às ${formData.deliveryTime}. Desconto de 2% aplicado.`;
        orderData.notes = orderData.notes 
          ? `${orderData.notes}\n\n${scheduledInfo}`
          : scheduledInfo;
      } else if (formData.deliveryType === 'today' && formData.deliveryTime) {
        const todayInfo = `Entrega hoje às ${formData.deliveryTime}.`;
        orderData.notes = orderData.notes 
          ? `${orderData.notes}\n\n${todayInfo}`
          : todayInfo;
      }

      console.log('📦 OrderData criado:', orderData);
      
      console.log('🔄 Chamando orderService.createOrder...');
      const createdOrder = await orderService.createOrder(orderData);
      
      console.log('✅ Pedido criado com sucesso:', createdOrder);
      
      clearCart();
      navigate('/order-success');
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
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

              {/* Agendamento de Entrega */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold">Agendamento de Entrega</h3>
                  </div>
                  
                  {/* Tipo de entrega */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange('deliveryType', 'today')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        formData.deliveryType === 'today'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🚀</div>
                      <div className="font-medium">Entrega Hoje</div>
                      <div className="text-sm text-gray-600">Escolha o horário</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleInputChange('deliveryType', 'scheduled')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors relative ${
                        formData.deliveryType === 'scheduled'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">📅</div>
                      <div className="font-medium">Agendar Entrega</div>
                      <div className="text-sm text-green-600 font-medium">2% de desconto!</div>
                      {formData.deliveryType === 'scheduled' && calculateDiscount() > 0 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          -{formatPrice(calculateDiscount())}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Seleção de horário para entrega hoje */}
                  {formData.deliveryType === 'today' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horário de Entrega Hoje
                      </label>
                      <select
                        value={formData.deliveryTime}
                        onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.deliveryTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecione o horário</option>
                        {generateTimeSlots().map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      {errors.deliveryTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.deliveryTime}</p>
                      )}
                      <p className="text-blue-600 text-sm mt-2">
                        💡 Disponível das 10:00 às 14:00. Horários passados não são exibidos.
                      </p>
                    </div>
                  )}

                  {/* Campos de agendamento */}
                  {formData.deliveryType === 'scheduled' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Entrega
                        </label>
                        <input
                          type="date"
                          min={getTomorrowDate()}
                          max={getMaxDate()}
                          value={formData.deliveryDate}
                          onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.deliveryDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.deliveryDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.deliveryDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário de Entrega
                        </label>
                        <select
                          value={formData.deliveryTime}
                          onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.deliveryTime ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Selecione o horário</option>
                          {generateTimeSlots().map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        {errors.deliveryTime && (
                          <p className="text-red-500 text-sm mt-1">{errors.deliveryTime}</p>
                        )}
                      </div>
                    </div>
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
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatPrice(cart.total)}</span>
                    </div>
                    {formData.deliveryType === 'scheduled' && calculateDiscount() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Desconto (agendamento):</span>
                        <span className="font-medium text-green-600">-{formatPrice(calculateDiscount())}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(getFinalTotal())}
                      </span>
                    </div>
                  </div>

                  {/* Tempo estimado */}
                  <div className="flex items-center text-gray-600 text-sm mb-6">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {formData.deliveryType === 'today' 
                        ? 'Tempo estimado: 30-45 min'
                        : formData.deliveryDate && formData.deliveryTime
                          ? `Entrega agendada: ${new Date(formData.deliveryDate).toLocaleDateString('pt-BR')} às ${formData.deliveryTime}`
                          : 'Selecione data e horário'
                      }
                    </span>
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
