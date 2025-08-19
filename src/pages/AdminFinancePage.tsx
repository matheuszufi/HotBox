import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Percent,
  FileText,
  ArrowUpDown
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
  const navigate = useNavigate();
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
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return (date: Date) => {
          const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          return dateOnly.getTime() >= today.getTime() && dateOnly.getTime() < tomorrow.getTime();
        };
      
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        return (date: Date) => date >= weekAgo && date < todayEnd;
      
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        const todayEnd2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        return (date: Date) => date >= monthAgo && date < todayEnd2;
      
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        const todayEnd3 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        return (date: Date) => date >= yearAgo && date < todayEnd3;
      
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
        console.log('🔄 Carregando dados financeiros...');
        const allOrders = await orderService.getAllOrders();
        console.log('📦 Total de pedidos carregados:', allOrders.length);
        console.log('📋 Pedidos:', allOrders);
        
        // Filtrar pedidos cancelados e pendentes (aceitar apenas processados/confirmados/entregues)
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        console.log('✅ Pedidos válidos (não cancelados/pendentes):', validOrders.length);
        console.log('📊 Status dos pedidos:', allOrders.map(o => ({ id: o.id, status: o.status, total: o.total })));
        
        // Aplicar filtro de período
        const dateFilter = getDateFilter(selectedPeriod);
        const filteredOrders = validOrders.filter(order => {
          // Usar data de entrega agendada para filtro de período também
          let relevantDate: Date;
          
          if (order.deliveryDateTime) {
            relevantDate = new Date(order.deliveryDateTime);
          } else if (order.deliveryDate) {
            relevantDate = new Date(order.deliveryDate + 'T12:00:00');
          } else {
            relevantDate = new Date(order.createdAt);
          }
          
          const matchesFilter = dateFilter(relevantDate);
          
          console.log(`🔍 Pedido ${order.id.slice(-8)}:`);
          console.log(`  📅 Data criação: ${new Date(order.createdAt).toISOString().split('T')[0]}`);
          console.log(`  🚚 Data entrega: ${order.deliveryDate || 'hoje'}`);
          console.log(`  📊 Data usada no filtro: ${relevantDate.toISOString().split('T')[0]}`);
          console.log(`  ✅ Incluído no período '${selectedPeriod}': ${matchesFilter}`);
          console.log(`  💰 Valor: R$ ${order.total}`);
          
          return matchesFilter;
        });
        console.log('📅 Pedidos filtrados por período:', filteredOrders.length);

        setOrders(filteredOrders);

        // Calcular estatísticas (baseadas na data de entrega - APENAS HISTÓRICO)
        console.log('💰 Calculando estatísticas baseadas na data de entrega (HISTÓRICO)...');
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalDiscounts = filteredOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
        
        console.log(`💵 Receita total (HISTÓRICO por data de entrega): ${totalRevenue.toFixed(2)}`);
        console.log(`📦 Total de pedidos: ${totalOrders}`);
        console.log(`📊 Ticket médio: ${averageOrderValue.toFixed(2)}`);

        // Receita por método de pagamento
        const revenueByPaymentMethod: Record<string, number> = {};
        filteredOrders.forEach(order => {
          const method = getPaymentMethodLabel(order.paymentMethod);
          revenueByPaymentMethod[method] = (revenueByPaymentMethod[method] || 0) + order.total;
        });

        // Receita por período (dinâmico baseado no filtro selecionado)
        const revenueByPeriod: Array<{ date: string; revenue: number; orders: number }> = [];
        
        console.log('📈 Calculando receita por período...');
        console.log('🔢 Pedidos filtrados para período:', filteredOrders.length);
        
        // Determinar número de períodos e formato baseado no filtro
        let periodsCount = 7;
        let dateFormat: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
        let groupBy = 'day';
        
        switch (selectedPeriod) {
          case 'today':
          case 'week':
            periodsCount = 7;
            dateFormat = { day: '2-digit', month: '2-digit' };
            groupBy = 'day';
            break;
          case 'month':
            periodsCount = 30;
            dateFormat = { day: '2-digit', month: '2-digit' };
            groupBy = 'day';
            break;
          case 'year':
          case 'all':
            periodsCount = 12;
            dateFormat = { month: 'short' };
            groupBy = 'month';
            break;
        }
        
        console.log(`📊 Configuração: período=${selectedPeriod}, groupBy=${groupBy}, periodsCount=${periodsCount}`);
        
        if (groupBy === 'day') {
          // Agrupar por dias
          for (let i = periodsCount - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.getFullYear() + '-' + 
              String(date.getMonth() + 1).padStart(2, '0') + '-' + 
              String(date.getDate()).padStart(2, '0');
            
            console.log(`📅 Verificando dia: ${dateStr} (histórico/passado)`);
            
            const dayOrders = filteredOrders.filter(order => {
              // Usar data de entrega agendada, não data de criação
              let relevantDate: Date;
              
              if (order.deliveryDateTime) {
                relevantDate = new Date(order.deliveryDateTime);
              } else if (order.deliveryDate) {
                relevantDate = new Date(order.deliveryDate + 'T12:00:00');
              } else {
                relevantDate = new Date(order.createdAt);
              }
              
              const orderDateStr = relevantDate.getFullYear() + '-' + 
                String(relevantDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(relevantDate.getDate()).padStart(2, '0');
              
              const matches = orderDateStr === dateStr;
              if (matches) {
                console.log(`  ✅ Pedido ${order.id.slice(-8)} corresponde: entrega=${orderDateStr}, valor=${order.total}`);
              }
              return matches;
            });
            
            const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
            console.log(`💰 Dia ${dateStr}: ${dayOrders.length} pedidos, receita=${dayRevenue}`);
            
            revenueByPeriod.push({
              date: date.toLocaleDateString('pt-BR', dateFormat),
              revenue: dayRevenue,
              orders: dayOrders.length
            });
          }
        } else {
          // Agrupar por meses
          for (let i = periodsCount - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const monthOrders = filteredOrders.filter(order => {
              // Usar data de entrega agendada, não data de criação
              let relevantDate: Date;
              
              if (order.deliveryDateTime) {
                relevantDate = new Date(order.deliveryDateTime);
              } else if (order.deliveryDate) {
                relevantDate = new Date(order.deliveryDate + 'T12:00:00');
              } else {
                relevantDate = new Date(order.createdAt);
              }
              
              return relevantDate.getFullYear() === year && relevantDate.getMonth() === month;
            });
            
            revenueByPeriod.push({
              date: date.toLocaleDateString('pt-BR', dateFormat),
              revenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
              orders: monthOrders.length
            });
          }
        }

        // Top 5 dias com mais vendas
        const dailyRevenue: Record<string, { revenue: number; orders: number }> = {};
        console.log('📊 Calculando top dias de vendas...');
        filteredOrders.forEach(order => {
          // Usar data de entrega agendada, não data de criação
          let relevantDate: Date;
          
          if (order.deliveryDateTime) {
            // Se tem deliveryDateTime, usar essa data
            relevantDate = new Date(order.deliveryDateTime);
          } else if (order.deliveryDate) {
            // Se tem deliveryDate, usar essa data
            relevantDate = new Date(order.deliveryDate + 'T12:00:00');
          } else {
            // Fallback para data de criação
            relevantDate = new Date(order.createdAt);
          }
          
          const localDateStr = relevantDate.getFullYear() + '-' + 
            String(relevantDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(relevantDate.getDate()).padStart(2, '0');
          
          console.log(`📅 Pedido ${order.id.slice(-8)}: entrega=${order.deliveryDate || 'hoje'}, data contabilizada=${localDateStr}, total=${order.total}`);
          
          if (!dailyRevenue[localDateStr]) {
            dailyRevenue[localDateStr] = { revenue: 0, orders: 0 };
          }
          dailyRevenue[localDateStr].revenue += order.total;
          dailyRevenue[localDateStr].orders += 1;
        });

        console.log('💰 Receita por dia de entrega:', dailyRevenue);

        const topSellingDays = Object.entries(dailyRevenue)
          .map(([date, data]) => ({
            date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR'),
            revenue: data.revenue,
            orders: data.orders
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        console.log('🏆 Top 5 dias por entrega:', topSellingDays);

        const finalStats = {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalDiscounts,
          revenueByPaymentMethod,
          revenueByPeriod,
          topSellingDays
        };

        console.log('📊 Estatísticas finais:', {
          totalRevenue,
          totalOrders,
          revenueByPeriodLength: revenueByPeriod.length,
          topSellingDaysLength: topSellingDays.length
        });
        console.log('📈 Receita por período final:', revenueByPeriod);

        setStats(finalStats);
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

      {/* Botões de Navegação Financeira */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/dre')}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 flex items-center gap-2"
        >
          <FileText size={20} />
          DRE - Demonstração do Resultado
        </button>
        <button
          onClick={() => navigate('/admin/fluxo-caixa')}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 flex items-center gap-2"
        >
          <ArrowUpDown size={20} />
          Fluxo de Caixa
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

      {/* Receita por Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Receita por Período - {getPeriodLabel(selectedPeriod)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`grid gap-2 ${stats.revenueByPeriod.length <= 7 ? 'grid-cols-7' : stats.revenueByPeriod.length <= 12 ? 'grid-cols-6' : 'grid-cols-4'}`}>
              {stats.revenueByPeriod.map((period, index) => {
                const maxRevenue = Math.max(...stats.revenueByPeriod.map(d => d.revenue));
                const height = maxRevenue > 0 ? (period.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="text-center">
                    <div className="mb-2 flex items-end justify-center" style={{ height: '120px' }}>
                      <div 
                        className="bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md w-8 transition-all duration-500"
                        style={{ height: `${height}%`, minHeight: period.revenue > 0 ? '8px' : '0px' }}
                        title={`${formatPrice(period.revenue)} - ${period.orders} pedidos`}
                      ></div>
                    </div>
                    <div className="text-xs font-medium">{period.date}</div>
                    <div className="text-xs text-gray-500">{formatPrice(period.revenue)}</div>
                    <div className="text-xs text-gray-400">{period.orders} pedidos</div>
                  </div>
                );
              })}
            </div>
            {stats.revenueByPeriod.every(period => period.revenue === 0) && (
              <div className="text-center py-8 text-gray-500">
                <TrendingDown size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma venda registrada no período selecionado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
