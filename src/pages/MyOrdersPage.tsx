import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';

export function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Construction className="h-24 w-24 text-yellow-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Página em Construção
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Estamos trabalhando duro para trazer a melhor experiência para você acompanhar seus pedidos. 
            Em breve, você poderá visualizar todo o histórico dos seus pedidos aqui!
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/make-order'}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
            >
              Ver Cardápio
            </Button>
            
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Dashboard</span>
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
               Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
