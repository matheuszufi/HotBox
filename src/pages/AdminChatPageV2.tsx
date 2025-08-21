import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  MessageSquare,
  Search,
  User,
  MessageCircle,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminChat } from '../hooks/useAdminChat';
import type { Chat } from '../types/chat';

const AdminChatPageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'in_progress' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chats,
    activeChat,
    messages,
    loading,
    error,
    sending,
    setActiveChat,
    sendMessage,
    updateChatStatus
  } = useAdminChat(user?.uid || '', 'Equipe HotBox');

  // Debug - log dos chats carregados
  useEffect(() => {
    console.log('=== ADMIN CHAT DEBUG ===');
    console.log('User:', user);
    console.log('User ID:', user?.uid);
    console.log('User Role:', user?.role);
    console.log('Chats carregados:', chats.length, chats);
    console.log('Loading:', loading, 'Error:', error);
    console.log('========================');
  }, [chats, loading, error, user]);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;

    try {
      await sendMessage(activeChat.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStatusChange = async (chatId: string, status: Chat['status']) => {
    try {
      await updateChatStatus(chatId, status);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Aguardando';
      case 'in_progress':
        return 'Em Atendimento';
      case 'closed':
        return 'Finalizado';
      default:
        return status;
    }
  };

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você precisa estar logado como admin.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="text-gray-600">Carregando chats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erro de Conexão</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/manage')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Chats</h1>
              <p className="text-gray-600">Atenda e gerencie conversas com clientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-2">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Lista de Chats */}
          <div className="chat-container rounded-2xl shadow-xl border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Filtros */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="waiting">Aguardando</option>
                    <option value="in_progress">Em Atendimento</option>
                    <option value="closed">Finalizados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto max-h-0">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {chats.length === 0 ? 'Nenhum chat criado ainda' : 'Nenhum chat encontrado com os filtros aplicados'}
                  </p>
                  {chats.length === 0 && (
                    <p className="text-sm text-gray-400">
                      Os chats aparecerão aqui quando os clientes iniciarem conversas
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className={`p-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 ${
                        activeChat?.id === chat.id ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-r-4 border-purple-500 shadow-sm' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {chat.customerName}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{chat.customerEmail}</p>
                          {chat.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                              {getStatusText(chat.status)}
                            </span>
                            {chat.lastMessageTime && (
                              <span className="text-xs text-gray-400">
                                {formatTime(chat.lastMessageTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Área de Conversa */}
          <div className="lg:col-span-2 chat-container rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            {activeChat ? (
              <>
                {/* Header da Conversa */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{activeChat.customerName}</h2>
                      <p className="text-sm text-gray-500">{activeChat.customerEmail}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={activeChat.status}
                        onChange={(e) => handleStatusChange(activeChat.id, e.target.value as Chat['status'])}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="waiting">Aguardando</option>
                        <option value="in_progress">Em Atendimento</option>
                        <option value="closed">Finalizar</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 p-3 overflow-y-auto space-y-4 max-h-0 chat-messages-area">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 ${
                          message.senderRole === 'admin'
                            ? 'message-admin text-white'
                            : message.senderRole === 'customer'
                            ? 'message-customer text-white'
                            : 'message-other text-gray-800'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.senderRole === 'admin' ? 'Você' : 
                           message.senderRole === 'customer' ? message.senderName : 
                           'Sistema'}
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <div className="text-xs mt-1 opacity-75">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-red-400 to-orange-400 text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg opacity-60">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">Enviando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Campo de Mensagem */}
                {activeChat.status !== 'closed' && (
                  <div className="p-3 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Digite sua resposta..."
                          disabled={sending}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-gray-50"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="send-button px-4 py-2 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione um chat
                  </h3>
                  <p className="text-gray-600">
                    Escolha uma conversa na lista para começar a atender
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatPageV2;
