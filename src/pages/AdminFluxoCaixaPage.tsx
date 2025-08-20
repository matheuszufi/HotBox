import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowUpDown,
  Download
} from 'lucide-react';
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
                <ArrowUpDown size={18} className="text-red-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Fluxo de Caixa</h1>
                </div>
              </div>
            </div>
            <button
              onClick={exportToPDF}
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
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">De:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Até:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {formatDate(startDate)} - {formatDate(endDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Geral Compacto */}
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Saldo Inicial</div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(cashFlowData.saldoInicial)}</div>
          </div>

          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Entradas</div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(cashFlowData.totalEntradas)}</div>
          </div>

          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Saídas</div>
            <div className="text-lg font-bold text-gray-900">{formatPrice(cashFlowData.totalSaidas)}</div>
          </div>

          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Saldo Final</div>
            <div className={`text-lg font-bold ${cashFlowData.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(cashFlowData.saldoFinal)}
            </div>
          </div>
        </div>

        {/* Fluxo Diário Empresarial */}
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wide">Fluxo de Caixa</h2>
          </div>

          <div className="p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 font-bold text-gray-900 uppercase text-xs">Data</th>
                    <th className="text-right py-2 font-bold text-gray-900 uppercase text-xs">Entradas</th>
                    <th className="text-right py-2 font-bold text-gray-900 uppercase text-xs">Saídas</th>
                    <th className="text-right py-2 font-bold text-gray-900 uppercase text-xs">Saldo Diário</th>
                    <th className="text-right py-2 font-bold text-gray-900 uppercase text-xs">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.fluxoDiario.map((entry) => (
                    <tr key={entry.date} className="hover:bg-gray-50">
                      <td className="py-1.5 text-gray-700">{formatDate(entry.date)}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900">
                        {entry.entradas > 0 ? formatPrice(entry.entradas) : '-'}
                      </td>
                      <td className="py-1.5 text-right font-medium text-gray-900">
                        {entry.saidas > 0 ? formatPrice(entry.saidas) : '-'}
                      </td>
                      <td className={`py-1.5 text-right font-medium ${entry.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(entry.saldo)}
                      </td>
                      <td className={`py-1.5 text-right font-bold ${entry.saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(entry.saldoAcumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                    <td className="py-2 font-bold text-sm">TOTAL</td>
                    <td className="py-2 text-right font-bold text-sm">{formatPrice(cashFlowData.totalEntradas)}</td>
                    <td className="py-2 text-right font-bold text-sm">{formatPrice(cashFlowData.totalSaidas)}</td>
                    <td className="py-2 text-right font-bold text-sm">
                      {formatPrice(cashFlowData.totalEntradas - cashFlowData.totalSaidas)}
                    </td>
                    <td className="py-2 text-right font-bold text-sm">
                      {formatPrice(cashFlowData.saldoFinal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Notas Compactas */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3 mt-4">
          <div className="text-xs text-gray-600">
            <strong>Notas:</strong> Demonstração baseada em dados reais de receitas (pedidos entregues) e despesas pagas. 
            Período analisado de {formatDate(startDate)} até {formatDate(endDate)}. 
            Entradas = receita de pedidos confirmados, Saídas = despesas efetivamente pagas.
          </div>
        </div>
      </div>
    </div>
  );
}
