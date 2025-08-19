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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPeriodLabel = (period: typeof selectedPeriod) => {
    switch (period) {
      case 'week': return 'Última Semana';
      case 'month': return 'Último Mês';
      case 'quarter': return 'Último Trimestre';
      default: return 'Último Mês';
    }
  };

  const getDateRange = (period: typeof selectedPeriod) => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    return { startDate, endDate: now };
  };

  const generateDateRange = (startDate: Date, endDate: Date) => {
    const dates: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  useEffect(() => {
    const loadCashFlowData = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar pedidos válidos (não cancelados)
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        const { startDate, endDate } = getDateRange(selectedPeriod);
        
        // Filtrar pedidos no período baseado na data de entrega
        const filteredOrders = validOrders.filter(order => {
          let relevantDate: Date;
          
          if (order.deliveryDateTime) {
            relevantDate = new Date(order.deliveryDateTime);
          } else if (order.deliveryDate) {
            relevantDate = new Date(order.deliveryDate + 'T12:00:00');
          } else {
            relevantDate = new Date(order.createdAt);
          }
          
          return relevantDate >= startDate && relevantDate <= endDate;
        });

        // Gerar range de datas
        const dateRange = generateDateRange(startDate, endDate);
        
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

        // Criar fluxo diário
        const fluxoDiario: CashFlowEntry[] = dateRange.map(date => {
          const dayOrders = ordersByDate[date] || [];
          
          // Entradas (receitas das vendas)
          const entradas = dayOrders.reduce((sum, order) => sum + order.total, 0);
          
          // Saídas estimadas (custos operacionais - 70% das entradas)
          const saidas = entradas * 0.70;
          
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
  }, [selectedPeriod]);

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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/finance')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowUpDown size={32} />
              Fluxo de Caixa
            </h1>
            <p className="text-gray-600 mt-2">Controle de entradas e saídas financeiras</p>
          </div>
        </div>
        <button
          onClick={exportToPDF}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center gap-2"
        >
          <Download size={20} />
          Exportar PDF
        </button>
      </div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
          <Filter size={16} className="mr-1" />
          Período:
        </span>
        {[
          { value: 'week', label: 'Última Semana' },
          { value: 'month', label: 'Último Mês' },
          { value: 'quarter', label: 'Trimestre' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Inicial</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(cashFlowData.saldoInicial)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(cashFlowData.totalEntradas)}</p>
              </div>
              <PlusCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">{formatPrice(cashFlowData.totalSaidas)}</p>
              </div>
              <MinusCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Final</p>
                <p className={`text-2xl font-bold ${cashFlowData.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(cashFlowData.saldoFinal)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo Diário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Fluxo de Caixa Diário - {getPeriodLabel(selectedPeriod)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  <th className="text-right py-3 px-4 font-semibold text-green-700">Entradas</th>
                  <th className="text-right py-3 px-4 font-semibold text-red-700">Saídas</th>
                  <th className="text-right py-3 px-4 font-semibold text-blue-700">Saldo Diário</th>
                  <th className="text-right py-3 px-4 font-semibold text-purple-700">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.fluxoDiario.map((entry, index) => (
                  <tr key={entry.date} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-25' : ''}`}>
                    <td className="py-3 px-4 text-gray-900">{formatDate(entry.date)}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {entry.entradas > 0 ? formatPrice(entry.entradas) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">
                      {entry.saidas > 0 ? formatPrice(entry.saidas) : '-'}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${entry.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(entry.saldo)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${entry.saldoAcumulado >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {formatPrice(entry.saldoAcumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="py-3 px-4 text-gray-900">TOTAL</td>
                  <td className="py-3 px-4 text-right text-green-600">{formatPrice(cashFlowData.totalEntradas)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatPrice(cashFlowData.totalSaidas)}</td>
                  <td className={`py-3 px-4 text-right ${(cashFlowData.totalEntradas - cashFlowData.totalSaidas) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(cashFlowData.totalEntradas - cashFlowData.totalSaidas)}
                  </td>
                  <td className={`py-3 px-4 text-right ${cashFlowData.saldoFinal >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {formatPrice(cashFlowData.saldoFinal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Observações:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Entradas baseadas na receita total dos pedidos entregues</li>
              <li>• Saídas estimadas em 70% das entradas (custos operacionais)</li>
              <li>• Saldo inicial considerado como R$ 0,00</li>
              <li>• Para maior precisão, configure custos e despesas reais</li>
              <li>• Dados baseados na data de entrega dos pedidos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
