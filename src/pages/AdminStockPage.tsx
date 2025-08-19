import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { StockItem } from '../types/stock';
import { stockCategories } from '../types/stock';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, TrendingUp } from 'lucide-react';

const AdminStockPage: React.FC = () => {
  const { firebaseUser, isAuthenticated } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'graos',
    currentStock: 0,
    minStock: 0,
    maxStock: 100,
    unit: 'g' as 'g' | 'kg' | 'un' | 'l' | 'ml',
    unitPrice: 0,
    supplier: '',
    notes: ''
  });

  // Carrega os itens do estoque do Firebase em tempo real
  useEffect(() => {
    if (!isAuthenticated || !firebaseUser) {
      console.log('Usuário não autenticado:', { isAuthenticated, firebaseUser });
      setLoading(false);
      setError('Usuário não autenticado. Faça login para acessar o estoque.');
      return;
    }

    console.log('Usuário autenticado, conectando ao Firestore...', firebaseUser.uid);
    
    let timeoutId: NodeJS.Timeout;
    
    // Timeout de 10 segundos para evitar loading infinito
    timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Timeout ao conectar com o Firebase. Verifique sua conexão.');
      }
    }, 10000);

    try {
      console.log('Configurando listener do Firestore...');
      const unsubscribe = onSnapshot(
        collection(db, 'stock'),
        (snapshot) => {
          console.log('Snapshot recebido:', snapshot.size, 'documentos');
          clearTimeout(timeoutId);
          const items: StockItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Documento:', doc.id, data);
            
            // Tratar lastUpdated corretamente
            let lastUpdated = new Date();
            if (data.lastUpdated) {
              if (typeof data.lastUpdated.toDate === 'function') {
                lastUpdated = data.lastUpdated.toDate();
              } else if (data.lastUpdated instanceof Date) {
                lastUpdated = data.lastUpdated;
              } else if (typeof data.lastUpdated === 'string') {
                lastUpdated = new Date(data.lastUpdated);
              }
            }
            
            items.push({
              id: doc.id,
              ...data,
              lastUpdated
            } as StockItem);
          });
          // Ordenar no frontend se houver problemas com índices
          items.sort((a, b) => a.name.localeCompare(b.name));
          console.log('Items processados:', items.length);
          setStockItems(items);
          setLoading(false);
          setError(null);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Erro ao carregar estoque:', error);
          setLoading(false);
          setError(`Erro ao conectar com o Firebase: ${error.message}`);
        }
      );

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Erro ao configurar listener:', error);
      setLoading(false);
      setError(`Erro de configuração: ${error.message}`);
    }
  }, [isAuthenticated, firebaseUser?.uid]); // Usar apenas o UID para evitar mudanças de tamanho

  // Filtra os itens com base na categoria e busca
  useEffect(() => {
    let filtered = stockItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [stockItems, selectedCategory, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Atualizar item existente
        const itemRef = doc(db, 'stock', editingItem.id);
        await updateDoc(itemRef, {
          ...formData,
          lastUpdated: new Date()
        });
      } else {
        // Criar novo item
        await addDoc(collection(db, 'stock'), {
          ...formData,
          lastUpdated: new Date()
        });
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item do estoque');
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unit: item.unit,
      unitPrice: item.unitPrice,
      supplier: item.supplier || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item do estoque?')) {
      try {
        await deleteDoc(doc(db, 'stock', id));
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        alert('Erro ao excluir item do estoque');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'graos',
      currentStock: 0,
      minStock: 0,
      maxStock: 100,
      unit: 'g',
      unitPrice: 0,
      supplier: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const getStockStatus = (item: StockItem) => {
    const currentStock = item.currentStock || 0;
    const minStock = item.minStock || 0;
    const maxStock = item.maxStock || 0;
    
    if (currentStock <= minStock) {
      return { status: 'low', color: 'text-red-600', icon: AlertTriangle };
    } else if (currentStock >= maxStock) {
      return { status: 'high', color: 'text-orange-600', icon: TrendingUp };
    }
    return { status: 'normal', color: 'text-green-600', icon: Package };
  };

  const lowStockItems = stockItems.filter(item => (item.currentStock || 0) <= (item.minStock || 0));
  const highStockItems = stockItems.filter(item => (item.currentStock || 0) >= (item.maxStock || 0));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Erro de Conexão</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-600 mt-2">Gerencie o estoque de ingredientes e produtos</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar Item
        </button>
      </div>

      {/* Alertas de Estoque */}
      {(lowStockItems.length > 0 || highStockItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {lowStockItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-600" size={20} />
                <h3 className="font-semibold text-red-800">Estoque Baixo ({lowStockItems.length})</h3>
              </div>
              <div className="space-y-1">
                {lowStockItems.slice(0, 3).map(item => (
                  <p key={item.id} className="text-red-700 text-sm">
                    {item.name}: {item.currentStock || 0} {item.unit} (mín: {item.minStock || 0})
                  </p>
                ))}
                {lowStockItems.length > 3 && (
                  <p className="text-red-600 text-sm">...e mais {lowStockItems.length - 3} itens</p>
                )}
              </div>
            </div>
          )}

          {highStockItems.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-orange-600" size={20} />
                <h3 className="font-semibold text-orange-800">Estoque Alto ({highStockItems.length})</h3>
              </div>
              <div className="space-y-1">
                {highStockItems.slice(0, 3).map(item => (
                  <p key={item.id} className="text-orange-700 text-sm">
                    {item.name}: {item.currentStock || 0} {item.unit} (máx: {item.maxStock || 0})
                  </p>
                ))}
                {highStockItems.length > 3 && (
                  <p className="text-orange-600 text-sm">...e mais {highStockItems.length - 3} itens</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou fornecedor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas as Categorias</option>
          {stockCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                const StatusIcon = stockStatus.icon;
                const category = stockCategories.find(cat => cat.id === item.category);

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.supplier && (
                          <div className="text-sm text-gray-500">Fornecedor: {item.supplier}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {category?.icon} {category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.currentStock || 0} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.minStock || 0} - {item.maxStock || 0} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        R$ {(item.unitPrice || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1 ${stockStatus.color}`}>
                        <StatusIcon size={16} />
                        <span className="text-sm font-medium">
                          {stockStatus.status === 'low' && 'Baixo'}
                          {stockStatus.status === 'high' && 'Alto'}
                          {stockStatus.status === 'normal' && 'Normal'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece adicionando um novo item ao estoque.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {stockCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Atual *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    >
                      <option value="g">Gramas (g)</option>
                      <option value="kg">Quilogramas (kg)</option>
                      <option value="l">Litros (l)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="un">Unidades (un)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Mínimo *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Máximo *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition duration-200"
                  >
                    {editingItem ? 'Atualizar' : 'Adicionar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStockPage;
