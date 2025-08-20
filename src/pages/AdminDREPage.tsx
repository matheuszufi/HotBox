import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  TrendingUp,
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
  const [selectedPeriodType, setSelectedPeriodType] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedSpecificPeriod, setSelectedSpecificPeriod] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<{value: string, label: string}[]>([]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPeriodLabel = (periodType: 'month' | 'quarter' | 'year') => {
    switch (periodType) {
      case 'month': return 'Mensal';
      case 'quarter': return 'Trimestral';
      case 'year': return 'Anual';
      default: return 'Mensal';
    }
  };

  const generateAvailablePeriods = (periodType: 'month' | 'quarter' | 'year') => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const periods: {value: string, label: string}[] = [];

    if (periodType === 'month') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentDate.getMonth() - i, 1);
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        periods.push({ value, label });
      }
    } else if (periodType === 'quarter') {
      // Últimos 8 trimestres
      for (let i = 7; i >= 0; i--) {
        const quarterDate = new Date(currentYear, currentDate.getMonth() - (i * 3), 1);
        const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
        const year = quarterDate.getFullYear();
        const value = `${year}-Q${quarter}`;
        const label = `${quarter}º Trimestre ${year}`;
        periods.push({ value, label });
      }
    } else if (periodType === 'year') {
      // Últimos 5 anos
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        periods.push({ value: String(year), label: String(year) });
      }
    }

    return periods;
  };

  const getDateFilterFromSpecific = (periodType: 'month' | 'quarter' | 'year', specificPeriod: string) => {
    if (!specificPeriod) return (_date: Date) => false;

    if (periodType === 'month') {
      const [year, month] = specificPeriod.split('-');
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      return (date: Date) => date >= start && date <= end;
    } else if (periodType === 'quarter') {
      const [year, quarterStr] = specificPeriod.split('-Q');
      const quarter = parseInt(quarterStr);
      const startMonth = (quarter - 1) * 3;
      const start = new Date(parseInt(year), startMonth, 1);
      const end = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59);
      return (date: Date) => date >= start && date <= end;
    } else if (periodType === 'year') {
      const year = parseInt(specificPeriod);
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      return (date: Date) => date >= start && date <= end;
    }

    return (_date: Date) => false;
  };

  useEffect(() => {
    // Quando o tipo de período muda, gerar períodos disponíveis e resetar seleção específica
    const periods = generateAvailablePeriods(selectedPeriodType);
    setAvailablePeriods(periods);
    if (periods.length > 0) {
      setSelectedSpecificPeriod(periods[periods.length - 1].value); // Selecionar o período mais recente
    }
  }, [selectedPeriodType]);

  useEffect(() => {
    const loadDREData = async () => {
      if (!selectedSpecificPeriod) return;
      
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar pedidos válidos (não cancelados)
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        // Aplicar filtro de período baseado na data de entrega
        const dateFilter = getDateFilterFromSpecific(selectedPeriodType, selectedSpecificPeriod);
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
  }, [selectedPeriodType, selectedSpecificPeriod]);

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
      {/* Header Compacto com cores da logo */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 shadow-sm border-b border-red-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/finance')}
                className="flex items-center gap-2 text-red-100 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded">
                  <FileText size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    DRE - Demonstração do Resultado
                  </h1>
                  <p className="text-red-100 text-xs">Análise financeira detalhada</p>
                </div>
              </div>
            </div>
            <button
              onClick={exportToPDF}
              className="bg-white/20 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-white/30 transition duration-200 flex items-center gap-1.5"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">

      {/* Filtros Compactos com cores da logo */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex gap-1">
              {[
                { value: 'month', label: 'Mensal' },
                { value: 'quarter', label: 'Trimestral' },
                { value: 'year', label: 'Anual' }
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriodType(period.value as 'month' | 'quarter' | 'year')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    selectedPeriodType === period.value
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {availablePeriods.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Específico:</span>
              <select
                value={selectedSpecificPeriod}
                onChange={(e) => setSelectedSpecificPeriod(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              >
                {availablePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* DRE */}
      <div className="grid gap-6">
        {/* Receitas */}
        {/* DRE Compacta - Layout de Tabela */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header da DRE com cores da logo */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 border-b border-red-700 px-4 py-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-white" />
              Demonstração do Resultado · {getPeriodLabel(selectedPeriodType)}
            </h2>
          </div>

          <div className="p-4">
            {/* Tabela de Resultados - Mais Compacta */}
            <table className="w-full text-sm">
              <tbody>
                {/* RECEITAS */}
                <tr className="border-b-2 border-red-300">
                  <td className="py-2 font-bold text-black uppercase text-xs tracking-wide">RECEITAS</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr>
                  <td className="py-1.5 text-gray-700">Receita Bruta de Vendas</td>
                  <td className="py-1.5 text-right text-gray-700">{formatPrice(dreData.receitaBruta * 0.85)}</td>
                  <td className="py-1.5 text-right text-gray-700">{formatPrice(dreData.receitaBruta * 0.15)}</td>
                  <td className="py-1.5 text-right font-semibold">{formatPrice(dreData.receitaBruta)}</td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Vendas de Produtos</td>
                  <td className="py-0.5 text-right text-xs">{formatPrice(dreData.receitaBruta * 0.85)}</td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Taxa de Entrega</td>
                  <td></td>
                  <td className="py-0.5 text-right text-xs">{formatPrice(dreData.receitaBruta * 0.15)}</td>
                  <td></td>
                </tr>

                <tr>
                  <td className="py-1.5 text-red-700">(-) Deduções</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold text-red-600">-{formatPrice(dreData.deducoes)}</td>
                </tr>

                <tr className="bg-gradient-to-r from-red-600/40 to-orange-500/40">
                  <td className="py-2 font-bold text-black">=  RECEITA LÍQUIDA</td>
                  <td></td>
                  <td></td>
                  <td className="py-2 text-right font-bold text-black text-base">{formatPrice(dreData.receitaLiquida)}</td>
                </tr>

                {/* CUSTOS */}
                <tr className="border-b-2 border-orange-300">
                  <td className="py-2 pt-4 font-bold text-black uppercase text-xs tracking-wide">CUSTOS</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                <tr>
                  <td className="py-1.5 text-gray-700">(-) Custo dos Produtos Vendidos</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold text-red-600">-{formatPrice(dreData.custos)}</td>
                </tr>

                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Matéria-Prima</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.custos * 0.6)}</td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Embalagens</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.custos * 0.15)}</td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Mão de Obra Direta</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.custos * 0.2)}</td>
                  <td></td>
                  <td></td>
                </tr>

                <tr className="bg-gradient-to-r from-red-600/40 to-orange-500/40">
                  <td className="py-2 font-bold text-black">=  LUCRO BRUTO</td>
                  <td></td>
                  <td className="py-2 text-right text-sm text-black">{formatPercent(dreData.margemBruta)}</td>
                  <td className="py-2 text-right font-bold text-black text-base">{formatPrice(dreData.lucroBruto)}</td>
                </tr>

                {/* DESPESAS OPERACIONAIS */}
                <tr className="border-b-2 border-red-300">
                  <td className="py-2 pt-4 font-bold text-black uppercase text-xs tracking-wide">DESPESAS OPERACIONAIS</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                <tr>
                  <td className="py-1.5 text-gray-700">(-) Despesas Administrativas</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold">-{formatPrice(dreData.despesasOperacionais * 0.66)}</td>
                </tr>

                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Salários e Encargos</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.despesasOperacionais * 0.35)}</td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Aluguel e Ocupação</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.despesasOperacionais * 0.2)}</td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Utilidades (Energia, Água)</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.despesasOperacionais * 0.11)}</td>
                  <td></td>
                  <td></td>
                </tr>

                <tr>
                  <td className="py-1.5 text-gray-700">(-) Despesas Comerciais</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold">-{formatPrice(dreData.despesasOperacionais * 0.25)}</td>
                </tr>

                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Marketing e Publicidade</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.despesasOperacionais * 0.15)}</td>
                  <td></td>
                  <td></td>
                </tr>
                
                <tr className="text-gray-600">
                  <td className="py-0.5 pl-3 text-xs">• Comissões</td>
                  <td className="py-0.5 text-right text-xs">-{formatPrice(dreData.despesasOperacionais * 0.1)}</td>
                  <td></td>
                  <td></td>
                </tr>

                <tr>
                  <td className="py-1.5 text-gray-700">(-) Outras Despesas</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold">-{formatPrice(dreData.despesasOperacionais * 0.09)}</td>
                </tr>

                <tr className="bg-gradient-to-r from-red-600/40 to-orange-500/40">
                  <td className="py-2 font-bold text-black">=  LUCRO OPERACIONAL (EBIT)</td>
                  <td></td>
                  <td className="py-2 text-right text-sm text-black">{formatPercent(dreData.margemOperacional)}</td>
                  <td className="py-2 text-right font-bold text-black text-base">{formatPrice(dreData.lucroOperacional)}</td>
                </tr>

                {/* RESULTADO FINANCEIRO */}
                <tr className="border-b-2 border-orange-300">
                  <td className="py-2 pt-4 font-bold text-black uppercase text-xs tracking-wide">RESULTADO FINANCEIRO</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                <tr>
                  <td className="py-1.5 text-red-700">(-) Despesas Financeiras</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold text-red-600">-{formatPrice(dreData.lucroOperacional * 0.02)}</td>
                </tr>

                <tr>
                  <td className="py-1.5 text-green-700">(+) Receitas Financeiras</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold text-green-600">+{formatPrice(dreData.lucroOperacional * 0.01)}</td>
                </tr>

                <tr className="bg-gradient-to-r from-red-600/40 to-orange-500/40">
                  <td className="py-2 font-bold text-black">=  LUCRO ANTES DO IR (LAIR)</td>
                  <td></td>
                  <td></td>
                  <td className="py-2 text-right font-bold text-black text-base">{formatPrice(dreData.lucroOperacional * 0.99)}</td>
                </tr>

                <tr>
                  <td className="py-1.5 text-gray-700">(-) Provisão para IR e CSLL</td>
                  <td></td>
                  <td></td>
                  <td className="py-1.5 text-right font-semibold text-red-600">-{formatPrice((dreData.lucroOperacional * 0.99) * 0.34)}</td>
                </tr>

                {/* RESULTADO FINAL */}
                <tr className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                  <td className="py-3 font-bold text-base">=  LUCRO LÍQUIDO FINAL</td>
                  <td></td>
                  <td className="py-3 text-right font-bold">{formatPercent(dreData.margemLiquida)}</td>
                  <td className={`py-3 text-right font-bold text-lg ${dreData.lucroLiquido >= 0 ? 'text-white' : 'text-red-200'}`}>
                    {formatPrice(dreData.lucroLiquido)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Indicadores Resumidos - Mais Compactos */}
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-600">Margem Bruta</div>
                <div className="font-bold text-black text-sm">{formatPercent(dreData.margemBruta)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Margem Operacional</div>
                <div className="font-bold text-black text-sm">{formatPercent(dreData.margemOperacional)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Margem Líquida</div>
                <div className={`font-bold text-sm ${dreData.margemLiquida >= 0 ? 'text-black' : 'text-red-600'}`}>
                  {formatPercent(dreData.margemLiquida)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Eficiência</div>
                <div className="font-bold text-black text-sm">{formatPercent(100 - ((dreData.custos + dreData.despesasOperacionais) / dreData.receitaLiquida) * 100)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Observações Compactas com cores da logo */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mt-3">
          <div className="text-sm text-gray-700">
            <strong className="text-red-700">Observações:</strong> 
            CPV estimado em 60% da receita líquida · 
            Despesas operacionais em 20% · 
            DRE baseada em datas de entrega · 
            Configure custos reais para maior precisão
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
