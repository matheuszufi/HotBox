import { Link, Navigate } from 'react-router-dom';
import { ChefHat, Clock, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts';
import { Button, Card, CardContent } from '../components';
import HotBoxIcon from '../assets/images/hotbox2.png';
import HeroBackground from '../assets/images/hero.png';
import { menuData } from '../data/menu';

export function HomePage() {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Redirecionar para o dashboard quando o usuário estiver autenticado
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section 
        className="text-center py-16 text-white rounded-2xl relative overflow-hidden"
        style={{
          backgroundImage: `url(${HeroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay para garantir legibilidade do texto */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src={HotBoxIcon} 
              alt="HotBox Logo" 
              className="h-36 w-36 mx-auto mb-4"
            />
          </div>
          
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-red-500">Hot</span>
            <span className="text-orange-500">Box</span>
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
                {/* <Button size="lg" variant="secondary">
                  Começar Agora <ArrowRight className="ml-2" size={20} />
                </Button> */}
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-red-500 border-white hover:bg-white hover:text-primary-600">
                  Entrar
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
            menuData.find(item => item.id === 'arroz'),
            menuData.find(item => item.id === 'costela-boi'),
            menuData.find(item => item.id === 'macarrao-bolonhesa')
          ].filter(Boolean).map((item, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video">
                <img 
                  src={item!.image} 
                  alt={item!.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item!.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{item!.description}</p>
                <p className="text-primary-600 font-bold text-lg">
                  R$ {item!.price.toFixed(2).replace('.', ',')}
                </p>
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
