import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';

const CustomerChatPageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    chatId
  } = useChat({
    userId: user?.uid || '',
    userName: user?.email || 'Cliente',
    userEmail: user?.email || '',
    userRole: 'customer'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      await sendMessage(newMessage);
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar o chat.</p>
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
          <span className="text-gray-600">Conectando com o chat...</span>
          <p className="text-sm text-gray-500">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {chatId ? 'Conectado' : 'Conectando...'}
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
      <div className="max-w-4xl mx-auto p-2">
        <div className="chat-container rounded-2xl shadow-xl border border-gray-200 h-[calc(100vh-140px)] flex flex-col overflow-hidden">
          
          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-4 max-h-0 chat-messages-area">
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
                    className={`max-w-xs lg:max-w-md px-4 py-3 text-white ${
                      message.senderRole === 'customer'
                        ? 'message-customer'
                        : 'message-other text-gray-800'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.senderRole === 'customer' ? 'Você' : message.senderName}
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <div className="text-xs mt-1 opacity-75">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-end">
                <div className="message-customer max-w-xs lg:max-w-md px-4 py-3 text-white opacity-70">
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

          {/* Message Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
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
            
            <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <p className="text-sm text-purple-800">
                <strong>💬 Chat em Tempo Real:</strong> Suas mensagens são enviadas instantaneamente 
                e você receberá respostas da nossa equipe de suporte em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPageV2;
