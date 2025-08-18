import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import { Button, Card, CardContent } from '../components/ui';

export function OrderSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pedido Realizado com Sucesso!
            </h1>
            <p className="text-gray-600">
              Seu pedido foi recebido e está sendo preparado. 
              Você receberá atualizações sobre o status da entrega.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              <strong>Tempo estimado de entrega:</strong> 30-45 minutos
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para Dashboard
            </Button>
            
            <Button
              onClick={() => navigate('/make-order')}
              variant="outline"
              className="w-full"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Fazer Novo Pedido
            </Button>
          </div>

          <p className="text-gray-500 text-xs mt-6">
            Redirecionando automaticamente em 10 segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
