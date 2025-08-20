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
  Receipt,
  Target,
  FileText,
  ArrowUpDown,
  Percent,
  ShoppingCart,
  Scale
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { orderService } from '../services/orderService';
import { despesaService } from '../services/despesaService';
import type { Order } from '../types/order';

interface FinancialStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalExpenses: number;
  totalDiscounts: number;
  profitLoss: number;
  profitMargin: number;
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
    totalExpenses: 0,
    totalDiscounts: 0,
    profitLoss: 0,
    profitMargin: 0,
    revenueByPaymentMethod: {},
    revenueByPeriod: [],
    topSellingDays: []
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
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

  const getDateFilter = () => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    return (date: Date) => {
      const checkDate = new Date(date);
      return checkDate >= start && checkDate <= end;
    };
  };

  const getPeriodLabel = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (startDate === endDate) {
      return start.toLocaleDateString('pt-BR');
    }
    
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  };

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Carregando dados financeiros...');
        
        // Teste de conexão com Firebase - criar despesa de teste se não houver nenhuma
        try {
          const testExpenses = await despesaService.getAllDespesas();
          console.log('🧪 Teste de conexão - despesas encontradas:', testExpenses.length);
          
          if (testExpenses.length === 0) {
            console.log('🧪 Nenhuma despesa encontrada, criando despesa de teste...');
            // Criar uma despesa de teste
            const testDespesa = {
              descricao: 'Teste - Energia elétrica',
              categoria: 'Despesas Operacionais',
              subcategoria: 'Contas de luz',
              valor: 150.00,
              dataVencimento: '2025-08-15',
              status: 'pago' as const,
              recorrente: false,
              createdAt: new Date().toISOString(),
              criadoPor: {
                usuarioId: 'test-user',
                usuarioNome: 'Usuário Teste',
                usuarioEmail: 'teste@hotbox.com'
              }
            };
            
            await despesaService.createDespesa(testDespesa);
            console.log('✅ Despesa de teste criada com sucesso');
          }
        } catch (testError) {
          console.error('🧪 Erro no teste de conexão:', testError);
        }
        
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
        const dateFilter = getDateFilter();
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
          console.log(`  ✅ Incluído no período '${startDate} - ${endDate}': ${matchesFilter}`);
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
        console.log(`🎫 Total de descontos: ${totalDiscounts.toFixed(2)}`);

        // Receita por método de pagamento
        const revenueByPaymentMethod: Record<string, number> = {};
        filteredOrders.forEach(order => {
          const method = getPaymentMethodLabel(order.paymentMethod);
          revenueByPaymentMethod[method] = (revenueByPaymentMethod[method] || 0) + order.total;
        });

        // Receita por período (baseado no range de datas selecionado)
        const revenueByPeriod: Array<{ date: string; revenue: number; orders: number }> = [];
        
        console.log('📈 Calculando receita por período...');
        console.log('🔢 Pedidos filtrados para período:', filteredOrders.length);
        
        // Calcular diferença em dias entre startDate e endDate
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`📊 Período: ${startDate} a ${endDate} (${diffDays + 1} dias)`);
        
        // Gerar dados para cada dia no período
        for (let i = 0; i <= diffDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(start.getDate() + i);
          
          const dateStr = currentDate.getFullYear() + '-' + 
            String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(currentDate.getDate()).padStart(2, '0');
          
          console.log(`📅 Verificando dia: ${dateStr}`);
          
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
            date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            revenue: dayRevenue,
            orders: dayOrders.length
          });
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

        // Carregar despesas
        console.log('💳 Carregando despesas...');
        console.log('💳 Serviço de despesas:', despesaService);
        let totalExpenses = 0;
        try {
          const allExpenses = await despesaService.getAllDespesas();
          console.log(`💳 Total de despesas encontradas: ${allExpenses.length}`);
          console.log('💳 Despesas carregadas:', allExpenses);
          
          if (allExpenses && allExpenses.length > 0) {
            // Filtrar despesas pelo mesmo período dos pedidos
            const filteredExpenses = allExpenses.filter(expense => {
              const expenseDate = new Date(expense.dataVencimento);
              const matchesFilter = dateFilter(expenseDate);
              console.log(`💳 Despesa ${expense.id?.slice(-8)}: ${expense.descricao}, data: ${expense.dataVencimento}, filtro: ${matchesFilter}`);
              return matchesFilter;
            });
            
            totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.valor, 0);
            console.log(`💸 Despesas filtradas: ${filteredExpenses.length}`);
            console.log(`💸 Total de despesas no período: R$ ${totalExpenses.toFixed(2)}`);
          } else {
            console.log('💳 Nenhuma despesa encontrada no banco de dados');
          }
        } catch (despesaError) {
          console.error('❌ Erro ao carregar despesas:', despesaError);
          // Continuar sem despesas se houver erro
          totalExpenses = 0;
        }

        // Calcular lucro/prejuízo e margem
        const profitLoss = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;
        
        console.log(`💰 Lucro/Prejuízo: R$ ${profitLoss.toFixed(2)}`);
        console.log(`📈 Margem de lucro: ${profitMargin.toFixed(2)}%`);

        const finalStats = {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalExpenses,
          totalDiscounts,
          profitLoss,
          profitMargin,
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
  }, [startDate, endDate]);

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
      'Status': order.status
    }));

    // Adicionar sumário financeiro completo
    const summaryRows = [
      {
        'Data': '--- RESUMO FINANCEIRO ---',
        'Cliente': `Período: ${getPeriodLabel()}`,
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': 'Receita Total',
        'Cliente': formatPrice(stats.totalRevenue),
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': 'Despesas Total',
        'Cliente': formatPrice(stats.totalExpenses),
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': stats.profitLoss >= 0 ? 'Lucro' : 'Prejuízo',
        'Cliente': formatPrice(Math.abs(stats.profitLoss)),
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': 'Margem',
        'Cliente': `${stats.profitMargin.toFixed(1)}%`,
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': 'Total Pedidos',
        'Cliente': stats.totalOrders.toString(),
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': 'Ticket Médio',
        'Cliente': formatPrice(stats.averageOrderValue),
        'Total': '',
        'Pagamento': '',
        'Status': ''
      },
      {
        'Data': 'Total Descontos',
        'Cliente': formatPrice(stats.totalDiscounts),
        'Total': '',
        'Pagamento': '',
        'Status': ''
      }
    ];

    const allData = [...csvData, ...summaryRows];
    const headers = Object.keys(allData[0] || {});
    const csvContent = [
      headers.join(','),
      ...allData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-completo-${startDate}-${endDate}-${new Date().toISOString().split('T')[0]}.csv`;
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
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-red-400 hover:to-orange-400 transition duration-200 flex items-center gap-2"
        >
          <FileText size={20} />
          DRE - Demonstração do Resultado
        </button>
        <button
          onClick={() => navigate('/admin/balanco-patrimonial')}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-red-400 hover:to-orange-400 transition duration-200 flex items-center gap-2"
        >
          <Scale size={20} />
          Balanço Patrimonial
        </button>
        <button
          onClick={() => navigate('/admin/fluxo-caixa')}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-red-400 hover:to-orange-400 transition duration-200 flex items-center gap-2"
        >
          <ArrowUpDown size={20} />
          Fluxo de Caixa
        </button>
      </div>

      {/* Filtros de Data */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Calendar size={16} className="mr-2" />
          <span className="text-sm font-medium text-gray-700">Período:</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Data Inicial:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Data Final:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            Período selecionado: <strong>{getPeriodLabel()}</strong>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      {/* Primeira linha: Receita Total, Total Despesas, Prejuízo/Lucro, Margem */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-black">
                  {formatPrice(stats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-black">
                  {formatPrice(stats.totalExpenses)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Receipt className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stats.profitLoss >= 0 ? 'Lucro' : 'Prejuízo'}
                </p>
                <p className="text-2xl font-bold text-black">
                  {formatPrice(Math.abs(stats.profitLoss))}
                </p>
                <p className="text-xs text-gray-500 mt-1">receita - despesas</p>
              </div>
              <div className={`p-3 rounded-full ${stats.profitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {stats.profitLoss >= 0 ? 
                  <TrendingUp className="text-green-600" size={24} /> : 
                  <TrendingDown className="text-red-600" size={24} />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margem</p>
                <p className="text-2xl font-bold text-black">
                  {stats.profitMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">margem de lucro</p>
              </div>
              <div className={`p-3 rounded-full ${stats.profitMargin >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Percent className={stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha: Total de Pedidos, Ticket Médio, Total de Descontos */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-black">
                  {stats.totalOrders}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-100 to-orange-100 rounded-full">
                <ShoppingCart className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-black">
                  {formatPrice(stats.averageOrderValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">por pedido</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-100 to-orange-100 rounded-full">
                <Target className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Descontos</p>
                <p className="text-2xl font-bold text-black">
                  {formatPrice(stats.totalDiscounts)}
                </p>
                <p className="text-xs text-gray-500 mt-1">total concedido no período</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-100 to-orange-100 rounded-full">
                <Percent className="text-red-600" size={24} />
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
            Receita por Período - {getPeriodLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Layout simples para visualização diária */}
            <div>
              <div className="text-center mb-4 text-sm text-gray-600">
                Receita diária no período selecionado
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {stats.revenueByPeriod.map((period, index) => {
                  const maxRevenue = Math.max(...stats.revenueByPeriod.map(d => d.revenue));
                  const height = maxRevenue > 0 ? (period.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="text-center bg-white p-4 rounded-lg border">
                      <div className="mb-3 flex items-end justify-center" style={{ height: '80px' }}>
                        <div 
                          className="bg-gradient-to-t from-red-500 to-orange-500 rounded-t-md w-8 transition-all duration-500"
                          style={{ height: `${height}%`, minHeight: period.revenue > 0 ? '8px' : '0px' }}
                          title={`${formatPrice(period.revenue)} - ${period.orders} pedidos`}
                        ></div>
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">{period.date}</div>
                      <div className="text-lg font-bold text-red-600 mb-1">{formatPrice(period.revenue)}</div>
                      <div className="text-xs text-gray-500">{period.orders} pedidos</div>
                    </div>
                  );
                })}
              </div>
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
