import { useState, useEffect } from 'react';
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  Receipt,
  DollarSign,
  Edit,
  Trash2,
  Download,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { despesaService, type Despesa, type CreateDespesaData } from '../services/despesaService';

const categoriasDespesas = [
  {
    categoria: 'ingredientes',
    label: 'Ingredientes e Alimentos',
    subcategorias: ['carnes', 'grãos', 'legumes', 'temperos', 'bebidas', 'massas', 'laticínios', 'outros']
  },
  {
    categoria: 'pessoal',
    label: 'Pessoal',
    subcategorias: ['salários', 'encargos', 'benefícios', 'treinamento', 'uniformes']
  },
  {
    categoria: 'infraestrutura',
    label: 'Infraestrutura',
    subcategorias: ['aluguel', 'energia', 'água', 'gás', 'internet', 'telefone']
  },
  {
    categoria: 'operacional',
    label: 'Operacional',
    subcategorias: ['embalagens', 'descartáveis', 'limpeza', 'delivery', 'combustível']
  },
  {
    categoria: 'equipamentos',
    label: 'Equipamentos',
    subcategorias: ['manutenção', 'reposição', 'depreciação', 'seguros']
  },
  {
    categoria: 'administrativo',
    label: 'Administrativo',
    subcategorias: ['contabilidade', 'jurídico', 'licenças', 'taxas', 'documentação']
  },
  {
    categoria: 'marketing',
    label: 'Marketing',
    subcategorias: ['publicidade', 'redes sociais', 'material gráfico', 'eventos']
  },
  {
    categoria: 'financeiro',
    label: 'Financeiro',
    subcategorias: ['juros', 'multas', 'tarifas bancárias', 'impostos', 'empréstimos']
  },
  {
    categoria: 'outros',
    label: 'Outros',
    subcategorias: ['diversos', 'emergencial', 'investimentos']
  }
];

const statusDespesa = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pago', label: 'Pago', color: 'bg-green-100 text-green-800' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-800' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
];

const formasPagamento = [
  'dinheiro', 'cartão_débito', 'cartão_crédito', 'pix', 'transferência', 'boleto', 'cheque'
];

export default function AdminDespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    subcategoria: '',
    fornecedor: '',
    valor: '',
    dataVencimento: '',
    dataPagamento: '',
    formaPagamento: '',
    recorrente: false,
    frequencia: '',
    observacoes: ''
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    // Para evitar problemas de fuso horário, vamos tratar a data como local
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR');
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      categoria: '',
      subcategoria: '',
      fornecedor: '',
      valor: '',
      dataVencimento: '',
      dataPagamento: '',
      formaPagamento: '',
      recorrente: false,
      frequencia: '',
      observacoes: ''
    });
    setEditingDespesa(null);
    setShowForm(false);
  };

  // Carregar despesas do Firebase
  useEffect(() => {
    loadDespesas();
  }, []);

  const loadDespesas = async () => {
    try {
      setLoading(true);
      const despesasData = await despesaService.getAllDespesas();
      setDespesas(despesasData);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      alert('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const valor = parseFloat(formData.valor);
    
    if (!valor || valor <= 0) {
      alert('Por favor, insira um valor válido para a despesa');
      return;
    }

    // Verificar se a data de vencimento já passou
    const hoje = new Date();
    const vencimento = new Date(formData.dataVencimento);
    let status: Despesa['status'] = 'pendente';
    
    if (formData.dataPagamento) {
      status = 'pago';
    } else if (vencimento < hoje) {
      status = 'vencido';
    }

    const despesaData: CreateDespesaData = {
      descricao: formData.descricao,
      categoria: formData.categoria,
      subcategoria: formData.subcategoria || undefined,
      fornecedor: formData.fornecedor || undefined,
      valor,
      dataVencimento: formData.dataVencimento,
      dataPagamento: formData.dataPagamento || undefined,
      formaPagamento: formData.formaPagamento || undefined,
      status,
      recorrente: formData.recorrente,
      frequencia: formData.recorrente ? (formData.frequencia as any) : undefined,
      observacoes: formData.observacoes || undefined
    };

    try {
      setLoading(true);
      if (editingDespesa && editingDespesa.id) {
        await despesaService.updateDespesa(editingDespesa.id, despesaData);
        alert('Despesa atualizada com sucesso!');
      } else {
        await despesaService.createDespesa(despesaData);
        alert('Despesa cadastrada com sucesso!');
      }
      
      resetForm();
      await loadDespesas(); // Recarregar a lista
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setFormData({
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      subcategoria: despesa.subcategoria || '',
      fornecedor: despesa.fornecedor || '',
      valor: despesa.valor.toString(),
      dataVencimento: despesa.dataVencimento,
      dataPagamento: despesa.dataPagamento || '',
      formaPagamento: despesa.formaPagamento || '',
      recorrente: despesa.recorrente,
      frequencia: despesa.frequencia || '',
      observacoes: despesa.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        setLoading(true);
        await despesaService.deleteDespesa(id);
        await loadDespesas(); // Recarregar a lista
        alert('Despesa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        alert('Erro ao excluir despesa');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: Despesa['status']) => {
    try {
      setLoading(true);
      await despesaService.updateDespesaStatus(id, newStatus);
      await loadDespesas(); // Recarregar a lista
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da despesa');
    } finally {
      setLoading(false);
    }
  };

  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = 
      despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (despesa.fornecedor && despesa.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || despesa.categoria === filterCategory;
    const matchesStatus = !filterStatus || despesa.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalDespesas = filteredDespesas.reduce((sum, despesa) => sum + despesa.valor, 0);
  const despesasPendentes = filteredDespesas.filter(d => d.status === 'pendente').length;
  const despesasVencidas = filteredDespesas.filter(d => d.status === 'vencido').length;
  const despesasPagas = filteredDespesas.filter(d => d.status === 'pago').length;

  const exportToCSV = () => {
    const headers = [
      'Descrição',
      'Categoria', 
      'Subcategoria',
      'Fornecedor',
      'Valor (R$)',
      'Data Vencimento',
      'Data Pagamento',
      'Status',
      'Forma Pagamento',
      'Recorrente',
      'Frequência',
      'Observações'
    ];
    
    // Função para escapar campos CSV
    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...filteredDespesas.map(despesa => [
        escapeCSV(despesa.descricao),
        escapeCSV(despesa.categoria),
        escapeCSV(despesa.subcategoria || ''),
        escapeCSV(despesa.fornecedor || ''),
        escapeCSV(`R$ ${despesa.valor.toFixed(2).replace('.', ',')}`),
        escapeCSV(formatDate(despesa.dataVencimento)),
        escapeCSV(despesa.dataPagamento ? formatDate(despesa.dataPagamento) : ''),
        escapeCSV(despesa.status === 'pago' ? 'Pago' : despesa.status === 'pendente' ? 'Pendente' : 'Vencido'),
        escapeCSV(despesa.formaPagamento || ''),
        escapeCSV(despesa.recorrente ? 'Sim' : 'Não'),
        escapeCSV(despesa.frequencia || ''),
        escapeCSV(despesa.observacoes || '')
      ].join(','))
    ].join('\n');

    // Adicionar BOM para garantir encoding correto no Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `despesas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedCategoriaData = categoriasDespesas.find(cat => cat.categoria === formData.categoria);

  if (loading && despesas.length === 0) {
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt size={32} />
            Gestão de Despesas
          </h1>
          <p className="text-gray-600 mt-2">Controle completo de todas as despesas do restaurante</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(totalDespesas)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagas</p>
                <p className="text-2xl font-bold text-green-600">{despesasPagas}</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{despesasPendentes}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{despesasVencidas}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Itens</p>
                <p className="text-2xl font-bold text-blue-600">{filteredDespesas.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por descrição ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todas as categorias</option>
              {categoriasDespesas.map(categoria => (
                <option key={categoria.categoria} value={categoria.categoria}>
                  {categoria.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos os status</option>
              {statusDespesa.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterStatus('');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={16} />
              Limpar
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas Cadastradas ({filteredDespesas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDespesas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                    <th className="text-left py-3 px-4 font-semibold">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold">Fornecedor</th>
                    <th className="text-right py-3 px-4 font-semibold">Valor</th>
                    <th className="text-center py-3 px-4 font-semibold">Vencimento</th>
                    <th className="text-center py-3 px-4 font-semibold">Pagamento</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDespesas.map((despesa) => (
                    <tr key={despesa.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{despesa.descricao}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="capitalize font-medium">{despesa.categoria}</div>
                          {despesa.subcategoria && (
                            <div className="text-xs text-gray-500 capitalize">{despesa.subcategoria}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{despesa.fornecedor || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-orange-600">
                        {formatPrice(despesa.valor)}
                      </td>
                      <td className="py-3 px-4 text-center">{formatDate(despesa.dataVencimento)}</td>
                      <td className="py-3 px-4 text-center">
                        {despesa.dataPagamento ? formatDate(despesa.dataPagamento) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={despesa.status}
                          onChange={(e) => despesa.id && handleStatusChange(despesa.id, e.target.value as Despesa['status'])}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                            statusDespesa.find(s => s.value === despesa.status)?.color
                          }`}
                        >
                          {statusDespesa.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(despesa)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => despesa.id && handleDelete(despesa.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma despesa encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Conta de energia elétrica"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value, subcategoria: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriasDespesas.map(categoria => (
                      <option key={categoria.categoria} value={categoria.categoria}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategoria</label>
                  <select
                    value={formData.subcategoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    disabled={!selectedCategoriaData}
                  >
                    <option value="">Selecione uma subcategoria</option>
                    {selectedCategoriaData?.subcategorias.map(sub => (
                      <option key={sub} value={sub}>
                        {sub.charAt(0).toUpperCase() + sub.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fornecedor/Credor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Empresa de energia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Pagamento</label>
                  <input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataPagamento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                <select
                  value={formData.formaPagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, formaPagamento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione a forma de pagamento</option>
                  {formasPagamento.map(forma => (
                    <option key={forma} value={forma}>
                      {forma.replace('_', ' ').charAt(0).toUpperCase() + forma.replace('_', ' ').slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recorrente}
                    onChange={(e) => setFormData(prev => ({ ...prev, recorrente: e.target.checked }))}
                    className="mr-2"
                  />
                  Despesa recorrente
                </label>
                
                {formData.recorrente && (
                  <select
                    value={formData.frequencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequencia: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Frequência</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Informações adicionais sobre a despesa"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  {editingDespesa ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
