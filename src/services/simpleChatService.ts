import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Chat, ChatMessage } from '../types/chat';

class SimpleChatService {
  private chatsCollection = collection(db, 'chats');
  private messagesCollection = collection(db, 'messages');

  // Método de teste para verificar conectividade básica
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Tentar uma query simples
      const testQuery = query(this.chatsCollection, limit(1));
      await getDocs(testQuery);
      return { success: true };
    } catch (error: any) {
      console.error('Erro de conectividade:', error);
      return { 
        success: false, 
        error: error.message || 'Erro de conectividade com Firebase'
      };
    }
  }

  // Buscar chats de um cliente específico (versão simplificada)
  async getCustomerChats(customerId: string): Promise<Chat[]> {
    try {
      const q = query(
        this.chatsCollection,
        where('customerId', '==', customerId),
        orderBy('updatedAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const chats: Chat[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          status: data.status || 'waiting',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime instanceof Timestamp ? data.lastMessageTime.toDate().toISOString() : data.lastMessageTime,
          unreadCount: data.unreadCount || 0,
          adminId: data.adminId,
          adminName: data.adminName,
          priority: data.priority || 'medium',
          category: data.category || 'general',
          orderId: data.orderId
        } as Chat;
      });

      return chats;
    } catch (error) {
      console.error('Erro ao buscar chats do cliente:', error);
      return [];
    }
  }

  // Criar chat simples
  async createSimpleChat(customerData: { id: string; name: string; email: string }): Promise<string> {
    try {
      const newChat = {
        customerId: customerData.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: 0,
        priority: 'medium',
        category: 'general'
      };

      const docRef = await addDoc(this.chatsCollection, newChat);
      
      // Adicionar mensagem de boas-vindas
      await this.sendSimpleMessage(docRef.id, {
        senderId: 'system',
        senderName: 'Equipe HotBox',
        senderRole: 'admin',
        message: `Olá ${customerData.name}! Bem-vindo ao suporte da HotBox. Como podemos ajudá-lo hoje?`
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      throw error;
    }
  }

  // Enviar mensagem simples
  async sendSimpleMessage(
    chatId: string, 
    messageData: {
      senderId: string;
      senderName: string;
      senderRole: 'customer' | 'admin';
      message: string;
    }
  ): Promise<void> {
    try {
      const newMessage = {
        chatId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        message: messageData.message,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      };

      await addDoc(this.messagesCollection, newMessage);

      // Atualizar chat
      await updateDoc(doc(this.chatsCollection, chatId), {
        lastMessage: messageData.message,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Buscar mensagens de um chat (versão simplificada)
  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        this.messagesCollection,
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          message: data.message,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString(),
          read: data.read || false,
          type: data.type || 'text',
          attachmentUrl: data.attachmentUrl
        } as ChatMessage;
      });

      return messages;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }

  // Buscar ou criar chat para um cliente
  async getOrCreateSimpleChat(customerData: { id: string; name: string; email: string }): Promise<string> {
    try {
      const existingChats = await this.getCustomerChats(customerData.id);
      
      // Se tem chat ativo, usar ele
      const activeChat = existingChats.find(chat => chat.status !== 'closed');
      if (activeChat) {
        return activeChat.id;
      }

      // Criar novo chat
      return await this.createSimpleChat(customerData);
    } catch (error) {
      console.error('Erro ao buscar/criar chat:', error);
      // Se falhar, criar novo chat
      return await this.createSimpleChat(customerData);
    }
  }
}

export const simpleChatService = new SimpleChatService();
