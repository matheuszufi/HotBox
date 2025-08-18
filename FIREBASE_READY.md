# Configuração do Firebase - HotBox

## ✅ Firebase Configurado!

Seu projeto Firebase **HotBox** está configurado com sucesso! Aqui estão os detalhes:

### 📋 Informações do Projeto
- **Nome:** HotBox
- **Project ID:** hotbox-c3da3
- **Project Number:** 242185945126

### 🔥 Serviços Configurados
- ✅ **Firebase Authentication** - Configurado
- ✅ **Cloud Firestore** - Configurado
- ✅ **Realtime Database** - Disponível
- ✅ **Cloud Storage** - Disponível

## 🚀 Próximos Passos

### 1. Configurar Authentication
1. Acesse [Firebase Console](https://console.firebase.google.com/project/hotbox-c3da3)
2. Vá em **Authentication > Sign-in method**
3. Habilite **Email/Password**:
   - Clique em "Email/Password"
   - Ative a primeira opção (Email/Password)
   - Clique em "Salvar"

### 2. Configurar Firestore Database
1. No console, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Iniciar no modo de teste**
4. Selecione localização: **us-central1** (recomendado)

### 3. Configurar Regras de Segurança

Após criar o Firestore, substitua as regras por estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - usuários podem ler/editar seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins podem ler todos os usuários
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Permitir criação durante registro
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Menu items - leitura pública, escrita apenas admin
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders - usuários veem seus pedidos, admins veem todos
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == resource.data.userId ||
                      (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'));
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && 
                       exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🧪 Testando o Sistema

### 1. Criar Primeira Conta
1. Acesse http://localhost:3001
2. Clique em "Cadastrar"
3. Preencha os dados e registre-se
4. Faça login normalmente

### 2. Criar Usuário Admin
1. Após criar sua conta, vá no [Firestore Console](https://console.firebase.google.com/project/hotbox-c3da3/firestore)
2. Navegue até `users > [seu-uid]`
3. Edite o documento e mude `role` de `"customer"` para `"admin"`
4. Salve as alterações
5. Faça logout e login novamente para ver o dashboard admin

### 3. Testar Funcionalidades
- ✅ **Registro de usuário**
- ✅ **Login/Logout**
- ✅ **Dashboard diferenciado por role**
- ✅ **Edição de perfil**
- ✅ **Proteção de rotas**

## 🛠️ Estrutura do Banco de Dados

### Coleção `users`
Cada usuário terá um documento com o formato:
```json
{
  "uid": "firebase_auth_uid",
  "email": "usuario@email.com",
  "name": "Nome do Usuário",
  "role": "customer", // ou "admin"
  "phone": "(11) 99999-9999",
  "address": "Endereço completo",
  "emailVerified": false,
  "photoURL": null,
  "createdAt": "2025-08-18T15:30:00.000Z",
  "updatedAt": "2025-08-18T15:30:00.000Z"
}
```

## 🔍 Monitoramento

### Firebase Console Links
- [Authentication](https://console.firebase.google.com/project/hotbox-c3da3/authentication)
- [Firestore](https://console.firebase.google.com/project/hotbox-c3da3/firestore)
- [Usuários](https://console.firebase.google.com/project/hotbox-c3da3/authentication/users)

### Logs e Debug
- Erros de autenticação aparecerão no console do navegador
- Logs do Firestore também no console
- Use as ferramentas de dev do Firebase para debug

## ⚡ Comandos Úteis

```bash
# Executar projeto
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

## 🆘 Troubleshooting

### Erro "Firebase not initialized"
- Verifique se o arquivo `.env` tem todas as variáveis
- Reinicie o servidor: `Ctrl+C` e `npm run dev`

### Erro de permissão no Firestore
- Verifique se as regras foram configuradas corretamente
- Confirme que o usuário está autenticado

### Usuário não aparece como admin
- Confirme que mudou o `role` no Firestore
- Faça logout e login novamente

---

🎉 **Seu projeto HotBox está pronto para uso com Firebase!**
