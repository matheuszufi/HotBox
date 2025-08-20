import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Script para adicionar usuários de exemplo ao Firebase
const sampleUsers = [
  {
    name: 'João Silva',
    email: 'joao.silva@hotbox.com',
    phone: '(11) 99999-1234',
    role: 'admin',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 98888-5678',
    role: 'customer',
    address: 'Av. Paulista, 456 - São Paulo, SP',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    phone: '(11) 97777-9012',
    role: 'customer',
    address: 'Rua Augusta, 789 - São Paulo, SP',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 96666-3456',
    role: 'customer',
    address: 'Rua da Liberdade, 321 - São Paulo, SP',
    createdAt: new Date().toISOString(),
  }
];

export const addSampleUsers = async () => {
  try {
    console.log('🔄 Adicionando usuários de exemplo...');
    
    for (const user of sampleUsers) {
      await addDoc(collection(db, 'users'), {
        ...user,
        updatedAt: serverTimestamp(),
      });
    }
    
    console.log('✅ Usuários de exemplo adicionados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar usuários de exemplo:', error);
  }
};
