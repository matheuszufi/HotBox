# Configuração do Firebase

Este guia explica como configurar o Firebase para o projeto HotBox.

## 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "hotbox-restaurant")
4. Configure Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Configurar Authentication

1. No console do Firebase, vá em **Authentication**
2. Clique em **Começar**
3. Na aba **Sign-in method**, habilite:
   - **Email/Password** (clique e ative)
4. Opcionalmente, configure outros provedores (Google, Facebook, etc.)

## 3. Configurar Firestore Database

1. No console do Firebase, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Iniciar no modo de teste** (para desenvolvimento)
4. Selecione uma localização (ex: us-central1)

### Regras de Segurança do Firestore

Substitua as regras padrão por estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read and write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all users
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Menu items collection (public read, admin write)
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders collection
    match /orders/{orderId} {
      // Users can read their own orders
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      // Users can create orders
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      // Admins can read and update all orders
      allow read, update: if request.auth != null && 
                             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 4. Configurar Web App

1. No console do Firebase, clique no ícone **Web** (`</>`)
2. Digite um nome para o app (ex: "hotbox-web")
3. **NÃO** configure Firebase Hosting por enquanto
4. Clique em **Registrar app**
5. Copie as configurações mostradas

## 5. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.template` para `.env`:
   ```bash
   cp .env.template .env
   ```

2. Substitua os valores no arquivo `.env` pelas configurações do seu projeto:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

## 6. Criar Usuário Admin Inicial

Após configurar o Firebase, você precisará criar um usuário admin:

1. Execute o projeto: `npm run dev`
2. Acesse a página de registro
3. Crie uma conta normalmente
4. No Firebase Console, vá em **Firestore Database**
5. Encontre o documento do usuário criado em `users/{uid}`
6. Edite o campo `role` de `customer` para `admin`

## 7. Estrutura do Banco de Dados

### Coleção `users`
```javascript
{
  uid: "firebase_auth_uid",
  email: "user@email.com",
  name: "Nome do Usuário",
  role: "customer" | "admin",
  phone: "(11) 99999-9999", // opcional
  address: "Endereço completo", // opcional
  photoURL: "url_da_foto", // opcional
  emailVerified: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

### Coleção `orders` (futura)
```javascript
{
  userId: "firebase_auth_uid",
  userName: "Nome do Cliente",
  userEmail: "cliente@email.com",
  items: [...], // array de itens do pedido
  total: 45.90,
  status: "pending",
  createdAt: "2025-01-01T00:00:00.000Z",
  // ... outros campos
}
```

## 8. Recursos Implementados

### ✅ Autenticação
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Logout
- ✅ Persistência de sessão
- ✅ Roles (customer/admin)
- ✅ Proteção de rotas

### ✅ Perfil do Usuário
- ✅ Visualizar dados do perfil
- ✅ Editar informações pessoais
- ✅ Validação de formulários
- ✅ Tratamento de erros

### 🚧 Próximas Implementações
- 🚧 Sistema de pedidos
- 🚧 Gerenciamento de cardápio
- 🚧 Dashboard administrativo
- 🚧 Notificações em tempo real

## 9. Troubleshooting

### Erro de CORS
Se encontrar erros de CORS, verifique se:
- As configurações do Firebase estão corretas
- O domínio está autorizado no Firebase Console

### Erro de Permissão
Se encontrar erros de permissão:
- Verifique as regras do Firestore
- Confirme que o usuário está autenticado
- Verifique se o role do usuário está correto

### Ambiente de Desenvolvimento
Para desenvolvimento local, certifique-se de que:
- O arquivo `.env` está configurado corretamente
- As variáveis começam com `VITE_`
- O projeto foi reiniciado após alterar o `.env`

## 10. Deploy (Futuro)

Para deploy em produção:
1. Configure Firebase Hosting
2. Configure as regras de produção do Firestore
3. Configure domínios autorizados
4. Configure variáveis de ambiente de produção
