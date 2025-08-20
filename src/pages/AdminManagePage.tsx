import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Users,
  Database,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  Plus,
  Edit2,
  Package,
  ShoppingBag,
  UserCheck,
  Eye,
  X,
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components';
import { supplierService } from '../services/supplierService';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { productService } from '../services/productService';
import { addSampleProducts } from '../utils/addSampleProducts';
import { addSampleUsers } from '../utils/addSampleUsers';
import type { Supplier } from '../types/stock';
import type { Order, User, MenuItem } from '../types';

export default function AdminManagePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    available: true,
    quantityType: 'g' as 'g' | 'un',
    quantity: 0,
    ingredients: [] as string[]
  });
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    cnpj: '',
    notes: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadSuppliers(),
      loadOrders(),
      loadUsers(),
      loadProducts()
    ]);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await supplierService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Carregando usuários...');
      const usersData = await userService.getAllUsers();
      console.log('Usuários carregados:', usersData);
      setUsers(usersData.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Carregando produtos...');
      const productsData = await productService.getProducts();
      console.log('Produtos carregados:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, supplierFormData);
        alert('Fornecedor atualizado com sucesso!');
      } else {
        await supplierService.createSupplier(supplierFormData);
        alert('Fornecedor cadastrado com sucesso!');
      }
      
      resetSupplierForm();
      setShowSupplierModal(false);
      await loadSuppliers();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor');
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      cnpj: supplier.cnpj || '',
      notes: supplier.notes || ''
    });
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await supplierService.deleteSupplier(id);
        alert('Fornecedor excluído com sucesso!');
        await loadSuppliers();
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        alert('Erro ao excluir fornecedor');
      }
    }
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      cnpj: '',
      notes: ''
    });
    setEditingSupplier(null);
  };

  // Product Management Functions
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productFormData);
        alert('Produto atualizado com sucesso!');
      } else {
        await productService.addProduct(productFormData);
        alert('Produto cadastrado com sucesso!');
      }
      
      resetProductForm();
      setShowProductModal(false);
      await loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleEditProduct = (product: MenuItem) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      available: product.available,
      quantityType: product.quantityType,
      quantity: product.quantity,
      ingredients: product.ingredients || []
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      available: true,
      quantityType: 'g',
      quantity: 0,
      ingredients: []
    });
    setEditingProduct(null);
  };

  // User Management Functions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Função para obter pedidos do usuário
  const getUserOrders = (userId: string) => {
    return orders.filter(order => order.userId === userId);
  };

  // Função para calcular estatísticas do usuário
  const getUserStats = (userId: string) => {
    const userOrders = getUserOrders(userId);
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // Produtos mais pedidos
    const productCount: Record<string, { name: string; count: number; total: number }> = {};
    userOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.name;
        if (!productCount[key]) {
          productCount[key] = { name: item.menuItem.name, count: 0, total: 0 };
        }
        productCount[key].count += item.quantity;
        productCount[key].total += item.menuItem.price * item.quantity;
      });
    });
    
    const favoriteProducts = Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status dos pedidos
    const statusCount = userOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      favoriteProducts,
      statusCount,
      lastOrderDate: userOrders.length > 0 
        ? Math.max(...userOrders.map(order => new Date(order.createdAt).getTime()))
        : null
    };
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, etc.)');
        return;
      }

      // Check file size (limit to 10MB for initial upload)
      if (file.size > 10 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 10MB');
        return;
      }

      // Create a canvas to resize the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            alert('Erro ao processar a imagem');
            return;
          }

          // Calculate new dimensions (max 800x600 to keep size reasonable)
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with reduced quality to keep under Firebase limit
          let quality = 0.8;
          let imageDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, reduce quality further
          while (imageDataUrl.length > 900000 && quality > 0.1) { // ~900KB limit to be safe
            quality -= 0.1;
            imageDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          if (imageDataUrl.length > 900000) {
            alert('Não foi possível reduzir a imagem o suficiente. Tente uma imagem menor ou de menor resolução.');
            return;
          }

          setProductFormData({ ...productFormData, image: imageDataUrl });
        };
        
        img.onerror = () => {
          alert('Erro ao carregar a imagem. Tente outro arquivo.');
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        alert('Erro ao ler o arquivo de imagem.');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
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
            <Settings size={32} />
            Gerenciamento de Dados
          </h1>
          <p className="text-gray-600 mt-2">Gerencie fornecedores e outros dados do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'suppliers'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Users className="inline-block w-4 h-4 mr-2" />
          Fornecedores ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Package className="inline-block w-4 h-4 mr-2" />
          Produtos ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ShoppingBag className="inline-block w-4 h-4 mr-2" />
          Pedidos ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <UserCheck className="inline-block w-4 h-4 mr-2" />
          Usuários ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'database'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Database className="inline-block w-4 h-4 mr-2" />
          Banco de Dados
        </button>
      </div>

      {/* Content */}
      {activeTab === 'suppliers' && (
        <div>
          {/* Suppliers Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Fornecedores ({suppliers.length})
            </h2>
            <button
              onClick={() => {
                resetSupplierForm();
                setShowSupplierModal(true);
              }}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-orange-600 transition duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              Novo Fornecedor
            </button>
          </div>

          {/* Suppliers List */}
          <Card>
            <CardContent>
              {suppliers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold">Contato</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Telefone</th>
                        <th className="text-left py-3 px-4 font-semibold">CNPJ</th>
                        <th className="text-center py-3 px-4 font-semibold">Data Cadastro</th>
                        <th className="text-center py-3 px-4 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{supplier.name}</td>
                          <td className="py-3 px-4">{supplier.contact || '-'}</td>
                          <td className="py-3 px-4">{supplier.email || '-'}</td>
                          <td className="py-3 px-4">{supplier.phone || '-'}</td>
                          <td className="py-3 px-4">{supplier.cnpj || '-'}</td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600">
                            {formatDate(supplier.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditSupplier(supplier)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar fornecedor"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Excluir fornecedor"
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
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum fornecedor cadastrado</p>
                  <button
                    onClick={() => {
                      resetSupplierForm();
                      setShowSupplierModal(true);
                    }}
                    className="mt-4 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-orange-600 transition duration-200"
                  >
                    Cadastrar Primeiro Fornecedor
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Produtos ({products.length})
            </h2>
            <div className="flex gap-2">
              <button
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-600 transition duration-200 flex items-center space-x-2"
                onClick={() => {
                  resetProductForm();
                  setShowProductModal(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Produto</span>
              </button>
              {products.length === 0 && (
                <button
                  onClick={async () => {
                    await addSampleProducts();
                    await loadProducts();
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-200"
                >
                  Produtos de Exemplo
                </button>
              )}
            </div>
          </div>

          <Card>
            <CardContent>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold">Categoria</th>
                        <th className="text-right py-3 px-4 font-semibold">Preço</th>
                        <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                        <th className="text-center py-3 px-4 font-semibold">Disponível</th>
                        <th className="text-center py-3 px-4 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{product.name}</td>
                          <td className="py-3 px-4 capitalize">{product.category}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            R$ {product.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                            {product.description}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.available 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.available ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                title="Editar produto"
                                onClick={() => {
                                  handleEditProduct(product);
                                }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Excluir produto"
                                onClick={async () => {
                                  if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
                                    try {
                                      await productService.deleteProduct(product.id);
                                      await loadProducts();
                                      alert('Produto excluído com sucesso!');
                                    } catch (error) {
                                      console.error('Erro ao excluir produto:', error);
                                      alert('Erro ao excluir produto. Tente novamente.');
                                    }
                                  }
                                }}
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
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pedidos ({orders.length})
            </h2>
          </div>

          <Card>
            <CardContent>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">ID</th>
                        <th className="text-left py-3 px-4 font-semibold">Cliente</th>
                        <th className="text-right py-3 px-4 font-semibold">Total</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Data</th>
                        <th className="text-center py-3 px-4 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 20).map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-sm">
                            #{order.id?.slice(-8)}
                          </td>
                          <td className="py-3 px-4">{order.userName}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            R$ {order.total.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'out-for-delivery' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' ? 'Entregue' :
                               order.status === 'preparing' ? 'Preparando' :
                               order.status === 'cancelled' ? 'Cancelado' :
                               order.status === 'ready' ? 'Pronto' :
                               order.status === 'out-for-delivery' ? 'Em Entrega' :
                               order.status === 'confirmed' ? 'Confirmado' :
                               'Pendente'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              title="Visualizar pedido"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Usuários ({users.length})
            </h2>
            {users.length === 0 && (
              <button
                onClick={async () => {
                  await addSampleUsers();
                  await loadUsers();
                }}
                className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-orange-600 transition duration-200"
              >
                Adicionar Usuários de Exemplo
              </button>
            )}
          </div>

          <Card>
            <CardContent>
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Telefone</th>
                        <th className="text-center py-3 px-4 font-semibold">Tipo</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Data Cadastro</th>
                        <th className="text-center py-3 px-4 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.uid} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{user.name}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.phone || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : 'Cliente'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              title="Visualizar usuário"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye size={16} />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                className="text-red-600 hover:text-red-800"
                                title="Desativar usuário"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum usuário encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'database' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Gerenciamento do Banco de Dados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download size={20} />
                  Backup de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Faça backup dos dados importantes do sistema
                </p>
                <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-orange-600 transition duration-200">
                  Fazer Backup
                </button>
              </CardContent>
            </Card>

            {/* Restaurar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={20} />
                  Restaurar Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Restaure dados a partir de um backup
                </p>
                <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-orange-600 transition duration-200">
                  Restaurar
                </button>
              </CardContent>
            </Card>

            {/* Limpeza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 size={20} />
                  Limpeza de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Limpe dados antigos e desnecessários
                </p>
                <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-orange-600 transition duration-200">
                  Limpar Dados
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Status do Sistema */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle size={20} />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">{suppliers.length}</div>
                  <div className="text-sm text-gray-600">Fornecedores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">{products.length}</div>
                  <div className="text-sm text-gray-600">Produtos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">{orders.length}</div>
                  <div className="text-sm text-gray-600">Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">{users.length}</div>
                  <div className="text-sm text-gray-600">Usuários</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Fornecedor */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              
              <form onSubmit={handleSubmitSupplier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Fornecedor *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pessoa de Contato
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={supplierFormData.contact}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, contact: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={supplierFormData.cnpj}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 px-4 rounded-md hover:from-red-700 hover:to-orange-600 transition duration-200"
                  >
                    {editingSupplier ? 'Atualizar' : 'Cadastrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupplierModal(false);
                      resetSupplierForm();
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

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="graos">Grãos</option>
                      <option value="carnes">Carnes</option>
                      <option value="massas">Massas</option>
                      <option value="legumes">Legumes</option>
                      <option value="acompanhamentos">Acompanhamentos</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="pratos-prontos">Pratos Prontos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={productFormData.quantity}
                      onChange={(e) => setProductFormData({ ...productFormData, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={productFormData.quantityType}
                      onChange={(e) => setProductFormData({ ...productFormData, quantityType: e.target.value as 'g' | 'un' })}
                    >
                      <option value="g">Gramas (g)</option>
                      <option value="un">Unidades (un)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem do Produto
                  </label>
                  <div className="space-y-3">
                    {/* URL Input */}
                    <div>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        value={productFormData.image}
                        onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                        placeholder="Cole a URL da imagem aqui..."
                      />
                    </div>
                    
                    {/* Divider */}
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-3 text-sm text-gray-500">ou</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                    
                    {/* Upload Button */}
                    <div>
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="imageUpload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Imagem do Computador
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Máximo 10MB • JPG, PNG, GIF • Será redimensionada automaticamente
                      </p>
                    </div>
                    
                    {/* Image Preview */}
                    {productFormData.image && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 mb-2">Prévia:</p>
                        <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={productFormData.image}
                            alt="Prévia do produto"
                            className="w-full h-full object-cover"
                            onError={() => {
                              setProductFormData({ ...productFormData, image: '' });
                              alert('Erro ao carregar a imagem. Verifique a URL ou tente outra imagem.');
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredientes (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={productFormData.ingredients.join(', ')}
                    onChange={(e) => setProductFormData({ 
                      ...productFormData, 
                      ingredients: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                    })}
                    placeholder="ingrediente1, ingrediente2, ingrediente3"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    checked={productFormData.available}
                    onChange={(e) => setProductFormData({ ...productFormData, available: e.target.checked })}
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Produto disponível
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 px-4 rounded-md hover:from-red-700 hover:to-orange-600 transition duration-200"
                  >
                    {editingProduct ? 'Atualizar' : 'Cadastrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      resetProductForm();
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

      {/* Modal de Detalhes do Usuário */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Usuário</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {(() => {
              const userStats = getUserStats(selectedUser.uid);
              const userOrders = getUserOrders(selectedUser.uid);

              return (
                <div className="space-y-6">
                  {/* Informações Pessoais */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Informações Pessoais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Nome</label>
                        <p className="text-gray-900 font-medium">{selectedUser.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Telefone</label>
                        <p className="text-gray-900">{selectedUser.phone || 'Não informado'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Tipo de Usuário</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedUser.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedUser.role === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas CRM */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-red-100">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <TrendingUp className="mr-2 text-red-600" size={20} />
                      Estatísticas do Cliente
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">Total de Pedidos</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                          {userStats.totalOrders}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">Total Gasto</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                          R$ {userStats.totalSpent.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">Ticket Médio</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                          R$ {userStats.averageOrderValue.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">Último Pedido</div>
                        <div className="text-sm font-medium text-gray-700">
                          {userStats.lastOrderDate 
                            ? new Date(userStats.lastOrderDate).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Produtos Favoritos */}
                  {userStats.favoriteProducts.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Produtos Mais Pedidos</h4>
                      <div className="space-y-2">
                        {userStats.favoriteProducts.map((product, index) => (
                          <div key={product.name} className="flex justify-between items-center bg-white p-3 rounded border">
                            <div className="flex items-center">
                              <span className="bg-red-100 text-red-600 text-sm font-medium px-2 py-1 rounded mr-3">
                                #{index + 1}
                              </span>
                              <span className="font-medium">{product.name}</span>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">{product.count}x pedidos</div>
                              <div className="text-gray-600">R$ {product.total.toFixed(2)} total</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status dos Pedidos */}
                  {Object.keys(userStats.statusCount).length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Status dos Pedidos</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(userStats.statusCount).map(([status, count]) => (
                          <span key={status} className={`px-3 py-1 rounded-full text-sm font-medium ${
                            status === 'delivered' ? 'bg-green-100 text-green-800' :
                            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                            status === 'ready' ? 'bg-indigo-100 text-indigo-800' :
                            status === 'out-for-delivery' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status === 'delivered' ? 'Entregues' :
                             status === 'pending' ? 'Pendentes' :
                             status === 'cancelled' ? 'Cancelados' :
                             status === 'confirmed' ? 'Confirmados' :
                             status === 'preparing' ? 'Preparando' :
                             status === 'ready' ? 'Prontos' :
                             status === 'out-for-delivery' ? 'Saiu para entrega' : status} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Histórico de Pedidos */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Histórico de Pedidos ({userOrders.length})
                    </h4>
                    {userOrders.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {userOrders.slice(0, 10).map((order) => (
                            <div key={order.id} className="bg-white p-4 rounded border hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium text-gray-900">Pedido #{order.id.slice(-8)}</div>
                                  <div className="text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg text-gray-900">R$ {order.total.toFixed(2)}</div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'ready' ? 'bg-indigo-100 text-indigo-800' :
                                    order.status === 'out-for-delivery' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status === 'delivered' ? 'Entregue' :
                                     order.status === 'pending' ? 'Pendente' :
                                     order.status === 'cancelled' ? 'Cancelado' :
                                     order.status === 'confirmed' ? 'Confirmado' :
                                     order.status === 'preparing' ? 'Preparando' :
                                     order.status === 'ready' ? 'Pronto' :
                                     order.status === 'out-for-delivery' ? 'Saiu para entrega' : order.status}
                                  </span>
                                </div>
                              </div>
                              <div className="border-t pt-2">
                                <div className="text-sm text-gray-600">Itens:</div>
                                <div className="mt-1 space-y-1">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                      <span>{item.quantity}x {item.menuItem.name}</span>
                                      <span>R$ {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                {order.deliveryAddress && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <strong>Entrega:</strong> {order.deliveryAddress}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {userOrders.length > 10 && (
                            <div className="text-center py-2 text-sm text-gray-600">
                              Mostrando 10 de {userOrders.length} pedidos
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingBag size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Nenhum pedido encontrado</p>
                      </div>
                    )}
                  </div>

                  {/* Informações de Conta */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Informações da Conta</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">UID</label>
                        <p className="text-gray-900 font-mono text-sm break-all">{selectedUser.uid}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Data de Criação</label>
                        <p className="text-gray-900">
                          {selectedUser.createdAt 
                            ? new Date(selectedUser.createdAt).toLocaleString('pt-BR')
                            : 'Não disponível'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Status da Conta</label>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email Verificado</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedUser.emailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedUser.emailVerified ? 'Verificado' : 'Não Verificado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Endereço (se houver) */}
                  {selectedUser.address && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Endereço</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-gray-900">{selectedUser.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-md hover:from-red-700 hover:to-orange-600 transition duration-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
