import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Clock,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import type { Chat, ChatMessage } from '../types/chat';

interface CustomerChatProps {
  orderId?: string; // Chat relacionado a um pedido específico
}

export default function CustomerChat({}: CustomerChatProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar chat quando abrir
  useEffect(() => {
    if (isOpen && user && !currentChat) {
      initializeChat();
    }
  }, [isOpen, user]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const chatId = await chatService.getOrCreateCustomerChat({
        id: user.uid,
        name: user.name || user.email || 'Cliente',
        email: user.email || ''
      });

      // Buscar dados do chat
      const unsubscribeChat = chatService.subscribeToCustomerChats(user.uid, (chats) => {
        const activeChat = chats.find(chat => chat.id === chatId);
        if (activeChat) {
          setCurrentChat(activeChat);
        }
      });

      // Buscar mensagens do chat
      const unsubscribeMessages = chatService.subscribeToChatMessages(chatId, (chatMessages) => {
        setMessages(chatMessages);
        
        // Marcar mensagens como lidas
        const unreadMessages = chatMessages
          .filter(msg => !msg.read && msg.senderRole === 'admin')
          .map(msg => msg.id);
        
        if (unreadMessages.length > 0) {
          chatService.markMessagesAsRead(chatId, unreadMessages);
        }
      });

      return () => {
        unsubscribeChat();
        unsubscribeMessages();
      };

    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat || !user) return;

    try {
      await chatService.sendMessage(
        currentChat.id,
        user.uid,
        user.name || user.email || 'Cliente',
        'customer',
        newMessage.trim()
      );

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (message.senderRole === 'customer') {
      return message.read ? 
        <CheckCheck size={12} className="text-blue-500" /> : 
        <Clock size={12} className="text-gray-400" />;
    }
    return null;
  };

  // Contador de mensagens não lidas
  const unreadCount = currentChat?.unreadCount || 0;

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão de Chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* Janela de Chat */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-96'
        } w-80`}>
          {/* Header do Chat */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <div>
                <h3 className="font-semibold text-sm">Suporte HotBox</h3>
                <p className="text-xs opacity-90">
                  {currentChat?.status === 'active' ? 'Online' : 
                   currentChat?.status === 'waiting' ? 'Aguardando...' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Corpo do Chat */}
          {!isMinimized && (
            <>
              {/* Área de Mensagens */}
              <div className="h-64 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs ${message.senderRole === 'customer' ? 'ml-8' : 'mr-8'}`}>
                          {message.senderRole === 'admin' && message.type !== 'system' && (
                            <div className="text-xs text-gray-600 mb-1">{message.senderName}</div>
                          )}
                          <div
                            className={`rounded-lg p-2 text-sm ${
                              message.type === 'system'
                                ? 'bg-yellow-100 text-yellow-800 text-center text-xs border border-yellow-200'
                                : message.senderRole === 'customer'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            {message.message}
                            <div className={`flex items-center justify-between mt-1 ${
                              message.senderRole === 'customer' ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{formatTime(message.timestamp)}</span>
                              {getMessageStatusIcon(message)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Área de Input */}
              <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                      rows={1}
                      style={{ minHeight: '38px', maxHeight: '100px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-2 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
                
                {currentChat?.status === 'waiting' && (
                  <div className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                    💡 Sua mensagem foi enviada! Nossa equipe responderá em breve.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
