import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Chat, ChatMessage } from '../types/chat';
import { chatService } from '../services/chatService';

const CustomerChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user?.uid) {
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Primeiro, testar conectividade
    const testFirebaseConnection = async () => {
      try {
        const isConnected = await chatService.testConnection();
        if (!isConnected) {
          setError('Não foi possível conectar com o Firebase. Verifique sua conexão com a internet.');
          setLoading(false);
          return;
        }

        // Se conectou, prosseguir com o chat
        setupChatSubscription();
      } catch (err) {
        console.error('Erro ao testar conexão:', err);
        setError('Erro de conectividade. Tente novamente.');
        setLoading(false);
      }
    };

    const setupChatSubscription = () => {
      try {
        // Timeout para evitar loading infinito
        const timeoutId = setTimeout(() => {
          setLoading(false);
          setError('Tempo limite excedido. Tente recarregar a página.');
        }, 15000); // 15 segundos

        // Inscrever-se nos chats do cliente
        const unsubscribeChat = chatService.subscribeToCustomerChats(user.uid, (customerChats: Chat[]) => {
          clearTimeout(timeoutId);
          
          if (customerChats.length > 0) {
            const activeChat = customerChats.find(c => c.status !== 'closed') || customerChats[0];
            setChat(activeChat);
            
            // Inscrever-se nas mensagens deste chat
            const unsubscribeMessages = chatService.subscribeToChatMessages(activeChat.id, (chatMessages: ChatMessage[]) => {
              setMessages(chatMessages);
              setLoading(false);
            });

            return () => unsubscribeMessages();
          } else {
            setChat(null);
            setMessages([]);
            setLoading(false);
          }
        });

        return () => {
          clearTimeout(timeoutId);
          unsubscribeChat();
        };
      } catch (err) {
        console.error('Erro ao configurar chat:', err);
        setError('Erro ao configurar o chat. Tente novamente.');
        setLoading(false);
      }
    };

    testFirebaseConnection();
  }, [user?.uid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.uid || sending) return;

    setSending(true);
    try {
      let chatId = chat?.id;

      // Se não existe chat, criar um novo
      if (!chatId) {
        chatId = await chatService.getOrCreateCustomerChat({
          id: user.uid,
          name: user.email || 'Cliente',
          email: user.email || ''
        });
      }

      // Enviar mensagem
      await chatService.sendMessage(
        chatId, 
        user.uid, 
        user.email || 'Cliente', 
        'customer',
        newMessage.trim()
      );

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aguardando resposta';
      case 'in_progress':
        return 'Em atendimento';
      case 'closed':
        return 'Conversa finalizada';
      default:
        return 'Aguardando';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="text-gray-600">Carregando chat...</span>
          <p className="text-sm text-gray-500">Conectando com o Firebase...</p>
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chat com Suporte</h1>
                <div className="flex items-center space-x-2 mt-1">
                  {chat && getStatusIcon(chat.status)}
                  <span className="text-sm text-gray-600">
                    {chat ? getStatusText(chat.status) : 'Inicie uma conversa'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)] flex flex-col">
          
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Bem-vindo ao suporte HotBox!
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Esta é sua conversa com nossa equipe de suporte. 
                  Envie uma mensagem para começar o atendimento.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderRole === 'customer'
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.senderRole === 'customer' ? 'Você' : 'Suporte HotBox'}
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <div className="text-xs mt-1 opacity-75">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    chat?.status === 'closed' 
                      ? 'Esta conversa foi finalizada' 
                      : 'Digite sua mensagem...'
                  }
                  disabled={chat?.status === 'closed' || sending}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={2}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || chat?.status === 'closed' || sending}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {chat?.status === 'closed' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Esta conversa foi finalizada. Para iniciar um novo atendimento, 
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-yellow-900 font-medium underline ml-1"
                  >
                    clique aqui
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPage;
