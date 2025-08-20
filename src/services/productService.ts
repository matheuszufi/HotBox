import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MenuItem } from '../types';

export const productService = {
  // Get all products from Firebase
  async getProducts(): Promise<MenuItem[]> {
    try {
      console.log('🔄 Buscando produtos no Firebase...');
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      
      console.log('✅ Produtos encontrados:', products);
      return products;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos no Firebase:', error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('category', '==', category),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      return [];
    }
  },

  // Get product by ID
  async getProductById(id: string): Promise<MenuItem | null> {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as MenuItem;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar produto por ID:', error);
      return null;
    }
  },

  // Add new product
  async addProduct(productData: Omit<MenuItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    }
  },

  // Update product
  async updateProduct(id: string, productData: Partial<MenuItem>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      throw error;
    }
  },

  // Get available products only
  async getAvailableProducts(): Promise<MenuItem[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('available', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
    } catch (error) {
      console.error('Erro ao buscar produtos disponíveis:', error);
      return [];
    }
  },
};
