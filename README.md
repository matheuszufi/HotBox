# HotBox - Sistema de Restaurante

Um aplicativo React moderno e otimizado para gerenciamento de restaurante com recursos completos para clientes e administradores.

## 🚀 Características

### Para Clientes
- ✅ **Home Page** - Página principal com apresentação do restaurante
- ✅ **Login/Register** - Sistema de autenticação com Firebase
- ✅ **Dashboard** - Painel personalizado para clientes
- ✅ **Edit Profile** - Edição completa de perfil
- 🚧 **Make Order** - Sistema de pedidos (em desenvolvimento)
- 🚧 **My Orders** - Histórico de pedidos (em desenvolvimento)

### Para Administradores
- ✅ **Admin Dashboard** - Painel administrativo com estatísticas
- ✅ **User Management** - Gerenciamento de usuários
- 🚧 **Orders Management** - Gerenciamento de pedidos (em desenvolvimento)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Type safety
- **Vite** - Build tool rápido
- **Tailwind CSS** - Styling otimizado
- **React Router DOM** - Roteamento

### Backend & Database
- **Firebase Authentication** - Autenticação de usuários
- **Firebase Firestore** - Banco de dados NoSQL
- **Firebase Security Rules** - Regras de segurança

### Estado e Dados
- **Context API + useReducer** - Gerenciamento de estado global
- **React Query** - Cache e sincronização de dados
- **React Hook Form** - Formulários otimizados

### Utilities
- **Axios** - Requisições HTTP
- **Lucide React** - Ícones
- **Zod** - Validação de esquemas

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de interface
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Loading.tsx
│   └── layout/         # Componentes de layout
│       ├── Header.tsx
│       ├── Layout.tsx
│       └── ProtectedRoute.tsx
├── contexts/           # Contextos React
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── pages/             # Páginas da aplicação
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── DashboardPage.tsx
├── services/          # Serviços e APIs
│   ├── api.ts
│   ├── authService.ts
│   ├── menuService.ts
│   └── orderService.ts
├── types/             # Definições TypeScript
│   ├── auth.ts
│   ├── menu.ts
│   ├── order.ts
│   └── api.ts
├── utils/             # Utilitários
│   └── index.ts
└── hooks/             # Custom hooks (futuro)
```

## 🎨 Design System

### Cores
- **Primary**: Tons de laranja (#ef6820 - #792616)
- **Gray Scale**: Tons de cinza para UI
- **States**: Verde (sucesso), Vermelho (erro), Amarelo (aviso)

### Componentes
- **Button**: Variants (primary, secondary, outline, ghost)
- **Input**: Com labels e validação
- **Card**: Sistema flexível de cards
- **Loading**: Spinners e páginas de carregamento

## 🔧 Instalação e Uso

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/matheuszufi/HotBox.git

# Instale as dependências
npm install

# Configure o Firebase
# 1. Copie o arquivo de template
cp .env.template .env

# 2. Configure suas credenciais do Firebase no arquivo .env
# Veja FIREBASE_SETUP.md para instruções detalhadas

# Execute o projeto
npm run dev
```

### Configuração do Firebase
Para configurar o Firebase, siga o guia detalhado em [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Scripts Disponíveis
```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm run lint     # Linting do código
```

## 🔒 Autenticação com Firebase

O sistema implementa autenticação completa com Firebase:

### ✅ Recursos Implementados
- **Firebase Authentication** - Login/Register seguro
- **Firestore Database** - Armazenamento de dados do usuário  
- **Context API** - Estado global de autenticação
- **Roles de Usuário** - Diferenciação entre customer/admin
- **Rotas Protegidas** - Controle de acesso por role
- **Persistência de Sessão** - Mantém login entre sessões
- **Validação de Formulários** - Com mensagens de erro específicas
- **Profile Management** - Edição completa de perfil

### 🔐 Segurança
- **Firebase Security Rules** - Controle de acesso no banco
- **Type Safety** - TypeScript em toda aplicação
- **Validação de Dados** - Client e server-side
- **Tratamento de Erros** - Mensagens user-friendly

## 🛒 Carrinho de Compras

Sistema de carrinho implementado com:
- Context global para estado do carrinho
- Persistência no localStorage
- Operações CRUD (add, remove, update, clear)
- Cálculos automáticos de total e quantidade

## 📱 Responsividade

- Design mobile-first
- Breakpoints otimizados
- Componentes adaptativos
- Navegação responsiva

## 🔮 Próximas Implementações

### Prioridade Alta
1. **Sistema de Cardápio** - Visualização e filtragem de pratos
2. **Sistema de Pedidos** - Criação e acompanhamento
3. **Carrinho de Compras** - Interface completa
4. **Perfil do Usuário** - Edição de dados

### Prioridade Média
1. **Dashboard Admin** - Estatísticas em tempo real
2. **Gerenciamento de Cardápio** - CRUD para admins
3. **Sistema de Notificações** - Real-time updates
4. **Relatórios e Analytics** - Métricas detalhadas

### Futuras Melhorias
1. **PWA** - Progressive Web App
2. **Dark Mode** - Tema escuro
3. **Multi-idiomas** - Internacionalização
4. **Payment Integration** - Pagamentos online

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Matheus Zufi** - [GitHub](https://github.com/matheuszufi)

---

⭐ Se este projeto te ajudou, dê uma estrela no repositório!
