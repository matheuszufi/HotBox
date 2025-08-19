import { collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { CreateOrderData, Order } from '../types';

export const orderService = {
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      // Verificar se usuário está autenticado
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔄 Criando pedido no Firestore...');
      console.log('📦 OrderData:', orderData);
      console.log('📞 Telefone do usuário no orderData:', orderData.userPhone);

      // Calcular total do pedido
      const total = orderData.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

      // Criar objeto do pedido para Firestore
      const orderForFirestore = {
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userEmail: user.email,
        userPhone: orderData.userPhone || null,
        items: orderData.items.map(item => ({
          menuItemId: item.menuItem.id,
          menuItemName: item.menuItem.name,
          menuItemPrice: item.menuItem.price,
          quantity: item.quantity,
          subtotal: item.menuItem.price * item.quantity
        })),
        total,
        status: 'pending' as const,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes || null,
        deliveryType: orderData.deliveryType || 'today',
        deliveryDate: orderData.deliveryDate, // Data de entrega sempre preenchida
        deliveryDateTime: orderData.deliveryDateTime, // Data e hora combinadas para ordenação
        scheduledDate: orderData.scheduledDate || null,
        scheduledTime: orderData.scheduledTime || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Objeto que será salvo no Firestore:');
      console.log('📞 userPhone:', orderForFirestore.userPhone);
      console.log('👤 userEmail:', orderForFirestore.userEmail);
      console.log('📦 Objeto completo:', orderForFirestore);

      // Adicionar ao Firestore
      const docRef = await addDoc(collection(db, 'orders'), orderForFirestore);

      console.log('✅ Pedido criado com sucesso! ID:', docRef.id);

      // Retornar o pedido criado
      const createdOrder: Order = {
        id: docRef.id,
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userEmail: user.email || '',
        items: orderData.items,
        total,
        status: 'pending',
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        deliveryType: orderData.deliveryType || 'today',
        deliveryDate: orderData.deliveryDate,
        deliveryDateTime: orderData.deliveryDateTime,
        scheduledDate: orderData.scheduledDate,
        scheduledTime: orderData.scheduledTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return createdOrder;
    } catch (error) {
      console.error('❌ Erro ao criar pedido no Firestore:', error);
      throw new Error('Erro ao criar pedido. Tente novamente.');
    }
  },

  async getMyOrders(): Promise<Order[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ Usuário não autenticado para buscar pedidos');
        return [];
      }

      console.log('🔍 Buscando pedidos do usuário:', user.uid);
      console.log('👤 Dados do usuário atual:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });

      // Primeiro, vamos tentar buscar TODOS os documentos da coleção orders para debug
      console.log('🔍 Verificando todos os documentos na coleção orders...');
      const allOrdersSnapshot = await getDocs(collection(db, 'orders'));
      console.log(`📊 Total de documentos na coleção orders: ${allOrdersSnapshot.size}`);
      
      allOrdersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📄 Documento ${doc.id}:`, {
          userId: data.userId,
          userEmail: data.userEmail,
          createdAt: data.createdAt,
          total: data.total
        });
      });

      // Agora buscar pedidos do usuário específico
      console.log('🎯 Buscando pedidos específicos do usuário...');
      
      // Vamos tentar sem orderBy primeiro para evitar problemas de índice
      console.log('� Tentando busca SEM orderBy...');
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(ordersQuery);
      console.log(`📋 Busca SEM orderBy: ${querySnapshot.size} pedidos encontrados`);
      
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        console.log(`📦 Processando pedido ${doc.id}...`);
        const data = doc.data();
        const order: Order = {
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Usuário',
          userEmail: data.userEmail || '',
          userPhone: data.userPhone || null,
          items: data.items.map((item: any) => ({
            menuItem: {
              id: item.menuItemId,
              name: item.menuItemName,
              price: item.menuItemPrice,
              description: '',
              category: '',
              image: '',
              available: true
            },
            quantity: item.quantity
          })),
          total: data.total,
          status: data.status,
          deliveryAddress: data.deliveryAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          deliveryType: data.deliveryType || 'today',
          deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0], // Fallback para pedidos antigos
          deliveryDateTime: data.deliveryDateTime || (() => {
            // Fallback para pedidos antigos sem deliveryDateTime
            if (data.scheduledDate && data.scheduledTime) {
              return `${data.scheduledDate}T${data.scheduledTime}:00`;
            } else {
              const createdAt = data.createdAt?.toDate?.() || new Date();
              createdAt.setMinutes(createdAt.getMinutes() + 30);
              return createdAt.toISOString();
            }
          })(),
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
        orders.push(order);
        console.log(`✅ Pedido ${doc.id} processado:`, order);
      });

      console.log(`📊 Total de pedidos retornados: ${orders.length}`);
      return orders;
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return [];
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🗑️ Deletando pedido:', orderId);
      
      // Deletar o documento do Firestore
      await deleteDoc(doc(db, 'orders', orderId));
      
      console.log('✅ Pedido deletado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao deletar pedido:', error);
      throw new Error('Erro ao deletar pedido. Tente novamente.');
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ Usuário não autenticado para buscar todos os pedidos');
        return [];
      }

      console.log('🔍 Buscando todos os pedidos (admin)...');

      // Buscar todos os pedidos
      const allOrdersSnapshot = await getDocs(collection(db, 'orders'));
      console.log(`📊 Total de pedidos encontrados: ${allOrdersSnapshot.size}`);
      
      const orders: Order[] = [];

      allOrdersSnapshot.forEach((doc) => {
        console.log(`📦 Processando pedido ${doc.id}...`);
        const data = doc.data();
        console.log(`📞 Telefone encontrado no Firestore para pedido ${doc.id}:`, data.userPhone);
        const order: Order = {
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Usuário',
          userEmail: data.userEmail || '',
          userPhone: data.userPhone || null,
          items: data.items.map((item: any) => ({
            menuItem: {
              id: item.menuItemId,
              name: item.menuItemName,
              price: item.menuItemPrice,
              description: '',
              category: '',
              image: '',
              available: true
            },
            quantity: item.quantity
          })),
          total: data.total,
          status: data.status,
          deliveryAddress: data.deliveryAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          deliveryType: data.deliveryType || 'today',
          deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0], // Fallback para pedidos antigos
          deliveryDateTime: data.deliveryDateTime || (() => {
            // Fallback para pedidos antigos sem deliveryDateTime
            if (data.scheduledDate && data.scheduledTime) {
              return `${data.scheduledDate}T${data.scheduledTime}:00`;
            } else {
              const createdAt = data.createdAt?.toDate?.() || new Date();
              createdAt.setMinutes(createdAt.getMinutes() + 30);
              return createdAt.toISOString();
            }
          })(),
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
        orders.push(order);
      });

      // Ordenar por data/hora de entrega (mais próximos primeiro)
      orders.sort((a, b) => {
        const dateA = new Date(a.deliveryDateTime || a.createdAt);
        const dateB = new Date(b.deliveryDateTime || b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(`📊 Total de pedidos retornados: ${orders.length}`);
      return orders;
    } catch (error) {
      console.error('❌ Erro ao buscar todos os pedidos:', error);
      return [];
    }
  },

  async updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`🔄 Atualizando status do pedido ${orderId} para ${newStatus}...`);
      
      // Atualizar o documento no Firestore
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Status do pedido atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar status do pedido:', error);
      throw new Error('Erro ao atualizar status do pedido. Tente novamente.');
    }
  }
};
