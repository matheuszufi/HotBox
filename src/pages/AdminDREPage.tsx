import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  Download
} from 'lucide-react';
import { orderService } from '../services/orderService';

interface DREData {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  lucroOperacional: number;
  lucroLiquido: number;
  margemBruta: number;
  margemOperacional: number;
  margemLiquida: number;
}

export default function AdminDREPage() {
  const navigate = useNavigate();
  const [dreData, setDreData] = useState<DREData>({
    receitaBruta: 0,
    deducoes: 0,
    receitaLiquida: 0,
    custos: 0,
    lucroBruto: 0,
    despesasOperacionais: 0,
    lucroOperacional: 0,
    lucroLiquido: 0,
    margemBruta: 0,
    margemOperacional: 0,
    margemLiquida: 0
  });
  const [loading, setLoading] = useState(true);
  const [startMonth, setStartMonth] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPeriodLabel = () => {
    const startMonthParts = startMonth.split('-');
    const endMonthParts = endMonth.split('-');
    
    const startYear = parseInt(startMonthParts[0]);
    const startMonthNum = parseInt(startMonthParts[1]);
    const endYear = parseInt(endMonthParts[0]);
    const endMonthNum = parseInt(endMonthParts[1]);
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    if (startMonth === endMonth) {
      return `${monthNames[startMonthNum - 1]} ${startYear}`;
    }
    
    return `${monthNames[startMonthNum - 1]} ${startYear} - ${monthNames[endMonthNum - 1]} ${endYear}`;
  };

  const getDateFilter = () => {
    const startMonthParts = startMonth.split('-');
    const endMonthParts = endMonth.split('-');
    
    const startYear = parseInt(startMonthParts[0]);
    const startMonthNum = parseInt(startMonthParts[1]);
    const endYear = parseInt(endMonthParts[0]);
    const endMonthNum = parseInt(endMonthParts[1]);
    
    const start = new Date(startYear, startMonthNum - 1, 1);
    const end = new Date(endYear, endMonthNum, 0, 23, 59, 59);
    
    return (date: Date) => date >= start && date <= end;
  };

  useEffect(() => {
    const loadDREData = async () => {
      if (!startMonth || !endMonth) return;
      
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar pedidos válidos (não cancelados)
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        // Aplicar filtro de período baseado na data de entrega
        const dateFilter = getDateFilter();
        const filteredOrders = validOrders.filter(order => {
          let relevantDate: Date;
          
          if (order.deliveryDateTime) {
            relevantDate = new Date(order.deliveryDateTime);
          } else if (order.deliveryDate) {
            relevantDate = new Date(order.deliveryDate + 'T12:00:00');
          } else {
            relevantDate = new Date(order.createdAt);
          }
          
          return dateFilter(relevantDate);
        });

        // Calcular DRE
        const receitaBruta = filteredOrders.reduce((sum, order) => sum + (order.originalTotal || order.total), 0);
        const deducoes = filteredOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
        const receitaLiquida = receitaBruta - deducoes;
        
        // Estimativa de custos (60% da receita líquida - pode ser ajustado)
        const custos = receitaLiquida * 0.60;
        const lucroBruto = receitaLiquida - custos;
        
        // Estimativa de despesas operacionais (20% da receita líquida - pode ser ajustado)
        const despesasOperacionais = receitaLiquida * 0.20;
        const lucroOperacional = lucroBruto - despesasOperacionais;
        const lucroLiquido = lucroOperacional; // Assumindo sem impostos por simplicidade
        
        // Calcular margens
        const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
        const margemOperacional = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
        const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

        setDreData({
          receitaBruta,
          deducoes,
          receitaLiquida,
          custos,
          lucroBruto,
          despesasOperacionais,
          lucroOperacional,
          lucroLiquido,
          margemBruta,
          margemOperacional,
          margemLiquida
        });

      } catch (error) {
        console.error('Erro ao carregar dados da DRE:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDREData();
  }, [startMonth, endMonth]);

  const exportToPDF = () => {
    // Implementar exportação para PDF futuramente
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <FileText size={18} className="text-red-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">DRE - Demonstração do Resultado</h1>
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
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Até:</label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {getPeriodLabel()}
              </div>
            </div>
          </div>
        </div>

        {/* DRE Empresarial */}
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wide">DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h2>
          </div>

          <div className="p-3">
            <table className="w-full text-xs">
              <tbody>
                {/* RECEITAS */}
                <tr className="border-b border-gray-300">
                  <td className="py-2 font-bold text-gray-900 uppercase text-xs">RECEITAS</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">Receita Bruta de Vendas</td>
                  <td className="py-1.5 text-right text-gray-700">{formatPrice(dreData.receitaBruta * 0.85)}</td>
                  <td className="py-1.5 text-right text-gray-700">{formatPrice(dreData.receitaBruta * 0.15)}</td>
                  <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(dreData.receitaBruta)}</td>
                </tr>
                
                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Deduções</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice(dreData.deducoes)}</td>
                </tr>

                <tr className="bg-gray-100 border-t border-gray-300">
                  <td className="py-2 font-bold text-gray-900">RECEITA LÍQUIDA</td>
                  <td></td>
                  <td></td>
                  <td className="py-2 text-right font-bold text-gray-900">{formatPrice(dreData.receitaLiquida)}</td>
                </tr>

                {/* CUSTOS */}
                <tr className="border-b border-gray-300">
                  <td className="py-2 pt-4 font-bold text-gray-900 uppercase text-xs">CUSTOS</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Custo dos Produtos Vendidos</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice(dreData.custos)}</td>
                </tr>

                <tr className="bg-gray-100 border-t border-gray-300">
                  <td className="py-2 font-bold text-gray-900">LUCRO BRUTO</td>
                  <td></td>
                  <td className="py-2 text-right text-xs text-gray-700">{formatPercent(dreData.margemBruta)}</td>
                  <td className="py-2 text-right font-bold text-gray-900">{formatPrice(dreData.lucroBruto)}</td>
                </tr>

                {/* DESPESAS OPERACIONAIS */}
                <tr className="border-b border-gray-300">
                  <td className="py-2 pt-4 font-bold text-gray-900 uppercase text-xs">DESPESAS OPERACIONAIS</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Despesas Administrativas</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice(dreData.despesasOperacionais * 0.66)}</td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Despesas Comerciais</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice(dreData.despesasOperacionais * 0.25)}</td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Outras Despesas</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice(dreData.despesasOperacionais * 0.09)}</td>
                </tr>

                <tr className="bg-gray-100 border-t border-gray-300">
                  <td className="py-2 font-bold text-gray-900">LUCRO OPERACIONAL (EBIT)</td>
                  <td></td>
                  <td className="py-2 text-right text-xs text-gray-700">{formatPercent(dreData.margemOperacional)}</td>
                  <td className="py-2 text-right font-bold text-gray-900">{formatPrice(dreData.lucroOperacional)}</td>
                </tr>

                {/* RESULTADO FINANCEIRO */}
                <tr className="border-b border-gray-300">
                  <td className="py-2 pt-4 font-bold text-gray-900 uppercase text-xs">RESULTADO FINANCEIRO</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Despesas Financeiras</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice(dreData.lucroOperacional * 0.02)}</td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(+) Receitas Financeiras</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">+{formatPrice(dreData.lucroOperacional * 0.01)}</td>
                </tr>

                <tr className="bg-gray-100 border-t border-gray-300">
                  <td className="py-2 font-bold text-gray-900">LUCRO ANTES DO IR (LAIR)</td>
                  <td></td>
                  <td></td>
                  <td className="py-2 text-right font-bold text-gray-900">{formatPrice(dreData.lucroOperacional * 0.99)}</td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="py-1.5 text-gray-700 pl-3">(-) Provisão para IR e CSLL</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-medium text-gray-900">-{formatPrice((dreData.lucroOperacional * 0.99) * 0.34)}</td>
                </tr>

                {/* RESULTADO FINAL */}
                <tr className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                  <td className="py-2 font-bold text-sm">LUCRO LÍQUIDO FINAL</td>
                  <td></td>
                  <td className="py-2 text-right font-bold text-xs">{formatPercent(dreData.margemLiquida)}</td>
                  <td className="py-2 text-right font-bold text-sm">{formatPrice(dreData.lucroLiquido)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
