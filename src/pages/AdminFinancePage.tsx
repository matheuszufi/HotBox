import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  PieChart,
  BarChart3,
  Download,
  Filter,
  Receipt,
  Target,
  Percent
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order';

interface FinancialStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalDiscounts: number;
  revenueByPaymentMethod: Record<string, number>;
  revenueByPeriod: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topSellingDays: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export default function AdminFinancePage() {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalDiscounts: 0,
    revenueByPaymentMethod: {},
    revenueByPeriod: [],
    topSellingDays: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [orders, setOrders] = useState<Order[]>([]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

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
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Últimos 30 dias';
      case 'year': return 'Último ano';
      case 'all': return 'Todo o período';
      default: return 'Últimos 30 dias';
    }
  };

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar apenas pedidos confirmados, entregues ou em processamento
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        // Aplicar filtro de período
        const dateFilter = getDateFilter(selectedPeriod);
        const filteredOrders = validOrders.filter(order => 
          dateFilter(new Date(order.createdAt))
        );

        setOrders(filteredOrders);

        // Calcular estatísticas
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalDiscounts = filteredOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);

        // Receita por método de pagamento
        const revenueByPaymentMethod: Record<string, number> = {};
        filteredOrders.forEach(order => {
          const method = getPaymentMethodLabel(order.paymentMethod);
          revenueByPaymentMethod[method] = (revenueByPaymentMethod[method] || 0) + order.total;
        });

        // Receita por período (últimos 7 dias)
        const revenueByPeriod: Array<{ date: string; revenue: number; orders: number }> = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === dateStr;
          });
          
          revenueByPeriod.push({
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
            orders: dayOrders.length
          });
        }

        // Top 5 dias com mais vendas
        const dailyRevenue: Record<string, { revenue: number; orders: number }> = {};
        filteredOrders.forEach(order => {
          const date = new Date(order.createdAt).toISOString().split('T')[0];
          if (!dailyRevenue[date]) {
            dailyRevenue[date] = { revenue: 0, orders: 0 };
          }
          dailyRevenue[date].revenue += order.total;
          dailyRevenue[date].orders += 1;
        });

        const topSellingDays = Object.entries(dailyRevenue)
          .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('pt-BR'),
            revenue: data.revenue,
            orders: data.orders
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setStats({
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalDiscounts,
          revenueByPaymentMethod,
          revenueByPeriod,
          topSellingDays
        });
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, [selectedPeriod]);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'pix': return 'PIX';
      default: return 'Não informado';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Dinheiro': return '💵';
      case 'Cartão': return '💳';
      case 'PIX': return '📱';
      default: return '❓';
    }
  };

  const exportToCSV = () => {
    const csvData = orders.map(order => ({
      'Data': formatDate(order.createdAt),
      'Cliente': order.userName,
      'Total': order.total,
      'Pagamento': getPaymentMethodLabel(order.paymentMethod),
      'Status': order.status,
      'Desconto': order.discountAmount || 0
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle Financeiro</h1>
          <p className="text-gray-600 mt-2">Análise financeira e relatórios de vendas</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
        >
          <Download size={20} />
          Exportar CSV
        </button>
      </div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
          <Filter size={16} className="mr-1" />
          Período:
        </span>
        {[
          { value: 'today', label: 'Hoje' },
          { value: 'week', label: '7 dias' },
          { value: 'month', label: '30 dias' },
          { value: 'year', label: '1 ano' },
          { value: 'all', label: 'Todos' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">
                  {stats.totalOrders}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {formatPrice(stats.averageOrderValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">por pedido</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Descontos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatPrice(stats.totalDiscounts)}
                </p>
                <p className="text-xs text-gray-500 mt-1">total concedido</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Percent className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Receita por Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Receita por Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.revenueByPaymentMethod).map(([method, revenue]) => {
                const percentage = stats.totalRevenue > 0 ? (revenue / stats.totalRevenue) * 100 : 0;
                return (
                  <div key={method} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPaymentMethodIcon(method)}</span>
                        <span className="font-medium">{method}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(revenue)}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.revenueByPaymentMethod).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <PieChart size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado de pagamento encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Dias de Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Top 5 Dias com Mais Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topSellingDays.map((day, index) => (
                <div key={day.date} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{day.date}</div>
                      <div className="text-sm text-gray-500">{day.orders} pedidos</div>
                    </div>
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatPrice(day.revenue)}
                  </div>
                </div>
              ))}
              {stats.topSellingDays.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado de vendas encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita dos Últimos 7 Dias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Receita dos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {stats.revenueByPeriod.map((day, index) => {
                const maxRevenue = Math.max(...stats.revenueByPeriod.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="text-center">
                    <div className="mb-2 flex items-end justify-center" style={{ height: '120px' }}>
                      <div 
                        className="bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md w-8 transition-all duration-500"
                        style={{ height: `${height}%`, minHeight: day.revenue > 0 ? '8px' : '0px' }}
                        title={`${formatPrice(day.revenue)} - ${day.orders} pedidos`}
                      ></div>
                    </div>
                    <div className="text-xs font-medium">{day.date}</div>
                    <div className="text-xs text-gray-500">{formatPrice(day.revenue)}</div>
                    <div className="text-xs text-gray-400">{day.orders} pedidos</div>
                  </div>
                );
              })}
            </div>
            {stats.revenueByPeriod.every(day => day.revenue === 0) && (
              <div className="text-center py-8 text-gray-500">
                <TrendingDown size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma venda registrada nos últimos 7 dias</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
