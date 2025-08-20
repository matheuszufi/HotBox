import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Supplier } from '../types/stock';

export const supplierService = {
  // Buscar todos os fornecedores
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const q = query(suppliersRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Supplier));
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw error;
    }
  },

  // Criar novo fornecedor
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), {
        ...supplierData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error;
    }
  },

  // Atualizar fornecedor
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<void> {
    try {
      const supplierRef = doc(db, 'suppliers', id);
      await updateDoc(supplierRef, supplierData);
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw error;
    }
  },

  // Excluir fornecedor
  async deleteSupplier(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error;
    }
  },

  // Buscar fornecedor por nome
  async findSupplierByName(name: string): Promise<Supplier[]> {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const q = query(
        suppliersRef,
        where('name', '>=', name),
        where('name', '<=', name + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Supplier));
    } catch (error) {
      console.error('Erro ao buscar fornecedor por nome:', error);
      throw error;
    }
  }
};
