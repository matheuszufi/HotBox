import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Package, TrendingUp, Users, DollarSign, CalendarDays, User } from 'lucide-react';
import { useAuth } from '../contexts';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}

function CustomerDashboard() {
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
