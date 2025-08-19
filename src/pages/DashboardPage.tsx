import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Package, TrendingUp, Users, DollarSign, CalendarDays, User } from 'lucide-react';
import { useAuth } from '../contexts';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { orderService } from '../services/orderService';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}

function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    lastMonthSpent: 0,
    averageOrder: 0
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
          averageOrder
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
      </div>

      {/* Suporte WhatsApp */}
      <div className="flex flex-col items-center space-y-3">
        <p className="text-gray-600 text-center">
          Problemas com pedidos ou dúvidas? Chame no WhatsApp.
        </p>
        <button
          onClick={() => {
            const phoneNumber = '+5543999999999';
            const userName = user?.name || user?.email || 'Cliente';
            const message = `Olá! Sou ${userName} e estou com uma dúvida sobre meu pedido no HotBox.`;
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          title="Falar no WhatsApp"
        >
          {/* Ícone oficial do WhatsApp */}
          <svg 
            className="w-6 h-6" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
          </svg>
          <span className="font-medium">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="text-yellow-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold">R$ 0</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="text-purple-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/admin/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-full">
                  <Package className="text-primary-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gerenciar Pedidos</h3>
                  <p className="text-gray-600">Ver e atualizar status dos pedidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Meu Perfil</h3>
                  <p className="text-gray-600">Editar informações pessoais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhum pedido recente encontrado.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
