import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Edit, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts';
import { Button, Card, CardContent, Input } from '../components/ui';
import { menuData } from '../data/menu';
import type { MenuItem } from '../types';

interface StockItem extends MenuItem {
  stock: number;
  minStock: number;
  lastUpdated: string;
}

// Simulando dados de estoque (em uma aplicação real, viria do Firebase)
const mockStockData: StockItem[] = menuData.map((item: MenuItem) => ({
  ...item,
  stock: Math.floor(Math.random() * 100) + 10, // Entre 10 e 110
  minStock: Math.floor(Math.random() * 20) + 5, // Entre 5 e 25
  lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
}));

export function AdminStockPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stockItems, setStockItems] = useState<StockItem[]>(mockStockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  // Verificar se usuário está logado 
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    console.log('✅ Usuário logado na página de estoque:', { role: user.role, email: user.email });
  }, [user, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (item: StockItem) => {
    if (item.stock === 0) return 'out';
    if (item.stock <= item.minStock) return 'low';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out': return <XCircle size={16} />;
      case 'low': return <AlertTriangle size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Sem estoque';
      case 'low': return 'Estoque baixo';
      default: return 'Normal';
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getStockStatus(item);
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'low' && status === 'low') ||
                         (filterStatus === 'out' && status === 'out');
    
    return matchesSearch && matchesFilter;
  });

  const handleEditStock = (itemId: string, newStock: number) => {
    setStockItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, stock: newStock, lastUpdated: new Date().toISOString() }
        : item
    ));
    setEditingItem(null);
  };

  const startEditing = (item: StockItem) => {
    setEditingItem(item.id);
    setEditStock(item.stock);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditStock(0);
  };

  const stockStats = {
    total: stockItems.length,
    low: stockItems.filter(item => getStockStatus(item) === 'low').length,
    out: stockItems.filter(item => getStockStatus(item) === 'out').length,
    normal: stockItems.filter(item => getStockStatus(item) === 'normal').length
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
              <p className="text-gray-600">Gerencie o estoque dos itens do cardápio</p>
              {/* Debug info */}
              <p className="text-xs text-gray-500">
                Usuário: {user?.email} | Role: {user?.role || 'não definido'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
          >
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Itens</p>
                  <p className="text-2xl font-bold">{stockStats.total}</p>
                </div>
                <Package className="text-blue-500" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estoque Normal</p>
                  <p className="text-2xl font-bold text-green-600">{stockStats.normal}</p>
                </div>
                <CheckCircle className="text-green-500" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-yellow-600">{stockStats.low}</p>
                </div>
                <AlertTriangle className="text-yellow-500" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sem Estoque</p>
                  <p className="text-2xl font-bold text-red-600">{stockStats.out}</p>
                </div>
                <XCircle className="text-red-500" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar por nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={filterStatus === 'low' ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus('low')}
                  size="sm"
                  className="text-yellow-600 border-yellow-300"
                >
                  Estoque Baixo
                </Button>
                <Button
                  variant={filterStatus === 'out' ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus('out')}
                  size="sm"
                  className="text-red-600 border-red-300"
                >
                  Sem Estoque
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const status = getStockStatus(item);
            const isEditing = editingItem === item.id;

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Imagem */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image.replace('/src/assets/images/menu/', '/images/menu/')}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-food.jpg';
                        }}
                      />
                    </div>

                    {/* Informações do Item */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.category}</p>
                          <p className="text-lg font-bold text-green-600">{formatPrice(item.price)}</p>
                        </div>
                        
                        {/* Status */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span>{getStatusText(status)}</span>
                        </div>
                      </div>

                      {/* Informações de Estoque */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-xs text-gray-500">Estoque Atual</p>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(Number(e.target.value))}
                              className="w-20 h-8 text-sm"
                              min="0"
                              autoFocus
                            />
                          ) : (
                            <p className="text-lg font-semibold">{item.stock}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Estoque Mínimo</p>
                          <p className="text-sm">{item.minStock}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Última Atualização</p>
                          <p className="text-sm">{formatDate(item.lastUpdated)}</p>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleEditStock(item.id, editStock)}
                                className="text-xs"
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="text-xs"
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(item)}
                              className="text-xs"
                            >
                              <Edit size={14} className="mr-1" />
                              Editar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou o termo de busca.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
