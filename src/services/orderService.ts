import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
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

      // Calcular total do pedido
      const total = orderData.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

      // Criar objeto do pedido para Firestore
      const orderForFirestore = {
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userEmail: user.email,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Salvando no Firestore:', orderForFirestore);

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

      // Buscar pedidos do usuário no Firestore
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const order: Order = {
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Usuário',
          userEmail: data.userEmail || '',
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
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
        orders.push(order);
      });

      console.log(`✅ Encontrados ${orders.length} pedidos`);
      return orders;
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return [];
    }
  }
};
