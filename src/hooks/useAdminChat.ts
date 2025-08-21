import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Chat, ChatMessage } from '../types/chat';

interface UseAdminChatReturn {
  chats: Chat[];
  activeChat: Chat | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  updateChatStatus: (chatId: string, status: Chat['status']) => Promise<void>;
}

export const useAdminChat = (adminId: string, adminName: string): UseAdminChatReturn => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const chatsCollection = useMemo(() => collection(db, 'chats'), []);
  const messagesCollection = useMemo(() => collection(db, 'messages'), []);

  // Função para enviar mensagem como admin
  const sendMessage = useCallback(async (chatId: string, message: string): Promise<void> => {
    if (!message.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      // Enviar mensagem
      await addDoc(messagesCollection, {
        chatId,
        senderId: adminId,
        senderName: adminName,
        senderRole: 'admin',
        message: message.trim(),
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      });

      // Atualizar chat
      await updateDoc(doc(chatsCollection, chatId), {
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'in_progress',
        adminId,
        adminName
      });

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Erro ao enviar mensagem. Tente novamente.');
      throw error;
    } finally {
      setSending(false);
    }
  }, [adminId, adminName, sending, chatsCollection, messagesCollection]);

  // Função para atualizar status do chat
  const updateChatStatus = useCallback(async (chatId: string, status: Chat['status']): Promise<void> => {
    try {
      await updateDoc(doc(chatsCollection, chatId), {
        status,
        updatedAt: serverTimestamp(),
        adminId,
        adminName
      });

      // Enviar mensagem do sistema sobre mudança de status
      if (status === 'closed') {
        await addDoc(messagesCollection, {
          chatId,
          senderId: 'system',
          senderName: 'Equipe HotBox',
          senderRole: 'admin',
          message: 'Este chat foi encerrado pela equipe de suporte.',
          timestamp: serverTimestamp(),
          read: false,
          type: 'system'
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar status do chat.');
      throw error;
    }
  }, [adminId, adminName, chatsCollection, messagesCollection]);

  // Listener para chats (simplificado)
  useEffect(() => {
    console.log('🔄 Iniciando listener para chats...');
    console.log('Admin ID:', adminId);
    console.log('Admin Name:', adminName);
    
    // Query mais simples sem orderBy para evitar índices
    const q = query(chatsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('📥 Snapshot recebido - Documentos:', querySnapshot.docs.length);
      
      const fetchedChats: Chat[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Chat doc:', doc.id, data);
        return {
          id: doc.id,
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          status: data.status,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
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

      // Ordenar no cliente para evitar índices
      fetchedChats.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // Mais recentes primeiro
      });

      console.log('✅ Chats processados:', fetchedChats.length, fetchedChats);
      setChats(fetchedChats);
      setLoading(false);
    }, (error) => {
      console.error('❌ Erro no listener de chats:', error);
      setError('Erro ao conectar com os chats.');
      setLoading(false);
    });

    return unsubscribe;
  }, [chatsCollection, adminId, adminName]);

  // Listener para mensagens do chat ativo (simplificado)
  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([]);
      return;
    }

    const q = query(
      messagesCollection,
      where('chatId', '==', activeChat.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = querySnapshot.docs.map(doc => {
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

      // Ordenar no cliente para evitar índices
      fetchedMessages.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateA - dateB; // Mais antigas primeiro
      });

      setMessages(fetchedMessages);
    }, (error) => {
      console.error('Erro no listener de mensagens:', error);
      setError('Erro ao carregar mensagens.');
    });

    return unsubscribe;
  }, [activeChat?.id, messagesCollection]);

  return {
    chats,
    activeChat,
    messages,
    loading,
    error,
    sending,
    setActiveChat,
    sendMessage,
    updateChatStatus
  };
};
