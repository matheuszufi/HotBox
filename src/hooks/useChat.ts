import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ChatMessage } from '../types/chat';

interface UseChatProps {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'customer' | 'admin';
}

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendMessage: (message: string) => Promise<void>;
  chatId: string | null;
  refresh: () => Promise<void>;
}

export const useChat = ({ userId, userName, userEmail, userRole }: UseChatProps): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  const chatsCollection = useMemo(() => collection(db, 'chats'), []);
  const messagesCollection = useMemo(() => collection(db, 'messages'), []);

  // Função para criar ou obter chat
  const getOrCreateChat = useCallback(async (): Promise<string> => {
    try {
      // Buscar chat existente (sem orderBy para evitar índice)
      const q = query(
        chatsCollection,
        where('customerId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingChat = querySnapshot.docs[0];
        return existingChat.id;
      }

      // Criar novo chat
      const newChat = {
        customerId: userId,
        customerName: userName,
        customerEmail: userEmail,
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: 0, // Mensagens não lidas pelo cliente
        unreadCountForAdmin: 0, // Mensagens não lidas pelo admin
        priority: 'medium',
        category: 'general'
      };

      const docRef = await addDoc(chatsCollection, newChat);
      
      // Adicionar mensagem de boas-vindas
      await addDoc(messagesCollection, {
        chatId: docRef.id,
        senderId: 'system',
        senderName: 'Equipe HotBox',
        senderRole: 'admin',
        message: `Olá ${userName}! Bem-vindo ao suporte da HotBox. Como podemos ajudá-lo hoje?`,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar/obter chat:', error);
      throw error;
    }
  }, [userId, userName, userEmail, chatsCollection, messagesCollection]);

  // Função para enviar mensagem
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      let currentChatId = chatId;
      
      if (!currentChatId) {
        currentChatId = await getOrCreateChat();
        setChatId(currentChatId);
      }

      // Enviar mensagem
      await addDoc(messagesCollection, {
        chatId: currentChatId,
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        message: message.trim(),
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      });

      // Atualizar chat
      await updateDoc(doc(chatsCollection, currentChatId), {
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Erro ao enviar mensagem. Tente novamente.');
      throw error;
    } finally {
      setSending(false);
    }
  }, [chatId, userId, userName, userRole, sending, getOrCreateChat, chatsCollection, messagesCollection]);

  // Função para recarregar mensagens
  const refresh = useCallback(async (): Promise<void> => {
    if (!chatId) return;

    try {
      const q = query(
        messagesCollection,
        where('chatId', '==', chatId)
      );

      const querySnapshot = await getDocs(q);
      const fetchedMessages: ChatMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          message: data.message,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
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
    } catch (error) {
      console.error('Erro ao recarregar mensagens:', error);
    }
  }, [chatId, messagesCollection]);

  // Inicialização
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentChatId = await getOrCreateChat();
        setChatId(currentChatId);

        // Configurar listener em tempo real para mensagens
        const q = query(
          messagesCollection,
          where('chatId', '==', currentChatId)
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
          setLoading(false);
        }, (error) => {
          console.error('Erro no listener de mensagens:', error);
          setError('Erro ao conectar com o chat em tempo real.');
          setLoading(false);
        });

        return unsubscribe;
      } catch (error: any) {
        console.error('Erro ao inicializar chat:', error);
        setError(error.message || 'Erro ao inicializar chat.');
        setLoading(false);
      }
    };

    if (userId) {
      const unsubscribePromise = initializeChat();
      
      return () => {
        unsubscribePromise.then(unsubscribe => {
          if (unsubscribe) {
            unsubscribe();
          }
        });
      };
    }
  }, [userId, getOrCreateChat, messagesCollection]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    chatId,
    refresh
  };
};
