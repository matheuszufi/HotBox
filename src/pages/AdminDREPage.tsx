import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
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
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPeriodLabel = (period: typeof selectedPeriod) => {
    switch (period) {
      case 'month': return 'Último Mês';
      case 'quarter': return 'Último Trimestre';
      case 'year': return 'Último Ano';
      default: return 'Último Mês';
    }
  };

  const getDateFilter = (period: typeof selectedPeriod) => {
    const now = new Date();
    
    switch (period) {
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return (date: Date) => date >= monthAgo && date <= now;
      
      case 'quarter':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);
        return (date: Date) => date >= quarterAgo && date <= now;
      
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return (date: Date) => date >= yearAgo && date <= now;
      
      default:
        return () => true;
    }
  };

  useEffect(() => {
    const loadDREData = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filtrar pedidos válidos (não cancelados)
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        // Aplicar filtro de período baseado na data de entrega
        const dateFilter = getDateFilter(selectedPeriod);
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
  }, [selectedPeriod]);

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
              <FileText size={32} />
              DRE - Demonstração do Resultado do Exercício
            </h1>
            <p className="text-gray-600 mt-2">Análise de rentabilidade e resultado financeiro</p>
          </div>
        </div>
        <button
          onClick={exportToPDF}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-200 flex items-center gap-2"
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
          { value: 'month', label: 'Último Mês' },
          { value: 'quarter', label: 'Trimestre' },
          { value: 'year', label: 'Ano' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* DRE */}
      <div className="grid gap-6">
        {/* Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp size={20} />
              Receitas - {getPeriodLabel(selectedPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Receita Bruta de Vendas</span>
                <span className="text-lg font-bold text-green-600">{formatPrice(dreData.receitaBruta)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">(-) Deduções (Descontos)</span>
                <span className="text-lg font-bold text-red-600">-{formatPrice(dreData.deducoes)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                <span className="font-bold text-green-800">=  Receita Líquida</span>
                <span className="text-xl font-bold text-green-700">{formatPrice(dreData.receitaLiquida)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custos e Lucro Bruto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={20} />
              Custos e Lucro Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">(-) Custo dos Produtos Vendidos</span>
                <span className="text-lg font-bold text-red-600">-{formatPrice(dreData.custos)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg">
                <span className="font-bold text-blue-800">=  Lucro Bruto</span>
                <span className="text-xl font-bold text-blue-700">{formatPrice(dreData.lucroBruto)}</span>
              </div>
              <div className="text-sm text-gray-600">
                Margem Bruta: <span className="font-semibold">{formatPercent(dreData.margemBruta)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown size={20} />
              Despesas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">(-) Despesas Operacionais</span>
                <span className="text-lg font-bold text-red-600">-{formatPrice(dreData.despesasOperacionais)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-orange-50 px-4 rounded-lg">
                <span className="font-bold text-orange-800">=  Lucro Operacional</span>
                <span className="text-xl font-bold text-orange-700">{formatPrice(dreData.lucroOperacional)}</span>
              </div>
              <div className="text-sm text-gray-600">
                Margem Operacional: <span className="font-semibold">{formatPercent(dreData.margemOperacional)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado Final */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Percent size={20} />
              Resultado Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 bg-purple-50 px-4 rounded-lg border-2 border-purple-200">
                <span className="font-bold text-purple-800 text-lg">=  Lucro Líquido</span>
                <span className={`text-2xl font-bold ${dreData.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(dreData.lucroLiquido)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Margem Bruta</div>
                  <div className="text-xl font-bold">{formatPercent(dreData.margemBruta)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Margem Operacional</div>
                  <div className="text-xl font-bold">{formatPercent(dreData.margemOperacional)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Margem Líquida</div>
                  <div className={`text-xl font-bold ${dreData.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(dreData.margemLiquida)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardContent className="pt-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">📋 Observações:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Os custos são estimados em 60% da receita líquida</li>
                <li>• As despesas operacionais são estimadas em 20% da receita líquida</li>
                <li>• Para valores precisos, configure os custos reais no sistema</li>
                <li>• DRE baseada na data de entrega dos pedidos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
