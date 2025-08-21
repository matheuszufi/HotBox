import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Chat, ChatMessage } from '../types/chat';

class ChatService {
  private chatsCollection = collection(db, 'chats');
  private messagesCollection = collection(db, 'messages');

  // Criar um novo chat
  async createChat(customerData: { id: string; name: string; email: string }, orderId?: string): Promise<string> {
    try {
      const newChat: Omit<Chat, 'id'> = {
        customerId: customerData.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
        priority: 'medium',
        category: orderId ? 'order' : 'general',
        orderId
      };

      const docRef = await addDoc(this.chatsCollection, {
        ...newChat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Mensagem de boas-vindas automática
      await this.sendSystemMessage(
        docRef.id,
        `Olá ${customerData.name}! Bem-vindo ao suporte da HotBox. Como podemos ajudá-lo hoje?`
      );

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      throw error;
    }
  }

  // Enviar mensagem
  async sendMessage(
    chatId: string, 
    senderId: string, 
    senderName: string, 
    senderRole: 'customer' | 'admin',
    message: string,
    type: 'text' | 'image' = 'text',
    attachmentUrl?: string
  ): Promise<void> {
    try {
      const newMessage: any = {
        chatId,
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: serverTimestamp(),
        read: false,
        type
      };

      // Só adicionar attachmentUrl se não for undefined
      if (attachmentUrl) {
        newMessage.attachmentUrl = attachmentUrl;
      }

      await addDoc(this.messagesCollection, newMessage);

      // Atualizar chat com última mensagem
      await updateDoc(doc(this.chatsCollection, chatId), {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        unreadCount: senderRole === 'customer' ? 1 : 0
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Enviar mensagem do sistema
  async sendSystemMessage(chatId: string, message: string): Promise<void> {
    try {
      const systemMessage = {
        chatId,
        senderId: 'system',
        senderName: 'Equipe HotBox',
        senderRole: 'admin',
        message,
        timestamp: serverTimestamp(),
        read: false,
        type: 'system'
      };

      await addDoc(this.messagesCollection, systemMessage);

    } catch (error) {
      console.error('Erro ao enviar mensagem do sistema:', error);
      throw error;
    }
  }

  // Buscar ou criar chat para um cliente
  async getOrCreateCustomerChat(customerData: { id: string; name: string; email: string }): Promise<string> {
    try {
      // Verificar se já existe um chat ativo para este cliente
      const q = query(
        this.chatsCollection,
        where('customerId', '==', customerData.id),
        where('status', 'in', ['active', 'waiting'])
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Retornar chat existente
        return querySnapshot.docs[0].id;
      } else {
        // Criar novo chat
        return await this.createChat(customerData);
      }
    } catch (error) {
      console.error('Erro ao buscar/criar chat:', error);
      // Se falhar na busca, criar novo chat
      return await this.createChat(customerData);
    }
  }

  // Listar todos os chats (para admin)
  subscribeToChats(callback: (chats: Chat[]) => void): () => void {
    // Query simples sem orderBy para evitar índices
    const q = query(this.chatsCollection);

    return onSnapshot(q, (querySnapshot) => {
      const chats: Chat[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          lastMessageTime: data.lastMessageTime instanceof Timestamp ? data.lastMessageTime.toDate().toISOString() : data.lastMessageTime
        } as Chat;
      });
      
      // Ordenar no cliente para evitar índices
      chats.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // Mais recentes primeiro
      });
      
      callback(chats);
    });
  }

  // Listar chats de um cliente específico
  subscribeToCustomerChats(customerId: string, callback: (chats: Chat[]) => void): () => void {
    const q = query(
      this.chatsCollection,
      where('customerId', '==', customerId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const chats: Chat[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          lastMessageTime: data.lastMessageTime instanceof Timestamp ? data.lastMessageTime.toDate().toISOString() : data.lastMessageTime
        } as Chat;
      });
      
      // Ordenar no cliente para evitar índices
      chats.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // Mais recentes primeiro
      });
      
      callback(chats);
    });
  }

  // Buscar mensagens de um chat
  subscribeToChatMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      this.messagesCollection,
      where('chatId', '==', chatId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const message: ChatMessage = {
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          message: data.message,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString(),
          read: data.read || false,
          type: data.type || 'text'
        };
        
        // Só adicionar attachmentUrl se existir
        if (data.attachmentUrl) {
          message.attachmentUrl = data.attachmentUrl;
        }
        
        return message;
      });
      
      // Ordenar no cliente para evitar índices
      messages.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateA - dateB; // Mais antigas primeiro
      });
      
      callback(messages);
    });
  }

  // Marcar mensagens como lidas
  async markMessagesAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      const updatePromises = messageIds.map(messageId =>
        updateDoc(doc(this.messagesCollection, messageId), { read: true })
      );
      
      await Promise.all(updatePromises);

      // Resetar contador de mensagens não lidas
      await updateDoc(doc(this.chatsCollection, chatId), {
        unreadCount: 0
      });

    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }

  // Atualizar status do chat
  async updateChatStatus(chatId: string, status: Chat['status'], adminId?: string, adminName?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (adminId && adminName) {
        updateData.adminId = adminId;
        updateData.adminName = adminName;
      }

      await updateDoc(doc(this.chatsCollection, chatId), updateData);

      // Enviar mensagem do sistema sobre mudança de status
      if (status === 'closed') {
        await this.sendSystemMessage(
          chatId,
          'Este chat foi encerrado. Se precisar de mais ajuda, inicie uma nova conversa.'
        );
      }

    } catch (error) {
      console.error('Erro ao atualizar status do chat:', error);
      throw error;
    }
  }

  // Atualizar prioridade do chat
  async updateChatPriority(chatId: string, priority: Chat['priority']): Promise<void> {
    try {
      await updateDoc(doc(this.chatsCollection, chatId), {
        priority,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar prioridade do chat:', error);
      throw error;
    }
  }

  // Método de teste para verificar conectividade
  async testConnection(): Promise<boolean> {
    try {
      // Tentar uma operação simples no Firestore
      const testQuery = query(this.chatsCollection);
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.error('Erro de conectividade com Firestore:', error);
      return false;
    }
  }

  // Buscar estatísticas de chat para admin
  async getChatStats(): Promise<{
    totalChats: number;
    activeChats: number;
    waitingChats: number;
    avgResponseTime: number;
    customerSatisfaction: number;
  }> {
    try {
      const querySnapshot = await getDocs(this.chatsCollection);
      const chats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chat[];

      const totalChats = chats.length;
      const activeChats = chats.filter(chat => chat.status === 'active').length;
      const waitingChats = chats.filter(chat => chat.status === 'waiting').length;

      return {
        totalChats,
        activeChats,
        waitingChats,
        avgResponseTime: 15, // Estimativa em minutos
        customerSatisfaction: 4.2 // Estimativa
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalChats: 0,
        activeChats: 0,
        waitingChats: 0,
        avgResponseTime: 0,
        customerSatisfaction: 0
      };
    }
  }
}

export const chatService = new ChatService();
