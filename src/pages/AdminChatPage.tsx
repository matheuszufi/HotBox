import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  Search,
  Clock,
  CheckCheck,
  AlertCircle,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import type { Chat, ChatMessage } from '../types/chat';

export default function AdminChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'waiting' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar chats
  useEffect(() => {
    const unsubscribe = chatService.subscribeToChats((chatList) => {
      setChats(chatList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Carregar mensagens do chat ativo
  useEffect(() => {
    if (activeChat) {
      const unsubscribe = chatService.subscribeToChatMessages(activeChat.id, (chatMessages) => {
        setMessages(chatMessages);
        
        // Marcar mensagens como lidas pelo admin
        const unreadMessages = chatMessages
          .filter(msg => !msg.read && msg.senderRole === 'customer')
          .map(msg => msg.id);
        
        if (unreadMessages.length > 0) {
          console.log('📖 [Admin] Marcando mensagens como lidas:', unreadMessages.length);
          chatService.markMessagesAsRead(activeChat.id, unreadMessages, 'admin');
        }
      });

      return unsubscribe;
    }
  }, [activeChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !user) return;

    try {
      await chatService.sendMessage(
        activeChat.id,
        user.uid,
        user.name || 'Admin',
        'admin',
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

  const updateChatStatus = async (chatId: string, status: Chat['status']) => {
    try {
      await chatService.updateChatStatus(chatId, status, user?.uid, user?.name || 'Admin');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const updateChatPriority = async (chatId: string, priority: Chat['priority']) => {
    try {
      await chatService.updateChatPriority(chatId, priority);
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getStatusColor = (status: Chat['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: Chat['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (message.senderRole === 'admin') {
      return message.read ? 
        <CheckCheck size={12} className="text-blue-500" /> : 
        <Clock size={12} className="text-gray-400" />;
    }
    return null;
  };

  // Filtrar chats
  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || chat.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Estatísticas
  const stats = {
    total: chats.length,
    active: chats.filter(c => c.status === 'active').length,
    waiting: chats.filter(c => c.status === 'waiting').length,
    highPriority: chats.filter(c => c.priority === 'high').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/manage')}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="inline mr-1" />
                Voltar
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-red-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Central de Atendimento</h1>
                </div>
              </div>
            </div>
            
            {/* Estatísticas */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{stats.active} Ativo{stats.active !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{stats.waiting} Aguardando</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-gray-600">{stats.highPriority} Urgente{stats.highPriority !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Lista de Chats */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            {/* Header da Lista */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-sm border-none outline-none"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">Todos Status</option>
                  <option value="active">Ativos</option>
                  <option value="waiting">Aguardando</option>
                  <option value="closed">Fechados</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">Todas Prioridades</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto h-full">
              {filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhuma conversa encontrada
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeChat?.id === chat.id ? 'bg-red-50 border-r-2 border-r-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {chat.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {chat.customerName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {chat.customerEmail}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-gray-500">
                          {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600 truncate flex-1 mr-2">
                        {chat.lastMessage || 'Nova conversa'}
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(chat.status)}`}>
                          {chat.status === 'active' ? 'Ativo' : 
                           chat.status === 'waiting' ? 'Aguarda' : 'Fechado'}
                        </span>
                        {chat.priority === 'high' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(chat.priority)}`}>
                            Urgente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Área de Chat */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-300 overflow-hidden flex flex-col">
            {activeChat ? (
              <>
                {/* Header do Chat */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {activeChat.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{activeChat.customerName}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail size={12} />
                          {activeChat.customerEmail}
                        </div>
                        {activeChat.orderId && (
                          <div className="text-xs text-blue-600 flex items-center gap-1">
                            <Calendar size={10} />
                            Pedido #{activeChat.orderId}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={activeChat.status}
                        onChange={(e) => updateChatStatus(activeChat.id, e.target.value as Chat['status'])}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="waiting">Aguardando</option>
                        <option value="active">Ativo</option>
                        <option value="closed">Fechado</option>
                      </select>
                      
                      <select
                        value={activeChat.priority}
                        onChange={(e) => updateChatPriority(activeChat.id, e.target.value as Chat['priority'])}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.senderRole === 'admin' ? 'ml-12' : 'mr-12'}`}>
                        {message.senderRole === 'customer' && message.type !== 'system' && (
                          <div className="text-xs text-gray-600 mb-1">{message.senderName}</div>
                        )}
                        <div
                          className={`rounded-lg p-3 text-sm ${
                            message.type === 'system'
                              ? 'bg-yellow-100 text-yellow-800 text-center text-xs border border-yellow-200'
                              : message.senderRole === 'admin'
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                              : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                          }`}
                        >
                          {message.message}
                          <div className={`flex items-center justify-between mt-2 ${
                            message.senderRole === 'admin' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                            {getMessageStatusIcon(message)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Mensagem */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua resposta..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        rows={2}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send size={16} />
                      Enviar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                  <p className="text-sm">Escolha um chat da lista para começar a responder</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
