import { Link, Navigate } from 'react-router-dom';
import { ChefHat, Clock, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts';
import { Button, Card, CardContent } from '../components';

export function HomePage() {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Redirecionar para o dashboard quando o usuário estiver autenticado
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">
            Bem-vindo ao HotBox
          </h1>
          <p className="text-xl mb-8 text-primary-100">
            Sabores autênticos entregues direto na sua mesa. 
            Experimente nossa culinária única e apaixonante.
          </p>
          
          {isAuthenticated ? (
            <div className="space-x-4">
              {user?.role === 'customer' && (
                <Link to="/make-order">
                  <Button size="lg" variant="secondary">
                    Fazer Pedido <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-black border-white hover:bg-white hover:text-primary-600">
                  Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Começar Agora <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-black border-white hover:bg-white hover:text-primary-600">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <ChefHat className="mx-auto mb-4 text-primary-600" size={48} />
            <h3 className="text-xl font-semibold mb-2">Chefs Especializados</h3>
            <p className="text-gray-600">
              Nossa equipe de chefs experientes prepara cada prato com ingredientes frescos e muito amor.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-4 text-primary-600" size={48} />
            <h3 className="text-xl font-semibold mb-2">Entrega Rápida</h3>
            <p className="text-gray-600">
              Garantimos que sua comida chegue quentinha e no tempo prometido, direto da nossa cozinha.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="mx-auto mb-4 text-primary-600" size={48} />
            <h3 className="text-xl font-semibold mb-2">Qualidade Premium</h3>
            <p className="text-gray-600">
              Utilizamos apenas ingredientes de primeira qualidade para garantir o melhor sabor em cada refeição.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Popular Items Preview */}
      <section className="bg-white rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pratos Populares
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Conheça alguns dos nossos pratos mais pedidos e descobertos por que nossos clientes voltam sempre.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Hambúrguer Artesanal',
              description: 'Carne 100% bovina, queijo especial e molho da casa',
              price: 'R$ 28,90',
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
            },
            {
              name: 'Pizza Margherita',
              description: 'Molho de tomate, mussarela e manjericão fresco',
              price: 'R$ 35,90',
              image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
            },
            {
              name: 'Pasta Carbonara',
              description: 'Macarrão ao molho cremoso com bacon e parmesão',
              price: 'R$ 32,90',
              image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop'
            }
          ].map((item, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                <p className="text-primary-600 font-bold text-lg">{item.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          {isAuthenticated && user?.role === 'customer' ? (
            <Link to="/make-order">
              <Button size="lg">
                Ver Cardápio Completo
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg">
                Cadastre-se para Ver o Cardápio
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="bg-gray-900 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para experimentar?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e tenha acesso ao nosso cardápio completo. 
            Faça seu primeiro pedido e descubra por que somos a escolha favorita da região.
          </p>
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg" variant="primary">
                Criar Conta Grátis
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                Já sou cliente
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
