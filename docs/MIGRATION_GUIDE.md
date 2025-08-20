# 🚀 Migração de Produtos API → Firebase

## 📋 Visão Geral

Este sistema permite migrar todos os produtos da API REST para o Firebase Firestore, mantendo um backup e sincronização dos dados.

## 🔧 Funcionalidades

### 1. **Migração Completa** (Botão Vermelho)
- **Função**: `migrateProductsToFirebase()`
- **O que faz**:
  - ✅ Busca TODOS os produtos da API
  - 🧹 Limpa produtos existentes no Firebase (opcional)
  - 📤 Migra todos os produtos para Firebase
  - 🏷️ Mantém referência do ID original da API (`originalApiId`)
  - 📊 Exibe relatório completo de migração

### 2. **Sincronização** (Botão Verde)
- **Função**: `syncProductsFromApi()`
- **O que faz**:
  - 🔍 Compara produtos da API com Firebase
  - ➕ Adiciona produtos novos que não existem no Firebase
  - 🔄 Atualiza produtos existentes se houver diferenças
  - 📈 Relatório de itens adicionados/atualizados

### 3. **Comparação** (Botão Roxo)
- **Função**: `compareApiAndFirebase()`
- **O que faz**:
  - 📊 Compara quantidades entre API e Firebase
  - ⚠️ Lista produtos que estão na API mas não no Firebase
  - ⚠️ Lista produtos que estão no Firebase mas não na API
  - 📋 Relatório detalhado de diferenças

### 4. **Produtos de Exemplo** (Botão Azul)
- **Função**: `addSampleProducts()`
- **O que faz**:
  - 🍔 Adiciona 5 produtos de exemplo ao Firebase
  - 📝 Produtos: HotBox Clássico, BBQ, Fritas, Coca-Cola, Vegano
  - 🎯 Ideal para testes iniciais

## 🗂️ Estrutura dos Dados

### Produto da API:
```json
{
  "id": "api-123",
  "name": "HotBox Clássico",
  "description": "Hambúrguer artesanal...",
  "price": 25.90,
  "category": "hamburguer",
  "available": true,
  "image": "/images/hotbox.jpg",
  "ingredients": ["Pão", "Carne", "Alface"]
}
```

### Produto no Firebase:
```json
{
  "name": "HotBox Clássico",
  "description": "Hambúrguer artesanal...",
  "price": 25.90,
  "category": "hamburguer",
  "available": true,
  "image": "/images/hotbox.jpg",
  "ingredients": ["Pão", "Carne", "Alface"],
  "originalApiId": "api-123",
  "createdAt": "2025-08-20T10:00:00Z",
  "updatedAt": "2025-08-20T10:00:00Z",
  "migratedAt": "2025-08-20T10:00:00Z"
}
```

## 🚦 Como Usar

### 1. **Primeira Migração** (Recomendado)
1. Acesse `/admin/manage`
2. Clique na aba **"Produtos"**
3. Clique em **"Migrar da API"** (botão vermelho)
4. Aguarde a conclusão e verifique o console

### 2. **Sincronização Regular**
1. Use **"Sincronizar"** (botão verde) para atualizações incrementais
2. Não remove produtos existentes, apenas adiciona/atualiza

### 3. **Verificação**
1. Use **"Comparar"** (botão roxo) para verificar diferenças
2. Analise o console para detalhes

## 🔍 Monitoramento

### Console Logs:
- `🔄 Iniciando migração...`
- `📥 Buscando produtos da API...`
- `✅ Encontrados X produtos na API`
- `🧹 Limpando produtos existentes...`
- `📤 Migrando produtos...`
- `✅ Produto "Nome" migrado com sucesso`
- `📊 RELATÓRIO DE MIGRAÇÃO`

### Status na Interface:
- Indicador visual de progresso
- Botões desabilitados durante operação
- Alertas com resumo dos resultados

## ⚠️ Importante

1. **Backup**: A migração completa remove produtos existentes do Firebase
2. **API**: Certifique-se que a API está funcionando antes da migração
3. **Firebase**: Verifique as permissões do Firestore
4. **Logs**: Sempre monitore o console para erros

## 🔧 Configuração

### Variáveis de Ambiente (.env):
```bash
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... outras configurações Firebase
```

### Coleções Firebase:
- `products` - Produtos migrados da API
- `suppliers` - Fornecedores (separado)
- `orders` - Pedidos (separado)
- `users` - Usuários (separado)

## 🐛 Troubleshooting

### Erro: "Cannot find name 'menuService'"
- ✅ Verifique se a API está rodando
- ✅ Confirme a URL da API no .env

### Erro: "Firebase permission denied"
- ✅ Verifique as regras do Firestore
- ✅ Confirme a configuração do Firebase

### Produtos não aparecem após migração
- ✅ Verifique o console para erros
- ✅ Use "Comparar" para verificar status
- ✅ Recarregue a página

## 📈 Performance

- **Migração completa**: ~1-5 segundos para 50 produtos
- **Sincronização**: ~0.5-2 segundos para verificar diferenças
- **Comparação**: ~0.5-1 segundo para análise

## 🎯 Próximos Passos

Após a migração bem-sucedida:
1. ✅ Teste a visualização de produtos na interface
2. ✅ Verifique se os filtros por categoria funcionam
3. ✅ Teste a busca de produtos
4. ✅ Configure sincronização automática (opcional)
