import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Calendar,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Trash2,
  Truck
} from 'lucide-react';
import { Button, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

export function MyOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  // Buscar orders quando a página carregar
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Buscando pedidos do usuário...');
        console.log('👤 User ID atual:', user.uid);
        console.log('📧 User email:', user.email);
        console.log('👤 User completo:', user);
        
        const userOrders = await orderService.getMyOrders();
        console.log('📦 Pedidos encontrados:', userOrders);
        console.log('📊 Quantidade de pedidos:', userOrders.length);
        
        setOrders(userOrders);
      } catch (err) {
        console.error('❌ Erro ao buscar pedidos:', err);
        setError('Erro ao carregar seus pedidos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    // Debug adicional para verificar Firebase
    const debugFirebase = async () => {
      if (!user) return;
      
      try {
        console.log('🔧 Verificando Firebase...');
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');
        
        // Buscar pedidos específicos do usuário
        console.log('👤 Buscando pedidos específicos do usuário...');
        const userOrdersRef = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const userOrdersSnapshot = await getDocs(userOrdersRef);
        
        console.log(`👤 Pedidos encontrados para o usuário: ${userOrdersSnapshot.size}`);
        
      } catch (error) {
        console.error('❌ Erro no debug do Firebase:', error);
      }
    };

    fetchOrders();
    debugFirebase();
  }, [user, navigate]);

  // Função para deletar pedido
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) {
      return;
    }

    try {
      setDeletingOrder(orderId);
      await orderService.deleteOrder(orderId);
      
      // Remover o pedido da lista local
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      console.log('✅ Pedido excluído com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao excluir pedido:', err);
      setError('Erro ao excluir pedido. Tente novamente.');
    } finally {
      setDeletingOrder(null);
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'out-for-delivery':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'out-for-delivery':
        return 'Saiu para Entrega';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'out-for-delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Estado de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-gray-600 mt-1">
                Acompanhe o status dos seus pedidos
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
          </div>
        </div>

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          // Estado vazio
          <div className="text-center py-12">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Você ainda não fez nenhum pedido. Que tal experimentar nosso delicioso cardápio?
            </p>
            <Button
              onClick={() => navigate('/make-order')}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Fazer Primeiro Pedido
            </Button>
          </div>
        ) : (
          // Lista de pedidos
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Informações principais */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Pedido #{order.id.slice(-8)}
                        </span>
                      </div>

                      {/* Nome do usuário */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>👤</span>
                          <span>{order.userName || order.userEmail}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Data */}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Endereço */}
                        {order.deliveryAddress && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                        )}
                      </div>

                      {/* Telefone do usuário */}
                      {order.userPhone && (
                        <div className="mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📞</span>
                            <span>{order.userPhone}</span>
                          </div>
                        </div>
                      )}

                      {/* Itens do pedido */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Itens do pedido:</h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.quantity}x {item.menuItem.name}
                              </span>
                              <span className="text-gray-900 font-medium">
                                R$ {(item.menuItem.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Observações */}
                      {order.notes && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Observações:</h4>
                          <p className="text-sm text-gray-600">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Total e ações */}
                    <div className="lg:ml-6 lg:text-right">
                      <div className="bg-primary-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total do pedido</p>
                        <p className="text-2xl font-bold text-primary-600">
                          R$ {order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod === 'card' && 'Cartão de Crédito'}
                          {order.paymentMethod === 'pix' && 'PIX'}
                          {order.paymentMethod === 'cash' && 'Dinheiro'}
                        </p>
                        
                        {/* Botão de excluir para pedidos pendentes */}
                        {order.status === 'pending' && (
                          <div className="mt-3">
                            <Button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deletingOrder === order.id}
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                            >
                              {deletingOrder === order.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Excluindo...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir Pedido
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Botão para fazer novo pedido */}
        {orders.length > 0 && (
          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/make-order')}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Fazer Novo Pedido
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
