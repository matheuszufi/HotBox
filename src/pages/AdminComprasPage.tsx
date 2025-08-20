import { useState } from 'react';
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  ShoppingBag,
  Package,
  DollarSign,
  Edit,
  Trash2,
  Download,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';

interface Compra {
  id: string;
  fornecedor: string;
  produto: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
  total: number;
  dataCompra: string;
  dataEntrega?: string;
  status: 'pendente' | 'entregue' | 'cancelada';
  observacoes?: string;
  createdAt: string;
}

const categorias = [
  'grãos',
  'carnes',
  'massas',
  'legumes',
  'acompanhamentos',
  'bebidas',
  'temperos',
  'descartáveis',
  'limpeza',
  'outros'
];

const statusCompra = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'entregue', label: 'Entregue', color: 'bg-green-100 text-green-800' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800' }
];

export default function AdminComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);

  const [formData, setFormData] = useState({
    fornecedor: '',
    produto: '',
    categoria: '',
    quantidade: '',
    unidade: '',
    precoUnitario: '',
    dataCompra: '',
    dataEntrega: '',
    observacoes: ''
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const resetForm = () => {
    setFormData({
      fornecedor: '',
      produto: '',
      categoria: '',
      quantidade: '',
      unidade: '',
      precoUnitario: '',
      dataCompra: '',
      dataEntrega: '',
      observacoes: ''
    });
    setEditingCompra(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantidade = parseFloat(formData.quantidade);
    const precoUnitario = parseFloat(formData.precoUnitario);
    
    if (!quantidade || !precoUnitario || quantidade <= 0 || precoUnitario <= 0) {
      alert('Por favor, insira valores válidos para quantidade e preço');
      return;
    }

    const compraData: Compra = {
      id: editingCompra?.id || Date.now().toString(),
      fornecedor: formData.fornecedor,
      produto: formData.produto,
      categoria: formData.categoria,
      quantidade,
      unidade: formData.unidade,
      precoUnitario,
      total: quantidade * precoUnitario,
      dataCompra: formData.dataCompra,
      dataEntrega: formData.dataEntrega || undefined,
      status: 'pendente',
      observacoes: formData.observacoes || undefined,
      createdAt: editingCompra?.createdAt || new Date().toISOString()
    };

    try {
      if (editingCompra) {
        // Editar compra existente
        setCompras(prev => prev.map(c => c.id === editingCompra.id ? compraData : c));
      } else {
        // Adicionar nova compra
        setCompras(prev => [compraData, ...prev]);
      }
      
      resetForm();
      alert(editingCompra ? 'Compra atualizada com sucesso!' : 'Compra cadastrada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
      alert('Erro ao salvar compra');
    }
  };

  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra);
    setFormData({
      fornecedor: compra.fornecedor,
      produto: compra.produto,
      categoria: compra.categoria,
      quantidade: compra.quantidade.toString(),
      unidade: compra.unidade,
      precoUnitario: compra.precoUnitario.toString(),
      dataCompra: compra.dataCompra,
      dataEntrega: compra.dataEntrega || '',
      observacoes: compra.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta compra?')) {
      setCompras(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: Compra['status']) => {
    setCompras(prev => prev.map(c => 
      c.id === id ? { ...c, status: newStatus } : c
    ));
  };

  const filteredCompras = compras.filter(compra => {
    const matchesSearch = 
      compra.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compra.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || compra.categoria === filterCategory;
    const matchesStatus = !filterStatus || compra.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCompras = filteredCompras.reduce((sum, compra) => sum + compra.total, 0);
  const comprasPendentes = filteredCompras.filter(c => c.status === 'pendente').length;
  const comprasEntregues = filteredCompras.filter(c => c.status === 'entregue').length;

  const exportToCSV = () => {
    const headers = ['Fornecedor', 'Produto', 'Categoria', 'Quantidade', 'Unidade', 'Preço Unitário', 'Total', 'Data Compra', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredCompras.map(compra => [
        compra.fornecedor,
        compra.produto,
        compra.categoria,
        compra.quantidade,
        compra.unidade,
        compra.precoUnitario.toFixed(2),
        compra.total.toFixed(2),
        formatDate(compra.dataCompra),
        compra.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={32} />
            Gestão de Compras
          </h1>
          <p className="text-gray-600 mt-2">Controle de compras e fornecedores do restaurante</p>
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
            Nova Compra
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Compras</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(totalCompras)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Itens</p>
                <p className="text-2xl font-bold text-blue-600">{filteredCompras.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{comprasPendentes}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregues</p>
                <p className="text-2xl font-bold text-green-600">{comprasEntregues}</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
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
                placeholder="Buscar por produto ou fornecedor..."
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
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos os status</option>
              {statusCompra.map(status => (
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

      {/* Lista de Compras */}
      <Card>
        <CardHeader>
          <CardTitle>Compras Cadastradas ({filteredCompras.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompras.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Fornecedor</th>
                    <th className="text-left py-3 px-4 font-semibold">Produto</th>
                    <th className="text-left py-3 px-4 font-semibold">Categoria</th>
                    <th className="text-center py-3 px-4 font-semibold">Quantidade</th>
                    <th className="text-right py-3 px-4 font-semibold">Preço Unit.</th>
                    <th className="text-right py-3 px-4 font-semibold">Total</th>
                    <th className="text-center py-3 px-4 font-semibold">Data</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompras.map((compra) => (
                    <tr key={compra.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{compra.fornecedor}</td>
                      <td className="py-3 px-4 font-medium">{compra.produto}</td>
                      <td className="py-3 px-4 capitalize">{compra.categoria}</td>
                      <td className="py-3 px-4 text-center">
                        {compra.quantidade} {compra.unidade}
                      </td>
                      <td className="py-3 px-4 text-right">{formatPrice(compra.precoUnitario)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-orange-600">
                        {formatPrice(compra.total)}
                      </td>
                      <td className="py-3 px-4 text-center">{formatDate(compra.dataCompra)}</td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={compra.status}
                          onChange={(e) => handleStatusChange(compra.id, e.target.value as Compra['status'])}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                            statusCompra.find(s => s.value === compra.status)?.color
                          }`}
                        >
                          {statusCompra.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(compra)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(compra.id)}
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
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCompra ? 'Editar Compra' : 'Nova Compra'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fornecedor</label>
                <input
                  type="text"
                  required
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Produto</label>
                <input
                  type="text"
                  required
                  value={formData.produto}
                  onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  required
                  value={formData.categoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidade</label>
                  <select
                    required
                    value={formData.unidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="g">Gramas</option>
                    <option value="l">Litros</option>
                    <option value="ml">ML</option>
                    <option value="un">Unidade</option>
                    <option value="cx">Caixa</option>
                    <option value="pct">Pacote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Preço Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.precoUnitario}
                  onChange={(e) => setFormData(prev => ({ ...prev, precoUnitario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data da Compra</label>
                <input
                  type="date"
                  required
                  value={formData.dataCompra}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataCompra: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data de Entrega (opcional)</label>
                <input
                  type="date"
                  value={formData.dataEntrega}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataEntrega: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações (opcional)</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  {editingCompra ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
