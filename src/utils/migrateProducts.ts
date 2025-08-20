
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { menuData } from '../data/menu';

// Função para limpar produtos existentes no Firebase
const clearFirebaseProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const deletePromises = querySnapshot.docs.map(document => 
      deleteDoc(doc(db, 'products', document.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`🗑️ Removidos ${querySnapshot.size} produtos existentes do Firebase`);
  } catch (error) {
    console.error('❌ Erro ao limpar produtos existentes:', error);
    // Não falhar a migração se não conseguir limpar
  }
};

// Função para migrar os dados REAIS do menu (/make-order) para Firebase
export const migrateRealMenuToFirebase = async () => {
  try {
    console.log('🚀 Iniciando migração dos dados REAIS do menu para Firebase...');

    // Usar os dados reais do arquivo menu.ts
    const realMenuData = menuData;
    console.log(`✅ Encontrados ${realMenuData.length} produtos reais do menu`);

    // Limpar produtos existentes no Firebase
    console.log('🧹 Limpando produtos existentes no Firebase...');
    await clearFirebaseProducts();

    // Migrar cada produto para o Firebase
    console.log('📤 Migrando produtos reais para Firebase...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < realMenuData.length; i++) {
      const product = realMenuData[i];
      
      try {
        // Adicionar ao Firebase (mantendo o ID original)
        const docRef = await addDoc(collection(db, 'products'), {
          ...product,
          originalMenuId: product.id, // Manter referência do ID original
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          migratedAt: serverTimestamp(),
          source: 'real-menu' // Marcar como dados reais
        });

        console.log(`✅ Produto "${product.name}" migrado com sucesso (Firebase ID: ${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar produto "${product.name}":`, error);
        errorCount++;
      }
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO (DADOS REAIS):');
    console.log(`✅ Produtos migrados com sucesso: ${successCount}`);
    console.log(`❌ Produtos com erro: ${errorCount}`);
    console.log(`📋 Total de produtos: ${realMenuData.length}`);
    console.log(`🎯 Fonte: Dados reais do menu (/make-order)`);
    
    if (successCount === realMenuData.length) {
      console.log('🎉 Migração dos dados REAIS concluída com sucesso!');
    } else {
      console.log('⚠️ Migração concluída com alguns erros');
    }

    return {
      totalProducts: realMenuData.length,
      successCount,
      errorCount,
      products: realMenuData,
      source: 'real-menu'
    };

  } catch (error) {
    console.error('💥 Erro fatal durante a migração dos dados reais:', error);
    throw error;
  }
};
