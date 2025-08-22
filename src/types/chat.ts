export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'system';
  attachmentUrl?: string;
}

export interface Chat {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'closed' | 'waiting';
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number; // Mensagens não lidas pelo cliente (enviadas pelo admin)
  unreadCountForAdmin?: number; // Mensagens não lidas pelo admin (enviadas pelo cliente)
  adminId?: string;
  adminName?: string;
  priority: 'low' | 'medium' | 'high';
  category?: 'support' | 'order' | 'complaint' | 'general';
  orderId?: string; // Vinculado a um pedido específico
}

export interface ChatContext {
  chats: Chat[];
  activeChat: Chat | null;
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (chatId: string, message: string, type?: 'text' | 'image') => Promise<void>;
  createChat: (customerData: { id: string; name: string; email: string }) => Promise<string>;
  markAsRead: (chatId: string, messageIds: string[]) => Promise<void>;
  updateChatStatus: (chatId: string, status: Chat['status']) => Promise<void>;
  loadChatMessages: (chatId: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
}
