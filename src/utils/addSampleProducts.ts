import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Script para adicionar produtos de exemplo ao Firebase
const sampleProducts = [
  {
    name: 'HotBox Clássico',
    description: 'Hambúrguer artesanal com carne bovina, alface, tomate, cebola roxa e molho especial',
    price: 25.90,
    category: 'hamburguer',
    available: true,
    image: '/images/hotbox-classico.jpg',
    ingredients: ['Pão brioche', 'Carne bovina 150g', 'Alface', 'Tomate', 'Cebola roxa', 'Molho especial']
  },
  {
    name: 'HotBox BBQ',
    description: 'Hambúrguer com carne bovina, bacon, queijo cheddar e molho barbecue',
    price: 29.90,
    category: 'hamburguer',
    available: true,
    image: '/images/hotbox-bbq.jpg',
    ingredients: ['Pão brioche', 'Carne bovina 150g', 'Bacon', 'Queijo cheddar', 'Molho BBQ']
  },
  {
    name: 'Fritas Tradicionais',
    description: 'Batatas fritas crocantes temperadas com sal',
    price: 12.90,
    category: 'acompanhamento',
    available: true,
    image: '/images/fritas-tradicionais.jpg',
    ingredients: ['Batata', 'Sal', 'Óleo vegetal']
  },
  {
    name: 'Coca-Cola 350ml',
    description: 'Refrigerante Coca-Cola gelado',
    price: 6.90,
    category: 'bebida',
    available: true,
    image: '/images/coca-cola.jpg',
    ingredients: ['Água', 'Açúcar', 'Extrato de noz de cola']
  },
  {
    name: 'HotBox Vegano',
    description: 'Hambúrguer vegano com proteína de soja e vegetais frescos',
    price: 27.90,
    category: 'hamburguer',
    available: true,
    image: '/images/hotbox-vegano.jpg',
    ingredients: ['Pão integral', 'Proteína de soja', 'Alface', 'Tomate', 'Abacate', 'Molho vegano']
  }
];

export const addSampleProducts = async () => {
  try {
    console.log('🔄 Adicionando produtos de exemplo...');
    
    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    console.log('✅ Produtos de exemplo adicionados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar produtos de exemplo:', error);
  }
};

// Para executar este script, importe e chame a função em um componente ou console
// addSampleProducts();
