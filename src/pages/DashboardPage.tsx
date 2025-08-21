import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, Package, TrendingUp, Users, DollarSign, CalendarDays, User, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '../contexts';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { orderService } from '../services/orderService';
import { useChatNotifications } from '../hooks';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}

function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadChats, hasUnreadMessages } = useChatNotifications();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    lastMonthSpent: 0,
    averageOrder: 0,
    totalSaved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const orders = await orderService.getMyOrders();
        
        // Calcular estatísticas
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
        
        // Calcular valor economizado com pedidos agendados (desconto de 2%)
        const scheduledOrders = orders.filter(order => order.deliveryType === 'scheduled');
        const totalSaved = scheduledOrders.reduce((sum, order) => {
          // Usar o campo discountAmount salvo no banco de dados
          const savedAmount = order.discountAmount || 0;
          return sum + savedAmount;
        }, 0);
        
        // Calcular valor gasto no último mês
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const lastMonthOrders = orders.filter(order => 
          new Date(order.createdAt) >= oneMonthAgo
        );
        const lastMonthSpent = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
        
        // Calcular valor médio por pedido
        const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
        
        setStats({
          totalOrders,
          totalSpent,
          lastMonthSpent,
          averageOrder,
          totalSaved
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo de volta! Veja o que está acontecendo.</p>
      </div>

      {/* Ações Rápidas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/make-order">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-full">
                  <ShoppingBag className="text-primary-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Fazer Pedido</h3>
                  <p className="text-gray-600">Explore nosso cardápio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/my-orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Meus Pedidos</h3>
                  <p className="text-gray-600">Acompanhe seus pedidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Estatísticas do Cliente */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.totalOrders}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="text-blue-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : formatPrice(stats.totalSpent)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Último Mês</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : formatPrice(stats.lastMonthSpent)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CalendarDays className="text-purple-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média por Pedido</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : formatPrice(stats.averageOrder)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="text-orange-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Economizado</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : formatPrice(stats.totalSaved)}
                </p>
                <p className="text-xs text-gray-500">com pedidos agendados</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suporte e Contato */}
      <div className="flex flex-col items-center space-y-4">
        <p className="text-gray-600 text-center">
          Precisa de ajuda? Entre em contato conosco.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          {/* Botão WhatsApp */}
          <button
            onClick={() => {
              const phoneNumber = '+5543999999999';
              const userName = user?.name || user?.email || 'Cliente';
              const message = `Olá! Sou ${userName} e estou com uma dúvida sobre meu pedido no HotBox.`;
              const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex-1"
            title="Falar no WhatsApp"
          >
            <svg 
              className="w-6 h-6" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
            </svg>
            <span className="font-medium">WhatsApp</span>
          </button>

          {/* Botão Chat Online */}
          <div className="relative flex-1">
            <button
              onClick={() => navigate('/chat')}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Chat Online"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium">Chat Online</span>
              {hasUnreadMessages && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {unreadChats > 9 ? '9+' : unreadChats}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { unreadChats, hasUnreadMessages } = useChatNotifications();
  const [adminStats, setAdminStats] = useState({
    ordersToday: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminStats = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Calcular pedidos de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const ordersToday = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today && orderDate < tomorrow;
        }).length;
        
        // Calcular pedidos pendentes
        const pendingOrders = allOrders.filter(order => 
          order.status === 'pending' || order.status === 'preparing'
        ).length;
        
        // Calcular faturamento total
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
        
        // Calcular total de clientes únicos
        const uniqueCustomers = new Set(allOrders.map(order => order.userId));
        const totalCustomers = uniqueCustomers.size;
        
        setAdminStats({
          ordersToday,
          pendingOrders,
          totalRevenue,
          totalCustomers
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas do admin:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminStats();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600">Visão geral do restaurante</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : adminStats.ordersToday}
                </p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                <Package className="text-gray-700" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : adminStats.pendingOrders}
                </p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                <Clock className="text-gray-700" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : formatPrice(adminStats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                <TrendingUp className="text-gray-700" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : adminStats.totalCustomers}
                </p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                <Users className="text-gray-700" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6">
        <Link to="/admin/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="pt-6 h-full flex items-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm flex-shrink-0">
                  <Package className="text-gray-700" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg">Gerenciar Pedidos</h3>
                  <p className="text-gray-600 text-sm">Ver e atualizar status dos pedidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/stock">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="pt-6 h-full flex items-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm flex-shrink-0">
                  <Package className="text-gray-700" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg">Controle de Estoque</h3>
                  <p className="text-gray-600 text-sm">Gerenciar inventário dos itens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="relative">
          <button
            onClick={() => navigate('/admin/chat')}
            className="w-full h-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
              <CardContent className="pt-6 h-full flex items-center">
                <div className="flex items-center space-x-4 w-full">
                  <div className="p-3 bg-red-100 rounded-full relative flex-shrink-0">
                    <MessageCircle className="text-red-600" size={24} />
                    {hasUnreadMessages && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadChats > 9 ? '9+' : unreadChats}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg">
                      Central de Atendimento
                      {hasUnreadMessages && (
                        <span className="ml-2 text-red-600 text-sm font-normal">
                          ({unreadChats} nova{unreadChats !== 1 ? 's' : ''})
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm">Atender clientes via chat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        <Link to="/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="pt-6 h-full flex items-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm flex-shrink-0">
                  <User className="text-gray-700" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg">Meu Perfil</h3>
                  <p className="text-gray-600 text-sm">Editar informações pessoais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Estatísticas - Top 5 Itens e Top 5 Clientes */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>2 Itens Mais Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopItemsStats />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes que Mais Compraram</CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomersStats />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TopItemsStats() {
  const [topItems, setTopItems] = useState<Array<{
    name: string;
    quantity: number;
    percentage: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

  const getDateFilter = (period: typeof selectedPeriod) => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return (date: Date) => date >= today;
      
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return (date: Date) => date >= weekAgo;
      
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return (date: Date) => date >= monthAgo;
      
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return (date: Date) => date >= yearAgo;
      
      case 'all':
      default:
        return () => true;
    }
  };

  const getPeriodLabel = (period: typeof selectedPeriod) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      case 'all': return 'Todos os Tempos';
      default: return 'Todos os Tempos';
    }
  };

  useEffect(() => {
    const loadTopItems = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar pedidos pelo período selecionado
        const dateFilter = getDateFilter(selectedPeriod);
        const filteredOrders = allOrders.filter(order => 
          dateFilter(new Date(order.createdAt))
        );
        
        // Contar quantidade de cada item
        const itemCounts: Record<string, { name: string; count: number }> = {};
        
        filteredOrders.forEach(order => {
          order.items.forEach(item => {
            const itemName = item.menuItem.name;
            if (itemCounts[itemName]) {
              itemCounts[itemName].count += item.quantity;
            } else {
              itemCounts[itemName] = {
                name: itemName,
                count: item.quantity
              };
            }
          });
        });

        // Converter para array e ordenar
        const sortedItems = Object.values(itemCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calcular percentuais
        const totalItems = sortedItems.reduce((sum, item) => sum + item.count, 0);
        
        const topItemsWithPercentage = sortedItems.map(item => ({
          name: item.name,
          quantity: item.count,
          percentage: totalItems > 0 ? (item.count / totalItems) * 100 : 0
        }));

        setTopItems(topItemsWithPercentage);
      } catch (error) {
        console.error('Erro ao carregar estatísticas de itens:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopItems();
  }, [selectedPeriod]);

  return (
    <div className="space-y-4">
      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
          Período:
        </span>
        {[
          { value: 'today', label: 'Hoje' },
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mês' },
          { value: 'year', label: 'Ano' },
          { value: 'all', label: 'Todos' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Título do período selecionado */}
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800">
          Top 5 Itens - {getPeriodLabel(selectedPeriod)}
        </h4>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-gray-300 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : topItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Nenhum item encontrado para {getPeriodLabel(selectedPeriod).toLowerCase()}.</p>
          <p className="text-sm">Tente selecionar um período diferente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topItems.map((item, index) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.quantity} {item.quantity === 1 ? 'pedido' : 'pedidos'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopCustomersStats() {
  const [topCustomers, setTopCustomers] = useState<Array<{
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
    percentage: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

  const getDateFilter = (period: typeof selectedPeriod) => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return (date: Date) => date >= today;
      
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return (date: Date) => date >= weekAgo;
      
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return (date: Date) => date >= monthAgo;
      
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return (date: Date) => date >= yearAgo;
      
      case 'all':
      default:
        return () => true;
    }
  };

  const getPeriodLabel = (period: typeof selectedPeriod) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      case 'all': return 'Todos os Tempos';
      default: return 'Todos os Tempos';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  useEffect(() => {
    const loadTopCustomers = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar pedidos pelo período selecionado
        const dateFilter = getDateFilter(selectedPeriod);
        const filteredOrders = allOrders.filter(order => 
          dateFilter(new Date(order.createdAt))
        );
        
        // Agrupar por cliente e calcular totais
        const customerStats: Record<string, {
          name: string;
          email: string;
          totalSpent: number;
          orderCount: number;
        }> = {};
        
        filteredOrders.forEach(order => {
          const customerId = order.userId;
          const customerName = order.userName || 'Cliente Anônimo';
          const customerEmail = order.userEmail || '';
          
          if (customerStats[customerId]) {
            customerStats[customerId].totalSpent += order.total;
            customerStats[customerId].orderCount += 1;
          } else {
            customerStats[customerId] = {
              name: customerName,
              email: customerEmail,
              totalSpent: order.total,
              orderCount: 1
            };
          }
        });

        // Converter para array e ordenar por valor total gasto
        const sortedCustomers = Object.values(customerStats)
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5);

        // Calcular percentuais baseado no total gasto
        const totalSpent = sortedCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
        
        const topCustomersWithPercentage = sortedCustomers.map(customer => ({
          name: customer.name,
          email: customer.email,
          totalSpent: customer.totalSpent,
          orderCount: customer.orderCount,
          percentage: totalSpent > 0 ? (customer.totalSpent / totalSpent) * 100 : 0
        }));

        setTopCustomers(topCustomersWithPercentage);
      } catch (error) {
        console.error('Erro ao carregar estatísticas de clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopCustomers();
  }, [selectedPeriod]);

  return (
    <div className="space-y-4">
      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
          Período:
        </span>
        {[
          { value: 'today', label: 'Hoje' },
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mês' },
          { value: 'year', label: 'Ano' },
          { value: 'all', label: 'Todos' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Título do período selecionado */}
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800">
          Top 5 Clientes - {getPeriodLabel(selectedPeriod)}
        </h4>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-gray-300 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : topCustomers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Nenhum cliente encontrado para {getPeriodLabel(selectedPeriod).toLowerCase()}.</p>
          <p className="text-sm">Tente selecionar um período diferente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topCustomers.map((customer, index) => (
            <div key={customer.email || customer.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    {customer.email && (
                      <div className="text-xs text-gray-500">{customer.email}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(customer.totalSpent)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {customer.orderCount} {customer.orderCount === 1 ? 'pedido' : 'pedidos'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {customer.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${customer.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
