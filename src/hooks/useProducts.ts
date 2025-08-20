import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { MenuItem } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError('Erro ao carregar os produtos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Function to get products by category
  const getProductsByCategory = (category: string): MenuItem[] => {
    return products.filter(product => product.category === category);
  };

  // Function to get product by ID
  const getProductById = (id: string): MenuItem | undefined => {
    return products.find(product => product.id === id);
  };

  // Function to refetch products
  const refetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao recarregar produtos:', err);
      setError('Erro ao recarregar os produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    getProductsByCategory,
    getProductById,
    refetchProducts,
  };
};
