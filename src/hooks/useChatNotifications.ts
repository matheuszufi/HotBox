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
        const unreadCount = chats.filter(chat => 
          chat.unreadCount > 0 && chat.status !== 'closed'
        ).length;
        
        setUnreadChats(unreadCount);
        setLoading(false);
      });

      return unsubscribe;
    }

    // Para admins: verificar todos os chats com mensagens não lidas de clientes
    if (user.role === 'admin') {
      const unsubscribe = chatService.subscribeToChats((chats: Chat[]) => {
        const unreadCount = chats.filter(chat => 
          chat.unreadCount > 0 && chat.status !== 'closed'
        ).length;
        
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
