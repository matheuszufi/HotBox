# 💬 Sistema de Chat - HotBox

## 🎯 Visão Geral

Sistema de chat em tempo real implementado para comunicação entre clientes e administradores da HotBox, utilizando Firebase Firestore para armazenamento e sincronização de mensagens.

## ✨ Funcionalidades

### 👤 Para Clientes
- **Chat Flutuante**: Botão de chat fixo no canto inferior direito
- **Início Automático**: Chat criado automaticamente ao clicar no botão
- **Status Visual**: Indicadores de mensagens lidas/não lidas
- **Interface Responsiva**: Design otimizado para mobile e desktop
- **Notificações**: Contador de mensagens não lidas

### 👨‍💼 Para Administradores
- **Central de Atendimento**: Interface completa para gerenciar todos os chats
- **Lista de Conversas**: Visualização de todos os chats com filtros
- **Chat em Tempo Real**: Mensagens sincronizadas instantaneamente
- **Gestão de Status**: Controle de status (ativo, aguardando, fechado)
- **Prioridades**: Sistema de prioridades (alta, média, baixa)
- **Busca e Filtros**: Pesquisa por cliente, status e prioridade

## 🏗️ Arquitetura

### 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── chat.ts                 # Tipos TypeScript para Chat e Mensagens
├── services/
│   └── chatService.ts          # Serviço Firebase para Chat
├── components/
│   └── CustomerChat.tsx        # Componente de Chat do Cliente
└── pages/
    └── AdminChatPage.tsx       # Página de Administração do Chat
```

### 🔥 Estrutura do Firebase

#### Coleção `chats`
```typescript
{
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'closed' | 'waiting';
  createdAt: timestamp;
  updatedAt: timestamp;
  lastMessage?: string;
  lastMessageTime?: timestamp;
  unreadCount: number;
  adminId?: string;
  adminName?: string;
  priority: 'low' | 'medium' | 'high';
  category?: 'support' | 'order' | 'complaint' | 'general';
  orderId?: string;
}
```

#### Coleção `messages`
```typescript
{
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  timestamp: timestamp;
  read: boolean;
  type: 'text' | 'image' | 'system';
  attachmentUrl?: string;
}
```

## 🚀 Como Usar

### Para Clientes

1. **Iniciar Conversa**:
   - Na página do menu, clique no botão de chat (💬) no canto inferior direito
   - O chat será aberto automaticamente
   - Uma mensagem de boas-vindas será enviada

2. **Enviar Mensagens**:
   - Digite sua mensagem no campo de texto
   - Pressione Enter ou clique no botão "Enviar"
   - As mensagens aparecerão em tempo real

3. **Controles do Chat**:
   - **Minimizar**: Clique no ícone de minimizar para esconder o conteúdo
   - **Fechar**: Clique no X para fechar o chat
   - **Reabrir**: Clique novamente no botão flutuante

### Para Administradores

1. **Acessar Central de Atendimento**:
   - Vá para o painel administrativo (`/admin/manage`)
   - Clique no botão "Chat Suporte" (azul)
   - Você será redirecionado para `/admin/chat`

2. **Gerenciar Conversas**:
   - **Lista à Esquerda**: Todas as conversas ativas
   - **Painel Central**: Mensagens da conversa selecionada
   - **Filtros**: Use os filtros por status e prioridade

3. **Responder Mensagens**:
   - Clique em uma conversa da lista
   - Digite sua resposta no campo inferior
   - Pressione Enter ou clique "Enviar"

4. **Gerenciar Status**:
   - **Aguardando**: Cliente enviou mensagem, aguarda resposta
   - **Ativo**: Conversa em andamento
   - **Fechado**: Conversa finalizada

5. **Definir Prioridades**:
   - **Alta**: Urgente (vermelho)
   - **Média**: Normal (laranja)
   - **Baixa**: Não urgente (azul)

## 🔧 Configuração Técnica

### Dependências Necessárias
- Firebase Firestore
- React Context (AuthContext)
- Lucide React (ícones)
- TypeScript

### Variáveis de Ambiente
```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
```

### Regras do Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chats - apenas usuários autenticados
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
    
    // Mensagens - apenas usuários autenticados
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎨 Customização

### Cores e Estilo
O sistema utiliza o mesmo padrão visual da HotBox:
- **Gradiente Principal**: `from-red-500 to-orange-500`
- **Cores de Status**: Verde (ativo), Amarelo (aguardando), Cinza (fechado)
- **Tipografia**: Sistema padrão da aplicação

### Modificações Possíveis
1. **Adicionar Anexos**: Implementar upload de imagens
2. **Notificações Push**: Integrar com Firebase Messaging
3. **Chat por Voz**: Implementar mensagens de áudio
4. **Chatbot**: Integrar IA para respostas automáticas
5. **Avaliação**: Sistema de avaliação do atendimento

## 📊 Métricas e Analytics

### Dados Coletados
- Número de conversas iniciadas
- Tempo médio de resposta
- Taxa de resolução
- Satisfação do cliente (futuro)
- Horários de maior demanda

### Relatórios Disponíveis
```typescript
{
  totalChats: number;
  activeChats: number;
  waitingChats: number;
  avgResponseTime: number; // em minutos
  customerSatisfaction: number; // 1-5
}
```

## 🛠️ Manutenção

### Backup de Conversas
```javascript
// Exportar conversas para CSV
const exportChats = async () => {
  const chats = await chatService.getAllChats();
  // Lógica de exportação
};
```

### Limpeza Automática
```javascript
// Arquivar chats antigos (90+ dias)
const archiveOldChats = async () => {
  // Lógica de arquivamento
};
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Chat não carrega**:
   - Verificar conexão com Firebase
   - Validar regras de segurança
   - Confirmar autenticação do usuário

2. **Mensagens não sincronizam**:
   - Verificar listeners do Firestore
   - Confirmar conexão de internet
   - Revisar estrutura das coleções

3. **Performance lenta**:
   - Implementar paginação de mensagens
   - Otimizar consultas do Firestore
   - Considerar índices compostos

### Logs e Debug
```javascript
// Habilitar logs do Firebase
import { enableNetwork } from 'firebase/firestore';
await enableNetwork(db);
```

## 🔄 Próximas Implementações

### Fase 1 - Melhorias Básicas
- [ ] Indicador de digitação
- [ ] Timestamp mais detalhado
- [ ] Busca por mensagens
- [ ] Anexos de imagem

### Fase 2 - Funcionalidades Avançadas
- [ ] Notificações push
- [ ] Chat por categorias
- [ ] Transferência entre agentes
- [ ] Respostas prontas

### Fase 3 - Automação
- [ ] Chatbot inteligente
- [ ] IA para classificação
- [ ] Auto-resolução
- [ ] Analytics avançados

---

## 📞 Suporte

Para dúvidas técnicas sobre o sistema de chat:
- Documentação Firebase: https://firebase.google.com/docs/firestore
- React Documentation: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/

---

**Status**: ✅ **Implementado e Funcional**  
**Versão**: 1.0.0  
**Última Atualização**: 20/08/2025
