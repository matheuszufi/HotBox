import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  Star,
  Percent,
  Award,
  Activity,
  BarChart3,
  Download
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { despesaService } from '../services/despesaService';
import { userService } from '../services/userService';

interface KPIMetrics {
  // Financeiros
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  revenueGrowth: number;
  
  // Operacionais
  totalOrders: number;
  ordersGrowth: number;
  averageOrdersPerDay: number;
  conversionRate: number;
  customerRetention: number;
  
  // Clientes
  totalCustomers: number;
  newCustomers: number;
  customerGrowth: number;
  customerLifetimeValue: number;
  averageOrderFrequency: number;
  
  // Produtos
  totalProducts: number;
  topSellingProduct: string;
  averageProductsPerOrder: number;
  productConversionRate: number;
  
  // Eficiência
  orderFulfillmentRate: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  operationalEfficiency: number;
}

export default function AdminIndicadoresPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    averageOrdersPerDay: 0,
    conversionRate: 0,
    customerRetention: 0,
    totalCustomers: 0,
    newCustomers: 0,
    customerGrowth: 0,
    customerLifetimeValue: 0,
    averageOrderFrequency: 0,
    totalProducts: 0,
    topSellingProduct: '',
    averageProductsPerOrder: 0,
    productConversionRate: 0,
    orderFulfillmentRate: 0,
    averageDeliveryTime: 0,
    customerSatisfaction: 0,
    operationalEfficiency: 0
  });

  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <TrendingUp size={16} className="text-green-600" />;
    if (value < 0) return <TrendingDown size={16} className="text-red-600" />;
    return <Activity size={16} className="text-gray-600" />;
  };

  const getPeriodDates = (selectedPeriod: string) => {
    const today = new Date();
    let start: Date;
    
    switch (selectedPeriod) {
      case '7d':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(startDate);
        return { start: new Date(startDate), end: new Date(endDate) };
    }
    
    return { start, end: today };
  };

  const calculateKPIs = async () => {
    try {
      setLoading(true);
      
      const { start, end } = getPeriodDates(period);
      
      // Carregar dados
      const [allOrders, allExpenses, usersData] = await Promise.all([
        orderService.getAllOrders(),
        despesaService.getAllDespesas(),
        userService.getAllUsers()
      ]);

      const allUsers = usersData.users || [];

      // Filtrar dados válidos
      const validOrders = allOrders.filter(order => 
        order.status !== 'cancelled' && order.status !== 'pending'
      );

      // Filtrar por período atual
      const currentOrders = validOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });

      // Calcular período anterior para comparação
      const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousEnd = start;

      const previousOrders = validOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= previousStart && orderDate < previousEnd;
      });

      // Filtrar despesas por período
      const currentExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.dataVencimento);
        return expenseDate >= start && expenseDate <= end;
      });

      // Filtrar novos usuários
      const newCustomers = allUsers.filter((user: any) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= start && userDate <= end;
      });

      // Calcular métricas financeiras
      const totalRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
      const totalExpenses = currentExpenses.reduce((sum, expense) => sum + expense.valor, 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const averageOrderValue = currentOrders.length > 0 ? totalRevenue / currentOrders.length : 0;

      // Calcular crescimento
      const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const ordersGrowth = previousOrders.length > 0 ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0;

      // Métricas operacionais
      const totalOrders = currentOrders.length;
      const averageOrdersPerDay = periodDays > 0 ? totalOrders / periodDays : 0;

      // Análise de produtos
      const productCounts: { [key: string]: number } = {};
      let totalProductsInOrders = 0;
      
      currentOrders.forEach(order => {
        order.items?.forEach(item => {
          const productName = (item as any).name || (item as any).productName || 'Produto sem nome';
          productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
          totalProductsInOrders += item.quantity;
        });
      });

      const topSellingProduct = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nenhum';
      
      const averageProductsPerOrder = totalOrders > 0 ? totalProductsInOrders / totalOrders : 0;

      // Métricas de eficiência
      const deliveredOrders = currentOrders.filter(order => order.status === 'delivered').length;
      const orderFulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

      // Customer Lifetime Value (estimativa simples)
      const totalCustomersWithOrders = new Set(validOrders.map(order => order.userEmail || order.userName)).size;
      const totalAllTimeRevenue = validOrders.reduce((sum, order) => sum + order.total, 0);
      const customerLifetimeValue = totalCustomersWithOrders > 0 ? totalAllTimeRevenue / totalCustomersWithOrders : 0;

      // Frequência média de pedidos
      const averageOrderFrequency = totalCustomersWithOrders > 0 ? validOrders.length / totalCustomersWithOrders : 0;

      // Crescimento de clientes
      const previousNewCustomers = allUsers.filter((user: any) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= previousStart && userDate < previousEnd;
      });
      
      const customerGrowth = previousNewCustomers.length > 0 ? 
        ((newCustomers.length - previousNewCustomers.length) / previousNewCustomers.length) * 100 : 0;

      setKpis({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        averageOrderValue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        averageOrdersPerDay,
        conversionRate: 75, // Estimativa
        customerRetention: 68, // Estimativa
        totalCustomers: allUsers.length,
        newCustomers: newCustomers.length,
        customerGrowth,
        customerLifetimeValue,
        averageOrderFrequency,
        totalProducts: Object.keys(productCounts).length,
        topSellingProduct,
        averageProductsPerOrder,
        productConversionRate: 82, // Estimativa
        orderFulfillmentRate,
        averageDeliveryTime: 35, // Estimativa em minutos
        customerSatisfaction: 4.2, // Estimativa
        operationalEfficiency: orderFulfillmentRate > 90 ? 95 : 78 // Baseado na taxa de entrega
      });

    } catch (error) {
      console.error('Erro ao calcular KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateKPIs();
  }, [period, startDate, endDate]);

  const exportReport = () => {
    const reportData = {
      periodo: period === 'custom' ? `${startDate} - ${endDate}` : period,
      geradoEm: new Date().toISOString(),
      kpis: kpis
    };

    const csvContent = [
      'Relatório de Indicadores HotBox',
      `Período: ${reportData.periodo}`,
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      'INDICADORES FINANCEIROS',
      `Receita Total,${formatPrice(kpis.totalRevenue)}`,
      `Despesas Total,${formatPrice(kpis.totalExpenses)}`,
      `Lucro Líquido,${formatPrice(kpis.netProfit)}`,
      `Margem de Lucro,${kpis.profitMargin.toFixed(1)}%`,
      `Ticket Médio,${formatPrice(kpis.averageOrderValue)}`,
      `Crescimento da Receita,${formatPercent(kpis.revenueGrowth)}`,
      '',
      'INDICADORES OPERACIONAIS',
      `Total de Pedidos,${kpis.totalOrders}`,
      `Crescimento de Pedidos,${formatPercent(kpis.ordersGrowth)}`,
      `Pedidos por Dia,${kpis.averageOrdersPerDay.toFixed(1)}`,
      `Taxa de Entrega,${kpis.orderFulfillmentRate.toFixed(1)}%`,
      `Produtos por Pedido,${kpis.averageProductsPerOrder.toFixed(1)}`,
      `Produto Mais Vendido,${kpis.topSellingProduct}`,
      '',
      'INDICADORES DE CLIENTES',
      `Total de Clientes,${kpis.totalCustomers}`,
      `Novos Clientes,${kpis.newCustomers}`,
      `Crescimento de Clientes,${formatPercent(kpis.customerGrowth)}`,
      `Valor Vitalício do Cliente,${formatPrice(kpis.customerLifetimeValue)}`,
      `Frequência Média de Pedidos,${kpis.averageOrderFrequency.toFixed(1)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicadores-hotbox-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b border-gray-300">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/finance')}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="inline mr-1" />
                Voltar
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Carregando indicadores...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Empresarial Compacto */}
      <div className="bg-white shadow-sm border-b border-gray-300">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/finance')}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="inline mr-1" />
                Voltar
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-red-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Indicadores da Empresa</h1>
                </div>
              </div>
            </div>
            <button
              onClick={exportReport}
              className="bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-4">
        {/* Filtros Compactos */}
        <div className="bg-white border border-gray-300 rounded p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {[
                  { value: '7d', label: '7 dias' },
                  { value: '30d', label: '30 dias' },
                  { value: '90d', label: '90 dias' },
                  { value: 'custom', label: 'Personalizado' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value as any)}
                    className={`px-2 py-1 rounded text-xs transition duration-200 ${
                      period === value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {period === 'custom' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">De:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                  <label className="text-xs text-gray-600">Até:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPIs Principais Compactos */}
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          {/* Receita Total */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="p-2 bg-green-100 rounded">
                <DollarSign size={16} className="text-green-600" />
              </div>
              <div className="flex items-center gap-1">
                {getGrowthIcon(kpis.revenueGrowth)}
                <span className={`text-xs font-medium ${getGrowthColor(kpis.revenueGrowth)}`}>
                  {formatPercent(kpis.revenueGrowth)}
                </span>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(kpis.totalRevenue)}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Receita Total</div>
          </div>

          {/* Lucro Líquido */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <div className={`p-2 rounded ${kpis.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {kpis.netProfit >= 0 ? 
                  <TrendingUp size={16} className="text-green-600" /> : 
                  <TrendingDown size={16} className="text-red-600" />
                }
              </div>
              <div className="flex items-center gap-1">
                <Percent size={12} className={kpis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'} />
                <span className={`text-xs font-medium ${kpis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(Math.abs(kpis.netProfit))}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">
              {kpis.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
            </div>
          </div>

          {/* Total de Pedidos */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="p-2 bg-blue-100 rounded">
                <ShoppingCart size={16} className="text-blue-600" />
              </div>
              <div className="flex items-center gap-1">
                {getGrowthIcon(kpis.ordersGrowth)}
                <span className={`text-xs font-medium ${getGrowthColor(kpis.ordersGrowth)}`}>
                  {formatPercent(kpis.ordersGrowth)}
                </span>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{kpis.totalOrders}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Total de Pedidos</div>
          </div>

          {/* Ticket Médio */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="p-2 bg-purple-100 rounded">
                <Target size={16} className="text-purple-600" />
              </div>
              <div className="flex items-center gap-1">
                <Award size={12} className="text-orange-600" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(kpis.averageOrderValue)}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Ticket Médio</div>
          </div>
        </div>

        {/* Seções de Indicadores Detalhados */}
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* Indicadores Financeiros */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wide">Indicadores Financeiros</h2>
            </div>
            <div className="p-3">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Despesas Total</td>
                    <td className="py-1.5 text-right font-medium text-red-600">{formatPrice(kpis.totalExpenses)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Margem de Lucro</td>
                    <td className={`py-1.5 text-right font-medium ${kpis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpis.profitMargin.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Crescimento da Receita</td>
                    <td className={`py-1.5 text-right font-medium ${getGrowthColor(kpis.revenueGrowth)}`}>
                      {formatPercent(kpis.revenueGrowth)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">ROI Estimado</td>
                    <td className="py-1.5 text-right font-medium text-blue-600">
                      {kpis.totalExpenses > 0 ? ((kpis.netProfit / kpis.totalExpenses) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Indicadores Operacionais */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wide">Indicadores Operacionais</h2>
            </div>
            <div className="p-3">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Pedidos por Dia</td>
                    <td className="py-1.5 text-right font-medium text-blue-600">{kpis.averageOrdersPerDay.toFixed(1)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Taxa de Entrega</td>
                    <td className="py-1.5 text-right font-medium text-green-600">{kpis.orderFulfillmentRate.toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Tempo Médio de Entrega</td>
                    <td className="py-1.5 text-right font-medium text-orange-600">{kpis.averageDeliveryTime} min</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Eficiência Operacional</td>
                    <td className="py-1.5 text-right font-medium text-purple-600">{kpis.operationalEfficiency.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* Indicadores de Clientes */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wide">Indicadores de Clientes</h2>
            </div>
            <div className="p-3">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Total de Clientes</td>
                    <td className="py-1.5 text-right font-medium text-purple-600">{kpis.totalCustomers}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Novos Clientes</td>
                    <td className="py-1.5 text-right font-medium text-green-600">
                      {kpis.newCustomers} ({formatPercent(kpis.customerGrowth)})
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Lifetime Value</td>
                    <td className="py-1.5 text-right font-medium text-blue-600">{formatPrice(kpis.customerLifetimeValue)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Frequência de Pedidos</td>
                    <td className="py-1.5 text-right font-medium text-orange-600">{kpis.averageOrderFrequency.toFixed(1)}x</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Taxa de Retenção</td>
                    <td className="py-1.5 text-right font-medium text-green-600">{kpis.customerRetention.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Indicadores de Produtos */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wide">Indicadores de Produtos</h2>
            </div>
            <div className="p-3">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Total de Produtos</td>
                    <td className="py-1.5 text-right font-medium text-orange-600">{kpis.totalProducts}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Mais Vendido</td>
                    <td className="py-1.5 text-right font-medium text-green-600 truncate" title={kpis.topSellingProduct}>
                      {kpis.topSellingProduct}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Produtos por Pedido</td>
                    <td className="py-1.5 text-right font-medium text-blue-600">{kpis.averageProductsPerOrder.toFixed(1)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Taxa de Conversão</td>
                    <td className="py-1.5 text-right font-medium text-purple-600">{kpis.productConversionRate.toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700">Satisfação do Cliente</td>
                    <td className="py-1.5 text-right font-medium text-yellow-600 flex items-center justify-end gap-1">
                      <Star size={12} className="text-yellow-500 fill-current" />
                      {kpis.customerSatisfaction.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resumo de Performance */}
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wide">Resumo de Performance</h2>
          </div>
          <div className="p-4">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600 mb-1">
                  {kpis.revenueGrowth >= 0 ? 'Crescimento' : 'Declínio'}
                </div>
                <div className="text-xs text-gray-600">
                  Receita {kpis.revenueGrowth >= 0 ? 'aumentou' : 'diminuiu'} {Math.abs(kpis.revenueGrowth).toFixed(1)}% no período
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <Target size={20} className="text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-600 mb-1">
                  {kpis.orderFulfillmentRate >= 90 ? 'Excelente' : kpis.orderFulfillmentRate >= 70 ? 'Bom' : 'Melhorar'}
                </div>
                <div className="text-xs text-gray-600">
                  Taxa de entrega de {kpis.orderFulfillmentRate.toFixed(1)}%
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-600 mb-1">
                  {kpis.newCustomers} Novos
                </div>
                <div className="text-xs text-gray-600">
                  Clientes adquiridos no período
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded p-3">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">📊 Insights e Recomendações</h4>
              <div className="text-xs text-gray-700 space-y-1">
                {kpis.profitMargin < 10 && (
                  <div>• Margem de lucro baixa - considere revisar custos ou aumentar preços</div>
                )}
                {kpis.averageOrderValue < 30 && (
                  <div>• Ticket médio pode ser melhorado com upselling e combos</div>
                )}
                {kpis.orderFulfillmentRate < 90 && (
                  <div>• Taxa de entrega pode ser otimizada para melhorar satisfação</div>
                )}
                {kpis.customerGrowth > 20 && (
                  <div>• Excelente crescimento de clientes - considere estratégias de retenção</div>
                )}
                {kpis.revenueGrowth > 15 && (
                  <div>• Crescimento forte - considere expandir operações</div>
                )}
                <div>• Produto destaque: {kpis.topSellingProduct} - considere variações ou promoções</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
