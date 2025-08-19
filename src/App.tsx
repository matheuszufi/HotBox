import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, CartProvider } from './contexts';
import { Layout, ProtectedRoute } from './components';
import { 
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  EditProfilePage,
  MenuPage,
  CheckoutPage,
  OrderSuccessPage,
  MyOrdersPage,
  AdminOrdersPage,
  AdminStockPage,
  AdminFinancePage
} from './pages';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Routes with layout */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Customer only routes */}
              <Route 
                path="/make-order" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Layout>
                      <MenuPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Layout>
                      <CheckoutPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/order-success" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Layout>
                      <OrderSuccessPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/my-orders" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Layout>
                      <MyOrdersPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditProfilePage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin only routes */}
              <Route 
                path="/admin/orders" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminOrdersPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/stock" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminStockPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/finance" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminFinancePage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Cart route (customer only) */}
              <Route 
                path="/cart" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Layout>
                      <div className="text-center py-20">
                        <h1 className="text-2xl font-bold">Página em Desenvolvimento</h1>
                        <p className="text-gray-600 mt-2">O carrinho será implementado em breve.</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route 
                path="*" 
                element={
                  <Layout>
                    <div className="text-center py-20">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-8">Página não encontrada</p>
                      <a href="/" className="text-primary-600 hover:text-primary-700">
                        Voltar para o início
                      </a>
                    </div>
                  </Layout>
                } 
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
