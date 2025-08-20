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
  FileText,
  ArrowUpDown,
  Percent,
  ShoppingCart
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
  const [selectedPeriod, setSelectedPeriod] = useState<'lastYear' | 'lastQuarter' | 'lastMonth' | 'lastWeek' | 'today' | 'currentWeek' | 'currentMonth' | 'currentQuarter' | 'currentYear' | 'total'>('currentMonth');
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
      
      case 'lastWeek':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7); // Domingo da semana passada
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Sábado da semana passada
        lastWeekEnd.setHours(23, 59, 59, 999);
        return (date: Date) => date >= lastWeekStart && date <= lastWeekEnd;
      
      case 'currentWeek':
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay()); // Domingo desta semana
        currentWeekStart.setHours(0, 0, 0, 0);
        const currentWeekEnd = new Date(now);
        currentWeekEnd.setHours(23, 59, 59, 999);
        return (date: Date) => date >= currentWeekStart && date <= currentWeekEnd;
      
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return (date: Date) => date >= lastMonth && date <= lastMonthEnd;
      
      case 'currentMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return (date: Date) => date >= startOfMonth && date <= endOfMonth;
      
      case 'lastQuarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const lastQuarterMonth = currentQuarter === 0 ? 9 : (currentQuarter - 1) * 3;
        const lastQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const lastQuarterStart = new Date(lastQuarterYear, lastQuarterMonth, 1);
        const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterMonth + 3, 0, 23, 59, 59, 999);
        return (date: Date) => date >= lastQuarterStart && date <= lastQuarterEnd;
      
      case 'currentQuarter':
        const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const currentQuarterStart = new Date(now.getFullYear(), currentQuarterMonth, 1);
        const currentQuarterEnd = new Date(now);
        currentQuarterEnd.setHours(23, 59, 59, 999);
        return (date: Date) => date >= currentQuarterStart && date <= currentQuarterEnd;
      
      case 'lastYear':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return (date: Date) => date >= lastYearStart && date <= lastYearEnd;
      
      case 'currentYear':
        const currentYearStart = new Date(now.getFullYear(), 0, 1);
        const currentYearEnd = new Date(now);
        currentYearEnd.setHours(23, 59, 59, 999);
        return (date: Date) => date >= currentYearStart && date <= currentYearEnd;
      
      case 'total':
        return () => true;
      
      default:
        return () => true;
    }
  };

  const getPeriodLabel = (period: typeof selectedPeriod) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'lastWeek': return 'Semana Anterior';
      case 'currentWeek': return 'Semana Atual';
      case 'lastMonth': return 'Mês Anterior';
      case 'currentMonth': return 'Mês Atual';
      case 'lastQuarter': return 'Trimestre Anterior';
      case 'currentQuarter': return 'Trimestre Atual';
      case 'lastYear': return 'Ano Anterior';
      case 'currentYear': return 'Ano Atual';
      case 'total': return 'Total';
      default: return 'Mês Atual';
    }
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
        console.log(`🎫 Total de descontos: ${totalDiscounts.toFixed(2)}`);

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
          case 'lastWeek':
          case 'currentWeek':
            periodsCount = 7;
            dateFormat = { day: '2-digit', month: '2-digit' };
            groupBy = 'day';
            break;
          case 'lastMonth':
          case 'currentMonth':
            periodsCount = 30;
            dateFormat = { day: '2-digit', month: '2-digit' };
            groupBy = 'day';
            break;
          case 'lastQuarter':
          case 'currentQuarter':
            periodsCount = 3;
            dateFormat = { month: 'short' };
            groupBy = 'month';
            break;
          case 'lastYear':
          case 'currentYear':
          case 'total':
            periodsCount = 12;
            dateFormat = { month: 'short' };
            groupBy = 'month';
            break;
        }
        
        console.log(`📊 Configuração: período=${selectedPeriod}, groupBy=${groupBy}, periodsCount=${periodsCount}`);
        
        if (groupBy === 'day') {
          // Agrupar por dias
          if (selectedPeriod === 'currentMonth') {
            // Para "mês atual", pegar todos os dias do mês (1 ao último dia)
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // Último dia do mês
            
            console.log(`📅 Gerando dias do mês atual: 1 a ${lastDayOfMonth}`);
            
            // Iterar de 1 até o último dia do mês
            for (let day = 1; day <= lastDayOfMonth; day++) {
              const date = new Date(year, month, day);
              const dateStr = date.getFullYear() + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                String(date.getDate()).padStart(2, '0');
              
              console.log(`📅 Verificando dia do mês: ${dateStr}`);
              
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
                date: date.toLocaleDateString('pt-BR', { day: '2-digit' }), // Apenas o dia
                revenue: dayRevenue,
                orders: dayOrders.length
              });
            }
          } else {
            // Para outros filtros, usar a lógica anterior (últimos X dias)
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
          }
        } else {
          // Agrupar por meses
          if (['lastYear', 'currentYear'].includes(selectedPeriod)) {
            // Para períodos anuais, gerar sempre todos os 12 meses (Janeiro a Dezembro)
            const currentDate = new Date();
            const targetYear = selectedPeriod === 'lastYear' ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
            
            for (let month = 0; month < 12; month++) {
              const monthDate = new Date(targetYear, month, 1);
              
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
                
                return relevantDate.getFullYear() === targetYear && relevantDate.getMonth() === month;
              });
              
              revenueByPeriod.push({
                date: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
                revenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
                orders: monthOrders.length
              });
            }
          } else {
            // Para outros períodos (trimestre, total), usar lógica baseada no período atual
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
      'Status': order.status
    }));

    // Adicionar sumário financeiro completo
    const summaryRows = [
      {
        'Data': '--- RESUMO FINANCEIRO ---',
        'Cliente': `Período: ${selectedPeriod}`,
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
    a.download = `relatorio-financeiro-completo-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Filter size={16} className="mr-2" />
          <span className="text-sm font-medium text-gray-700">Período:</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { value: 'lastYear', label: 'Ano Anterior' },
            { value: 'lastQuarter', label: 'Trimestre Anterior' },
            { value: 'lastMonth', label: 'Mês Anterior' },
            { value: 'lastWeek', label: 'Semana Anterior' },
            { value: 'today', label: 'Hoje' },
            { value: 'currentWeek', label: 'Semana Atual' },
            { value: 'currentMonth', label: 'Mês Atual' },
            { value: 'currentQuarter', label: 'Trimestre Atual' },
            { value: 'currentYear', label: 'Ano Atual' },
            { value: 'total', label: 'Total' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period.value
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Linha Superior: Receita Total, Despesa Total, Diferença */}
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
                <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatPrice(stats.totalExpenses)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
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
                <p className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatPrice(Math.abs(stats.profitLoss))}
                </p>
                <p className="text-xs text-gray-500 mt-1">receita - despesas</p>
              </div>
              <div className={`p-3 rounded-full ${stats.profitLoss >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                {stats.profitLoss >= 0 ? 
                  <TrendingUp className="text-blue-600" size={24} /> : 
                  <TrendingDown className="text-red-600" size={24} />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linha Inferior: Margem, Total de Pedidos, Ticket Médio */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margem</p>
                <p className={`text-2xl font-bold ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalOrders}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-600">
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
      </div>

      {/* Card separado para Total de Descontos */}
      <div className="grid md:grid-cols-1 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Descontos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatPrice(stats.totalDiscounts)}
                </p>
                <p className="text-xs text-gray-500 mt-1">total concedido no período</p>
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
            {/* Visualização baseada no tipo de período */}
            {selectedPeriod === 'total' ? (
              // Layout especial para Total - mostrar apenas o consolidado
              <div className="text-center py-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Total Consolidado</h3>
                  <p className="text-sm text-gray-500">Soma de todos os dados disponíveis</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {/* Receita Total */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatPrice(stats.totalRevenue)}
                      </div>
                      <div className="text-sm font-medium text-green-700 mb-1">Receita Total</div>
                      <div className="text-xs text-gray-600">Todos os períodos</div>
                    </div>
                  </div>
                  
                  {/* Total de Pedidos */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {stats.totalOrders.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm font-medium text-blue-700 mb-1">Total de Pedidos</div>
                      <div className="text-xs text-gray-600">Todos os períodos</div>
                    </div>
                  </div>
                  
                  {/* Ticket Médio */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {formatPrice(stats.averageOrderValue)}
                      </div>
                      <div className="text-sm font-medium text-orange-700 mb-1">Ticket Médio</div>
                      <div className="text-xs text-gray-600">Valor médio por pedido</div>
                    </div>
                  </div>
                </div>
                
                {/* Informações adicionais */}
                <div className="mt-8 text-center text-sm text-gray-500">
                  <p>Dados consolidados de todo o histórico disponível</p>
                  <p className="mt-1">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ) : ['lastYear', 'currentYear', 'lastQuarter', 'currentQuarter'].includes(selectedPeriod) ? (
              // Layout de grid para anos e trimestres (mostrar meses)
              <div>
                <div className="text-center mb-4 text-sm text-gray-600">
                  {['lastYear', 'currentYear'].includes(selectedPeriod) ? 'Receita por mês no ano' :
                   'Receita por mês no trimestre'}
                </div>
                <div className={`grid gap-4 ${
                  ['lastYear', 'currentYear'].includes(selectedPeriod) ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
                  'grid-cols-3'
                }`}>
                  {stats.revenueByPeriod.map((period, index) => {
                    const maxRevenue = Math.max(...stats.revenueByPeriod.map(d => d.revenue));
                    const height = maxRevenue > 0 ? (period.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={index} className="text-center bg-white p-4 rounded-lg border">
                        <div className="mb-3 flex items-end justify-center" style={{ height: '80px' }}>
                          <div 
                            className="bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md w-8 transition-all duration-500"
                            style={{ height: `${height}%`, minHeight: period.revenue > 0 ? '8px' : '0px' }}
                            title={`${formatPrice(period.revenue)} - ${period.orders} pedidos`}
                          ></div>
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-1">{period.date}</div>
                        <div className="text-lg font-bold text-orange-600 mb-1">{formatPrice(period.revenue)}</div>
                        <div className="text-xs text-gray-500">{period.orders} pedidos</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Layout de calendário para meses, semanas e hoje
              <div>
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-medium text-gray-600">
                  <div>Dom</div>
                  <div>Seg</div>
                  <div>Ter</div>
                  <div>Qua</div>
                  <div>Qui</div>
                  <div>Sex</div>
                  <div>Sáb</div>
                </div>
                
                {/* Dias do calendário */}
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const now = new Date();
                    const days = [];
                    const maxRevenue = Math.max(...stats.revenueByPeriod.map(d => d.revenue));
                    
                    // Determinar o período base para o calendário
                    let startDate: Date;
                    let endDate: Date;
                    
                    switch (selectedPeriod) {
                      case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + 6); // Mostrar semana do dia atual
                        break;
                        
                      case 'lastWeek':
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - now.getDay() - 7); // Domingo da semana passada
                        endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + 6); // Sábado da semana passada
                        break;
                        
                      case 'currentWeek':
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - now.getDay()); // Domingo desta semana
                        endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + 6); // Sábado desta semana
                        break;
                        
                      case 'lastMonth':
                        const lastMonth = now.getMonth() - 1;
                        const lastMonthYear = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
                        const adjustedMonth = lastMonth < 0 ? 11 : lastMonth;
                        startDate = new Date(lastMonthYear, adjustedMonth, 1);
                        endDate = new Date(lastMonthYear, adjustedMonth + 1, 0);
                        break;
                        
                      case 'currentMonth':
                      default:
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        break;
                    }
                    
                    // Ajustar para começar no domingo
                    const calendarStart = new Date(startDate);
                    calendarStart.setDate(startDate.getDate() - startDate.getDay());
                    
                    // Calcular quantos dias mostrar (sempre múltiplo de 7 para formar semanas completas)
                    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const weeksNeeded = Math.ceil((daysDiff + startDate.getDay()) / 7);
                    const totalDays = Math.min(weeksNeeded * 7, 42); // Máximo 6 semanas
                    
                    // Criar os dias do calendário
                    for (let i = 0; i < totalDays; i++) {
                      const currentDate = new Date(calendarStart);
                      currentDate.setDate(calendarStart.getDate() + i);
                      
                      const isInPeriod = currentDate >= startDate && currentDate <= endDate;
                      const dayNumber = currentDate.getDate();
                      const isToday = currentDate.toDateString() === now.toDateString();
                      
                      // Encontrar dados de receita para este dia
                      const dayData = stats.revenueByPeriod.find(period => {
                        // Para períodos mensais, comparar apenas o dia
                        if (['currentMonth', 'lastMonth'].includes(selectedPeriod)) {
                          const periodDay = parseInt(period.date);
                          return periodDay === dayNumber && isInPeriod;
                        }
                        // Para outros períodos, usar a data completa
                        return period.date === currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      });
                      
                      const revenue = dayData?.revenue || 0;
                      const orders = dayData?.orders || 0;
                      const height = maxRevenue > 0 ? (revenue / maxRevenue) * 60 : 0;
                      
                      days.push(
                        <div 
                          key={i} 
                          className={`relative p-2 text-center border rounded-lg min-h-[80px] ${
                            isInPeriod 
                              ? isToday 
                                ? 'bg-orange-100 border-orange-300' 
                                : 'bg-white border-gray-200' 
                              : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            isInPeriod 
                              ? isToday 
                                ? 'text-orange-600' 
                                : 'text-gray-700' 
                              : 'text-gray-400'
                          }`}>
                            {dayNumber}
                          </div>
                          
                          {isInPeriod && revenue > 0 && (
                            <>
                              <div 
                                className="bg-gradient-to-t from-orange-500 to-orange-300 rounded mx-auto mb-1"
                                style={{ 
                                  height: `${height}px`, 
                                  width: '20px',
                                  minHeight: '4px'
                                }}
                                title={`${formatPrice(revenue)} - ${orders} pedidos`}
                              ></div>
                              <div className="text-xs text-gray-600">
                                {formatPrice(revenue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {orders} pedidos
                              </div>
                            </>
                          )}
                          
                          {isInPeriod && revenue === 0 && (
                            <div className="text-xs text-gray-400 mt-2">
                              Sem vendas
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
            )}
            
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
