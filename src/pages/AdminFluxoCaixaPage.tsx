import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowUpDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Download,
  Filter,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { orderService } from '../services/orderService';
import { despesaService, type Despesa } from '../services/despesaService';
import type { Order } from '../types/order';

interface CashFlowEntry {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

interface CashFlowData {
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  fluxoDiario: CashFlowEntry[];
}

export default function AdminFluxoCaixaPage() {
  const navigate = useNavigate();
  const [cashFlowData, setCashFlowData] = useState<CashFlowData>({
    saldoInicial: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    saldoFinal: 0,
    fluxoDiario: []
  });
  const [loading, setLoading] = useState(true);
  
  // Datas padrão: último mês (criadas de forma segura)
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  
  // Formatação segura das datas padrão
  const formatDateSafe = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [startDate, setStartDate] = useState(formatDateSafe(lastMonth));
  const [endDate, setEndDate] = useState(formatDateSafe(today));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDateRange = () => {
    // Criar datas usando os componentes separados para evitar problemas de timezone
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
    
    return { startDate: start, endDate: end };
  };

  const generateDateRange = () => {
    const dates: string[] = [];
    
    // Função auxiliar para adicionar dias a uma data string
    const addDays = (dateStr: string, days: number): string => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day + days);
      const newYear = date.getFullYear();
      const newMonth = String(date.getMonth() + 1).padStart(2, '0');
      const newDay = String(date.getDate()).padStart(2, '0');
      return `${newYear}-${newMonth}-${newDay}`;
    };
    
    // Função para calcular diferença entre duas datas
    const daysDifference = (start: string, end: string): number => {
      const [startYear, startMonth, startDay] = start.split('-').map(Number);
      const [endYear, endMonth, endDay] = end.split('-').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    const totalDays = daysDifference(startDate, endDate);
    
    // Gerar datas sequencialmente
    for (let i = 0; i <= totalDays; i++) {
      dates.push(addDays(startDate, i));
    }
    
    console.log('=== DEBUG GERAÇÃO DE DATAS ===');
    console.log('Data inicial selecionada:', startDate);
    console.log('Data final selecionada:', endDate);
    console.log('Diferença em dias:', totalDays);
    console.log('Primeiro dia gerado:', dates[0]);
    console.log('Último dia gerado:', dates[dates.length - 1]);
    console.log('Total de datas geradas:', dates.length);
    console.log('Primeiras 3 datas:', dates.slice(0, 3));
    console.log('Últimas 3 datas:', dates.slice(-3));
    
    return dates;
  };

  useEffect(() => {
    const loadCashFlowData = async () => {
      try {
        setLoading(true);
        
        // Buscar pedidos e despesas em paralelo
        const [allOrders, allDespesas] = await Promise.all([
          orderService.getAllOrders(),
          despesaService.getAllDespesas()
        ]);
        
        // Filtrar pedidos válidos (não cancelados)
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        // Filtrar despesas pagas
        const paidDespesas = allDespesas.filter(despesa => 
          despesa.status === 'pago' && despesa.dataPagamento
        );
        
        const { startDate: rangeStart, endDate: rangeEnd } = getDateRange();
        
        // Filtrar pedidos no período baseado na data de entrega
        const filteredOrders = validOrders.filter(order => {
          let relevantDate: Date;
          
          if (order.deliveryDateTime) {
            // Se tem data e hora específica, usar diretamente
            relevantDate = new Date(order.deliveryDateTime);
          } else if (order.deliveryDate) {
            // Se tem apenas data, criar usando componentes
            const [year, month, day] = order.deliveryDate.split('-').map(Number);
            relevantDate = new Date(year, month - 1, day, 12, 0, 0);
          } else {
            // Fallback para data de criação
            relevantDate = new Date(order.createdAt);
          }
          
          return relevantDate >= rangeStart && relevantDate <= rangeEnd;
        });

        // Filtrar despesas no período baseado na data de pagamento
        const filteredDespesas = paidDespesas.filter(despesa => {
          if (!despesa.dataPagamento) return false;
          
          // Normalizar a data de pagamento para comparação
          let paymentDateStr: string;
          if (despesa.dataPagamento.includes('T')) {
            paymentDateStr = despesa.dataPagamento.split('T')[0];
          } else {
            paymentDateStr = despesa.dataPagamento;
          }
          
          // Criar data usando componentes para evitar timezone
          const [year, month, day] = paymentDateStr.split('-').map(Number);
          const paymentDate = new Date(year, month - 1, day, 12, 0, 0);
          
          return paymentDate >= rangeStart && paymentDate <= rangeEnd;
        });

        // Gerar range de datas
        const dateRange = generateDateRange();
        
        // Calcular saldo inicial (assumindo 0 por simplicidade)
        const saldoInicial = 0;
        let saldoAcumulado = saldoInicial;
        
        // Agrupar pedidos por data de entrega
        const ordersByDate = filteredOrders.reduce((acc, order) => {
          let dateKey: string;
          
          if (order.deliveryDateTime) {
            dateKey = new Date(order.deliveryDateTime).toISOString().split('T')[0];
          } else if (order.deliveryDate) {
            dateKey = order.deliveryDate;
          } else {
            dateKey = new Date(order.createdAt).toISOString().split('T')[0];
          }
          
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(order);
          return acc;
        }, {} as Record<string, Order[]>);

        // Agrupar despesas por data de pagamento
        const despesasByDate = filteredDespesas.reduce((acc, despesa) => {
          if (!despesa.dataPagamento) return acc;
          
          // Garantir que a data esteja no formato YYYY-MM-DD
          let dateKey: string;
          if (despesa.dataPagamento.includes('T')) {
            // Se já tem horário, extrair apenas a data
            dateKey = despesa.dataPagamento.split('T')[0];
          } else {
            // Se é apenas a data, usar diretamente
            dateKey = despesa.dataPagamento;
          }
          
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(despesa);
          return acc;
        }, {} as Record<string, Despesa[]>);

        // Criar fluxo diário
        const fluxoDiario: CashFlowEntry[] = dateRange.map(date => {
          const dayOrders = ordersByDate[date] || [];
          const dayDespesas = despesasByDate[date] || [];
          
          // Entradas (receitas das vendas)
          const entradas = dayOrders.reduce((sum, order) => sum + order.total, 0);
          
          // Saídas (despesas pagas)
          const saidas = dayDespesas.reduce((sum, despesa) => sum + despesa.valor, 0);
          
          const saldo = entradas - saidas;
          saldoAcumulado += saldo;
          
          return {
            date,
            entradas,
            saidas,
            saldo,
            saldoAcumulado
          };
        });

        const totalEntradas = fluxoDiario.reduce((sum, entry) => sum + entry.entradas, 0);
        const totalSaidas = fluxoDiario.reduce((sum, entry) => sum + entry.saidas, 0);
        const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

        setCashFlowData({
          saldoInicial,
          totalEntradas,
          totalSaidas,
          saldoFinal,
          fluxoDiario
        });

      } catch (error) {
        console.error('Erro ao carregar dados do fluxo de caixa:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCashFlowData();
  }, [startDate, endDate]);

  const exportToPDF = () => {
    // Implementar exportação para PDF futuramente
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/finance')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowUpDown size={28} />
              Fluxo de Caixa
            </h1>
            <p className="text-gray-600 text-sm">Controle de entradas e saídas financeiras</p>
          </div>
        </div>
        <button
          onClick={exportToPDF}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-orange-600 transition duration-200 flex items-center gap-2 shadow-md text-sm"
        >
          <Download size={18} />
          Exportar PDF
        </button>
      </div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          <Filter size={16} className="mr-1" />
          Período:
        </span>
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-600">De:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-600">Até:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Saldo Inicial</p>
                <p className="text-lg font-bold text-black">{formatPrice(cashFlowData.saldoInicial)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Entradas</p>
                <p className="text-lg font-bold text-black">{formatPrice(cashFlowData.totalEntradas)}</p>
              </div>
              <PlusCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Saídas</p>
                <p className="text-lg font-bold text-black">{formatPrice(cashFlowData.totalSaidas)}</p>
              </div>
              <MinusCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Saldo Final</p>
                <p className="text-lg font-bold text-black">
                  {formatPrice(cashFlowData.saldoFinal)}
                </p>
              </div>
              <TrendingUp className={`h-6 w-6 ${cashFlowData.saldoFinal >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo Diário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar size={18} />
            Fluxo de Caixa Diário - {formatDate(startDate)} até {formatDate(endDate)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Data</th>
                  <th className="text-right py-2 px-3 font-semibold text-black">Entradas</th>
                  <th className="text-right py-2 px-3 font-semibold text-black">Saídas</th>
                  <th className="text-right py-2 px-3 font-semibold text-black">Saldo Diário</th>
                  <th className="text-right py-2 px-3 font-semibold text-black">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.fluxoDiario.map((entry, index) => (
                  <tr key={entry.date} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-25' : ''}`}>
                    <td className="py-2 px-3 text-gray-900">{formatDate(entry.date)}</td>
                    <td className="py-2 px-3 text-right text-black font-medium">
                      {entry.entradas > 0 ? formatPrice(entry.entradas) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-black font-medium">
                      {entry.saidas > 0 ? formatPrice(entry.saidas) : '-'}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${entry.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(entry.saldo)}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${entry.saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(entry.saldoAcumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-red-50 to-orange-50 font-bold">
                  <td className="py-2 px-3 text-gray-900">TOTAL</td>
                  <td className="py-2 px-3 text-right text-black">{formatPrice(cashFlowData.totalEntradas)}</td>
                  <td className="py-2 px-3 text-right text-black">{formatPrice(cashFlowData.totalSaidas)}</td>
                  <td className={`py-2 px-3 text-right ${(cashFlowData.totalEntradas - cashFlowData.totalSaidas) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(cashFlowData.totalEntradas - cashFlowData.totalSaidas)}
                  </td>
                  <td className={`py-2 px-3 text-right ${cashFlowData.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(cashFlowData.saldoFinal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-3 rounded-lg">
            <h4 className="font-semibold text-black mb-2 text-sm">💡 Observações:</h4>
            <ul className="text-xs text-black space-y-1">
              <li>• <strong>Entradas:</strong> Receita total dos pedidos entregues (status confirmado)</li>
              <li>• <strong>Saídas:</strong> Despesas pagas registradas no sistema</li>
              <li>• <strong>Período:</strong> Baseado na data de entrega dos pedidos e data de pagamento das despesas</li>
              <li>• <strong>Saldo:</strong> Diferença entre entradas e saídas reais do período</li>
              <li>• <strong>Dados:</strong> Coletados diretamente do Firebase em tempo real</li>
              <li>• <strong>Períodos Futuros:</strong> Possível analisar datas futuras (sem dados aparecem zerados)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
