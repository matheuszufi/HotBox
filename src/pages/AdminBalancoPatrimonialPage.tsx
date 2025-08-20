import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Scale,
  Download
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { despesaService } from '../services/despesaService';

interface BalancoPatrimonialData {
  // ATIVO
  ativoCirculante: {
    caixaEquivalentes: number;
    contasReceber: number;
    estoque: number;
    adiantamentos: number;
    total: number;
  };
  ativoNaoCirculante: {
    imobilizado: number;
    intangivel: number;
    investimentos: number;
    total: number;
  };
  ativoTotal: number;

  // PASSIVO
  passivoCirculante: {
    fornecedores: number;
    salarios: number;
    impostos: number;
    emprestimos: number;
    total: number;
  };
  passivoNaoCirculante: {
    financiamentos: number;
    provisoes: number;
    total: number;
  };
  
  // PATRIMÔNIO LÍQUIDO
  patrimonioLiquido: {
    capitalSocial: number;
    reservas: number;
    lucrosAcumulados: number;
    total: number;
  };
  
  passivoPatrimonioTotal: number;
}

export default function AdminBalancoPatrimonialPage() {
  const navigate = useNavigate();
  const [balancoData, setBalancoData] = useState<BalancoPatrimonialData>({
    ativoCirculante: {
      caixaEquivalentes: 0,
      contasReceber: 0,
      estoque: 0,
      adiantamentos: 0,
      total: 0
    },
    ativoNaoCirculante: {
      imobilizado: 0,
      intangivel: 0,
      investimentos: 0,
      total: 0
    },
    ativoTotal: 0,
    passivoCirculante: {
      fornecedores: 0,
      salarios: 0,
      impostos: 0,
      emprestimos: 0,
      total: 0
    },
    passivoNaoCirculante: {
      financiamentos: 0,
      provisoes: 0,
      total: 0
    },
    patrimonioLiquido: {
      capitalSocial: 0,
      reservas: 0,
      lucrosAcumulados: 0,
      total: 0
    },
    passivoPatrimonioTotal: 0
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
    const loadBalancoData = async () => {
      if (!startMonth || !endMonth) return;
      
      try {
        setLoading(true);
        console.log('🔄 Carregando dados do Balanço Patrimonial...');
        
        // Carregar pedidos
        const allOrders = await orderService.getAllOrders();
        const validOrders = allOrders.filter(order => 
          order.status !== 'cancelled' && order.status !== 'pending'
        );
        
        // Aplicar filtro de período
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

        // Carregar despesas
        let allExpenses: any[] = [];
        try {
          allExpenses = await despesaService.getAllDespesas();
          const filteredExpenses = allExpenses.filter(expense => {
            const expenseDate = new Date(expense.dataVencimento);
            return dateFilter(expenseDate);
          });
          allExpenses = filteredExpenses;
        } catch (error) {
          console.warn('Erro ao carregar despesas:', error);
          allExpenses = [];
        }

        // Calcular receita e lucro acumulado
        const receitaTotal = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const despesasTotal = allExpenses.reduce((sum, expense) => sum + expense.valor, 0);
        const lucroLiquido = receitaTotal - despesasTotal;

        console.log(`💰 Receita Total: ${receitaTotal}`);
        console.log(`💸 Despesas Total: ${despesasTotal}`);
        console.log(`📊 Lucro Líquido: ${lucroLiquido}`);

        // === CÁLCULO DO BALANÇO PATRIMONIAL ===
        
        // ATIVO CIRCULANTE
        const caixaEquivalentes = Math.max(lucroLiquido * 0.3, 5000); // 30% do lucro ou mínimo R$ 5.000
        const contasReceber = receitaTotal * 0.15; // 15% da receita (vendas a prazo)
        const estoque = receitaTotal * 0.25; // 25% da receita (estoque de ingredientes)
        const adiantamentos = receitaTotal * 0.05; // 5% da receita (adiantamentos)
        
        const ativoCirculanteTotal = caixaEquivalentes + contasReceber + estoque + adiantamentos;

        // ATIVO NÃO CIRCULANTE
        const imobilizado = 150000; // Equipamentos, móveis, utensílios da cozinha
        const intangivel = 25000; // Software, marca, site
        const investimentos = Math.max(lucroLiquido * 0.1, 0); // 10% do lucro em investimentos
        
        const ativoNaoCirculanteTotal = imobilizado + intangivel + investimentos;
        const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;

        // PASSIVO CIRCULANTE
        const fornecedores = despesasTotal * 0.4; // 40% das despesas são fornecedores
        const salarios = despesasTotal * 0.3; // 30% das despesas são salários
        const impostos = receitaTotal * 0.15; // 15% da receita em impostos
        const emprestimos = 20000; // Empréstimos de curto prazo
        
        const passivoCirculanteTotal = fornecedores + salarios + impostos + emprestimos;

        // PASSIVO NÃO CIRCULANTE
        const financiamentos = 80000; // Financiamentos de longo prazo
        const provisoes = receitaTotal * 0.05; // 5% da receita em provisões
        
        const passivoNaoCirculanteTotal = financiamentos + provisoes;

        // PATRIMÔNIO LÍQUIDO
        const capitalSocial = 100000; // Capital inicial investido
        const reservas = Math.max(lucroLiquido * 0.2, 0); // 20% do lucro em reservas
        const lucrosAcumulados = Math.max(lucroLiquido * 0.8, 0); // 80% do lucro acumulado
        
        const patrimonioLiquidoTotal = capitalSocial + reservas + lucrosAcumulados;
        const passivoPatrimonioTotal = passivoCirculanteTotal + passivoNaoCirculanteTotal + patrimonioLiquidoTotal;

        console.log('📋 Balanço Patrimonial Calculado:');
        console.log(`  Ativo Total: ${ativoTotal}`);
        console.log(`  Passivo + PL Total: ${passivoPatrimonioTotal}`);

        setBalancoData({
          ativoCirculante: {
            caixaEquivalentes,
            contasReceber,
            estoque,
            adiantamentos,
            total: ativoCirculanteTotal
          },
          ativoNaoCirculante: {
            imobilizado,
            intangivel,
            investimentos,
            total: ativoNaoCirculanteTotal
          },
          ativoTotal,
          passivoCirculante: {
            fornecedores,
            salarios,
            impostos,
            emprestimos,
            total: passivoCirculanteTotal
          },
          passivoNaoCirculante: {
            financiamentos,
            provisoes,
            total: passivoNaoCirculanteTotal
          },
          patrimonioLiquido: {
            capitalSocial,
            reservas,
            lucrosAcumulados,
            total: patrimonioLiquidoTotal
          },
          passivoPatrimonioTotal
        });

      } catch (error) {
        console.error('Erro ao carregar dados do Balanço Patrimonial:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalancoData();
  }, [startMonth, endMonth]);

  const exportToPDF = () => {
    // Implementar exportação para PDF futuramente
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
                <Scale size={18} className="text-red-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Balanço Patrimonial</h1>
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

        {/* Balanço Patrimonial Empresarial */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* ATIVO */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wide">ATIVO</h2>
            </div>

            <div className="p-3">
              <table className="w-full text-xs">
                <tbody>
                  {/* ATIVO CIRCULANTE */}
                  <tr className="border-b border-gray-300">
                    <td className="py-2 font-bold text-gray-900 uppercase text-xs">ATIVO CIRCULANTE</td>
                    <td></td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Caixa e Equivalentes</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoCirculante.caixaEquivalentes)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Contas a Receber</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoCirculante.contasReceber)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Estoque</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoCirculante.estoque)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Adiantamentos</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoCirculante.adiantamentos)}</td>
                  </tr>

                  <tr className="bg-gray-100 border-t border-gray-300">
                    <td className="py-2 font-bold text-gray-900">TOTAL ATIVO CIRCULANTE</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatPrice(balancoData.ativoCirculante.total)}</td>
                  </tr>

                  {/* ATIVO NÃO CIRCULANTE */}
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pt-4 font-bold text-gray-900 uppercase text-xs">ATIVO NÃO CIRCULANTE</td>
                    <td></td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Imobilizado</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoNaoCirculante.imobilizado)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Intangível</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoNaoCirculante.intangivel)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Investimentos</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.ativoNaoCirculante.investimentos)}</td>
                  </tr>

                  <tr className="bg-gray-100 border-t border-gray-300">
                    <td className="py-2 font-bold text-gray-900">TOTAL ATIVO NÃO CIRCULANTE</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatPrice(balancoData.ativoNaoCirculante.total)}</td>
                  </tr>

                  {/* TOTAL ATIVO */}
                  <tr className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                    <td className="py-2 font-bold text-sm">TOTAL DO ATIVO</td>
                    <td className="py-2 text-right font-bold text-sm">{formatPrice(balancoData.ativoTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PASSIVO E PATRIMÔNIO LÍQUIDO */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 border-b">
              <h2 className="text-sm font-bold uppercase tracking-wide">PASSIVO E PATRIMÔNIO LÍQUIDO</h2>
            </div>

            <div className="p-3">
              <table className="w-full text-xs">
                <tbody>
                  {/* PASSIVO CIRCULANTE */}
                  <tr className="border-b border-gray-300">
                    <td className="py-2 font-bold text-gray-900 uppercase text-xs">PASSIVO CIRCULANTE</td>
                    <td></td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Fornecedores</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.passivoCirculante.fornecedores)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Salários a Pagar</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.passivoCirculante.salarios)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Impostos a Pagar</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.passivoCirculante.impostos)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Empréstimos</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.passivoCirculante.emprestimos)}</td>
                  </tr>

                  <tr className="bg-gray-100 border-t border-gray-300">
                    <td className="py-2 font-bold text-gray-900">TOTAL PASSIVO CIRCULANTE</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatPrice(balancoData.passivoCirculante.total)}</td>
                  </tr>

                  {/* PASSIVO NÃO CIRCULANTE */}
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pt-4 font-bold text-gray-900 uppercase text-xs">PASSIVO NÃO CIRCULANTE</td>
                    <td></td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Financiamentos</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.passivoNaoCirculante.financiamentos)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Provisões</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.passivoNaoCirculante.provisoes)}</td>
                  </tr>

                  <tr className="bg-gray-100 border-t border-gray-300">
                    <td className="py-2 font-bold text-gray-900">TOTAL PASSIVO NÃO CIRCULANTE</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatPrice(balancoData.passivoNaoCirculante.total)}</td>
                  </tr>

                  {/* PATRIMÔNIO LÍQUIDO */}
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pt-4 font-bold text-gray-900 uppercase text-xs">PATRIMÔNIO LÍQUIDO</td>
                    <td></td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Capital Social</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.patrimonioLiquido.capitalSocial)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Reservas</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.patrimonioLiquido.reservas)}</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-1.5 text-gray-700 pl-3">Lucros Acumulados</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{formatPrice(balancoData.patrimonioLiquido.lucrosAcumulados)}</td>
                  </tr>

                  <tr className="bg-gray-100 border-t border-gray-300">
                    <td className="py-2 font-bold text-gray-900">TOTAL PATRIMÔNIO LÍQUIDO</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatPrice(balancoData.patrimonioLiquido.total)}</td>
                  </tr>

                  {/* TOTAL PASSIVO + PL */}
                  <tr className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                    <td className="py-2 font-bold text-sm">TOTAL PASSIVO + PL</td>
                    <td className="py-2 text-right font-bold text-sm">{formatPrice(balancoData.passivoPatrimonioTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Indicadores Compactos */}
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          {/* Liquidez Corrente */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Liquidez Corrente</div>
            <div className="text-lg font-bold text-gray-900">
              {(balancoData.ativoCirculante.total / balancoData.passivoCirculante.total).toFixed(2)}
            </div>
          </div>

          {/* Endividamento */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Endividamento</div>
            <div className="text-lg font-bold text-gray-900">
              {(((balancoData.passivoCirculante.total + balancoData.passivoNaoCirculante.total) / balancoData.ativoTotal) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Ativo Circulante */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Ativo Circulante</div>
            <div className="text-lg font-bold text-gray-900">
              {((balancoData.ativoCirculante.total / balancoData.ativoTotal) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Patrimônio Líquido */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Patrimônio Líquido</div>
            <div className="text-lg font-bold text-gray-900">
              {((balancoData.patrimonioLiquido.total / balancoData.passivoPatrimonioTotal) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Notas Compactas */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3 mt-4">
          <div className="text-xs text-gray-600">
            <strong>Notas:</strong> Demonstração baseada em dados reais de receitas e despesas. 
            Valores estimados: Imobilizado R$ 150.000, Capital Social R$ 100.000. 
            Contas a receber = 15% vendas, Estoque = 25% vendas, Impostos = 15% receitas.
          </div>
        </div>
      </div>
    </div>
  );
}
