import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import type { Chat } from '../types/chat';

interface ChatNotifications {
  unreadChats: number;
  hasUnreadMessages: boolean;
  loading: boolean;
}

export const useChatNotifications = (): ChatNotifications => {
  const { user } = useAuth();
  const [unreadChats, setUnreadChats] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadChats(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Para clientes: verificar chats próprios com mensagens não lidas do admin
    if (user.role === 'customer') {
      const unsubscribe = chatService.subscribeToCustomerChats(user.uid, (chats: Chat[]) => {
        console.log('📱 [Cliente] Chats recebidos:', chats.map(c => ({ 
          id: c.id.slice(-8), 
          unreadCount: c.unreadCount, 
          unreadCountForAdmin: c.unreadCountForAdmin,
          status: c.status,
          lastMessage: c.lastMessage?.slice(0, 20) + '...'
        })));
        
        // Contar quantos chats têm mensagens não lidas do admin para o cliente
        let totalUnreadChats = 0;
        
        chats.forEach(chat => {
          // Se o chat tem unreadCount > 0, significa que o admin enviou mensagens não lidas
          if (chat.unreadCount > 0 && chat.status !== 'closed') {
            totalUnreadChats++;
            console.log('📱 [Cliente] Chat com mensagens não lidas:', {
              id: chat.id.slice(-8),
              unreadCount: chat.unreadCount,
              lastMessage: chat.lastMessage?.slice(0, 30)
            });
          }
        });
        
        console.log('📱 [Cliente] Total de chats com mensagens não lidas:', totalUnreadChats);
        setUnreadChats(totalUnreadChats);
        setLoading(false);
      });

      return unsubscribe;
    }

    // Para admins: verificar todos os chats com mensagens não lidas de clientes
    if (user.role === 'admin') {
      const unsubscribe = chatService.subscribeToChats((chats: Chat[]) => {
        console.log('👨‍💼 [Admin] Chats recebidos:', chats.map(c => ({ 
          id: c.id.slice(-8), 
          unreadCountForAdmin: c.unreadCountForAdmin, 
          status: c.status 
        })));
        
        const unreadCount = chats.filter(chat => 
          (chat.unreadCountForAdmin || 0) > 0 && chat.status !== 'closed'
        ).length;
        
        console.log('👨‍💼 [Admin] Total de chats com mensagens não lidas:', unreadCount);
        setUnreadChats(unreadCount);
        setLoading(false);
      });

      return unsubscribe;
    }

    setLoading(false);
  }, [user?.uid, user?.role]);

  return {
    unreadChats,
    hasUnreadMessages: unreadChats > 0,
    loading
  };
};
