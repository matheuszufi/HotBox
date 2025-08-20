import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Home, Package, Boxes, DollarSign, ShoppingBag } from 'lucide-react';
import { useAuth, useCart } from '../../contexts';
import { Button } from '../ui';
import HotBoxIcon from '../../assets/images/hotbox2.png';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src={HotBoxIcon} 
            alt="HotBox" 
            className="h-16 w-16" 
          />
          <span className="text-xl font-bold">
            <span className="text-red-600">Hot</span>
            <span className="text-orange-500">Box</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/" 
            className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Home size={18} />
            <span>Início</span>
          </Link>
          
          {isAuthenticated && (
            <>
              {user?.role === 'customer' && (
                <>
                  <Link 
                    to="/make-order" 
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Fazer Pedido
                  </Link>
                  <Link 
                    to="/my-orders" 
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Meus Pedidos
                  </Link>
                </>
              )}
              
              {user?.role === 'admin' && (
                <>
                  <Link 
                    to="/admin/orders" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Package size={18} />
                    <span>Pedidos</span>
                  </Link>
                  <Link 
                    to="/admin/stock" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Boxes size={18} />
                    <span>Estoque</span>
                  </Link>
                  <Link 
                    to="/admin/despesas" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <ShoppingBag size={18} />
                    <span>Despesas</span>
                  </Link>
                  <Link 
                    to="/admin/finance" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <DollarSign size={18} />
                    <span>Finanças</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Cart (only for customers) */}
              {user?.role === 'customer' && (
                <Link 
                  to="/cart" 
                  className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCart size={20} />
                  {cart.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 text-xs text-white flex items-center justify-center">
                      {cart.itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User menu */}
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{user?.name}</span>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Cadastrar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
