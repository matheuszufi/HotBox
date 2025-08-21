import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  ArrowLeft,
  Loader2,
  Users,
  Truck,
  ChevronDown
} from 'lucide-react';
import { Button, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    deliveryType: 'all'
  });

  // Buscar orders quando a página carregar
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || user.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Buscando todos os pedidos...');
        
        const fetchedOrders = await orderService.getAllOrders();
        
        console.log('📦 Pedidos encontrados:', fetchedOrders.length);
        
        setAllOrders(fetchedOrders);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('❌ Erro ao buscar pedidos:', err);
        setError('Erro ao carregar pedidos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedOrder && !(event.target as Element).closest('.status-dropdown')) {
        setSelectedOrder(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedOrder]);

  // Função para filtrar pedidos
  const applyFilters = () => {
    let filtered = [...allOrders];

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtro por método de pagamento
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
    }

    // Filtro por data
    if (filters.dateRange !== 'all') {
      switch (filters.dateRange) {
        case 'today':
          // Criar data de hoje usando construtor local (evita problemas de timezone)
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
          
          // Criar data de amanhã no início do dia para comparação
          const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
          
          console.log('🗓️ Filtro "Hoje" aplicado:');
          console.log('📅 Início de hoje (local):', todayStart.toLocaleString('pt-BR'));
          console.log('📅 Início de amanhã (local):', tomorrowStart.toLocaleString('pt-BR'));
          console.log('📅 Início de hoje (ISO):', todayStart.toISOString());
          console.log('📅 Início de amanhã (ISO):', tomorrowStart.toISOString());
          
          filtered = filtered.filter(order => {
            // Usar deliveryDateTime se disponível, senão usar deliveryDate, senão usar createdAt
            let orderDate: Date;
            
            if (order.deliveryDateTime) {
              orderDate = new Date(order.deliveryDateTime);
            } else if (order.deliveryDate) {
              // Se deliveryDate é só uma data (YYYY-MM-DD), criar data local sem timezone
              const dateParts = order.deliveryDate.split('-');
              orderDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0, 0);
            } else {
              orderDate = new Date(order.createdAt);
            }
            
            const isToday = orderDate >= todayStart && orderDate < tomorrowStart;
            
            if (isToday) {
              console.log(`✅ Pedido ${order.id.slice(-8)} incluído - Data: ${orderDate.toLocaleString('pt-BR')} (${orderDate.toISOString()})`);
            } else {
              console.log(`❌ Pedido ${order.id.slice(-8)} FORA do hoje - Data: ${orderDate.toLocaleString('pt-BR')} (${orderDate.toISOString()})`);
            }
            
            // Verificar se a data do pedido está entre hoje 00:00 e amanhã 00:00 (exclusivo)
            return isToday;
          });
          
          console.log(`📊 Total de pedidos de hoje: ${filtered.length}`);
          break;
        case 'upcoming':
          // Mostrar apenas pedidos agendados para os próximos 7 dias
          const todayUpcoming = new Date();
          const todayUpcomingStart = new Date(todayUpcoming.getFullYear(), todayUpcoming.getMonth(), todayUpcoming.getDate(), 0, 0, 0, 0);
          const nextWeek = new Date(todayUpcoming.getFullYear(), todayUpcoming.getMonth(), todayUpcoming.getDate() + 7, 23, 59, 59, 999);
          
          filtered = filtered.filter(order => {
            // Apenas pedidos agendados nos próximos dias
            if (order.deliveryType === 'scheduled') {
              let deliveryDate: Date;
              
              if (order.deliveryDateTime) {
                deliveryDate = new Date(order.deliveryDateTime);
              } else if (order.deliveryDate) {
                const dateParts = order.deliveryDate.split('-');
                deliveryDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0, 0);
              } else {
                deliveryDate = new Date(order.createdAt);
              }
              
              return deliveryDate > todayUpcomingStart && deliveryDate <= nextWeek;
            }
            return false; // Não mostrar pedidos não agendados neste filtro
          });
          break;
        case 'week':
          // Últimos 7 dias (incluindo hoje) usando datas locais
          const todayWeek = new Date();
          const weekStart = new Date(todayWeek.getFullYear(), todayWeek.getMonth(), todayWeek.getDate() - 7, 0, 0, 0, 0);
          const weekEnd = new Date(todayWeek.getFullYear(), todayWeek.getMonth(), todayWeek.getDate(), 23, 59, 59, 999);
          
          filtered = filtered.filter(order => {
            let deliveryDate: Date;
            
            if (order.deliveryDateTime) {
              deliveryDate = new Date(order.deliveryDateTime);
            } else if (order.deliveryDate) {
              const dateParts = order.deliveryDate.split('-');
              deliveryDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0, 0);
            } else {
              deliveryDate = new Date(order.createdAt);
            }
            
            return deliveryDate >= weekStart && deliveryDate <= weekEnd;
          });
          break;
        case 'month':
          // Últimos 30 dias (incluindo hoje) usando datas locais
          const todayMonth = new Date();
          const monthStart = new Date(todayMonth.getFullYear(), todayMonth.getMonth(), todayMonth.getDate() - 30, 0, 0, 0, 0);
          const monthEnd = new Date(todayMonth.getFullYear(), todayMonth.getMonth(), todayMonth.getDate(), 23, 59, 59, 999);
          
          filtered = filtered.filter(order => {
            let deliveryDate: Date;
            
            if (order.deliveryDateTime) {
              deliveryDate = new Date(order.deliveryDateTime);
            } else if (order.deliveryDate) {
              const dateParts = order.deliveryDate.split('-');
              deliveryDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0, 0);
            } else {
              deliveryDate = new Date(order.createdAt);
            }
            
            return deliveryDate >= monthStart && deliveryDate <= monthEnd;
          });
          break;
      }
    }

    setOrders(filtered);
  };

  // Aplicar filtros quando mudar
  useEffect(() => {
    applyFilters();
  }, [filters, allOrders]);

  // Opções de status disponíveis
  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Pronto', color: 'bg-green-100 text-green-800' },
    { value: 'out-for-delivery', label: 'Saiu para Entrega', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Entregue', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  // Função para atualizar status do pedido
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Atualizar o pedido na lista de todos os pedidos
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() }
            : order
        )
      );
      
      setSelectedOrder(null);
      console.log('✅ Status atualizado com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
      setError('Erro ao atualizar status. Tente novamente.');
    } finally {
      setUpdatingStatus(null);
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
          <p className="text-gray-600">Carregando pedidos confirmados...</p>
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
              <p className="text-gray-600 mt-1">
                Visualize e altere o status de todos os pedidos
              </p>
            </div>
            <div className="flex items-center space-x-4">
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
        </div>

        {/* Filtros */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">Todos os status</option>
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="ready">Pronto</option>
                    <option value="out-for-delivery">Saiu para Entrega</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {/* Filtro por Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">Todos os métodos</option>
                    <option value="card">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>

                {/* Filtro por Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">Todos os períodos</option>
                    <option value="today">Hoje</option>
                    <option value="upcoming">Próximos Dias</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                  </select>
                </div>
              </div>

              {/* Botão para limpar filtros */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Mostrando {orders.length} de {allOrders.length} pedidos
                </div>
                <Button
                  onClick={() => setFilters({ status: 'all', paymentMethod: 'all', dateRange: 'all', deliveryType: 'all' })}
                  variant="outline"
                  size="sm"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">{orders.length}</p>
                </div>
                <Package className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    R$ {orders
                      .filter(order => order.status !== 'cancelled' && order.status !== 'pending')
                      .reduce((sum, order) => sum + order.total, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-r from-red-100 to-orange-100 rounded-full">
                  <Package className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {new Set(orders.map(order => order.userId)).size}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          // Estado vazio
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Não há pedidos no sistema no momento.
            </p>
          </div>
        ) : (
          // Lista de pedidos
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
                    {/* Informações principais */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          
                          {/* Status clicável com dropdown */}
                          <div className="relative status-dropdown">
                            <button
                              onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                              disabled={updatingStatus === order.id}
                              className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center space-x-1 ${getStatusColor(order.status)}`}
                            >
                              {updatingStatus === order.id ? (
                                <div className="flex items-center space-x-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Atualizando...</span>
                                </div>
                              ) : (
                                <>
                                  <span>{getStatusText(order.status)}</span>
                                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                                    selectedOrder === order.id ? 'rotate-180' : ''
                                  }`} />
                                </>
                              )}
                            </button>
                            
                            {/* Dropdown de opções */}
                            {selectedOrder === order.id && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                                <div className="py-1">
                                  {statusOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() => handleUpdateStatus(order.id, option.value)}
                                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                        option.value === order.status ? 'bg-gray-100 font-medium' : ''
                                      }`}
                                    >
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs mr-2 ${option.color}`}>
                                        {option.label}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          Pedido #{order.id.slice(-8)}
                        </span>
                      </div>

                      {/* Cliente */}
                      <div className="mb-3">
                        <p className="font-medium text-gray-900">{order.userName}</p>
                        <p className="text-sm text-gray-600">{order.userEmail}</p>
                        {order.userPhone ? (
                          <p className="text-sm text-gray-600">📞 {order.userPhone}</p>
                        ) : (
                          <p className="text-sm text-gray-400">📞 Telefone não informado</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Data/Hora de Entrega */}
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-gray-900">
                              Entrega: {new Date(order.deliveryDateTime || order.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-600">
                              às {new Date(order.deliveryDateTime || order.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {order.deliveryType === 'scheduled' && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  Agendado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Endereço */}
                        {order.deliveryAddress && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                        )}
                      </div>

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

                    {/* Total */}
                    <div className="lg:ml-6 lg:text-right">
                      <div className="bg-primary-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total do pedido</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                          R$ {order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod === 'card' && 'Cartão de Crédito'}
                          {order.paymentMethod === 'pix' && 'PIX'}
                          {order.paymentMethod === 'cash' && 'Dinheiro'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
