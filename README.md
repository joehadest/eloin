# 🏋️ Academia Elohim

Sistema completo de feedback e gestão para a Academia Elohim, oferecendo musculação, cardio, crossfit e muito mais.

## 📋 Sobre

A Academia Elohim é uma academia completa que oferece diversos serviços fitness para seus alunos. Este sistema foi desenvolvido para coletar feedback dos clientes e gerenciar essas informações através de um painel administrativo seguro.

## ✨ Funcionalidades

### 📝 Formulário Público
- Formulário de feedback completo e responsivo
- Avaliação de serviços (musculação, cardio, atendimento, etc.)
- Sistema de estrelas para avaliações
- NPS (Net Promoter Score)
- Campos para comentários e sugestões

### 🔐 Painel Administrativo
- Login seguro com autenticação
- Visualização organizada dos feedbacks em accordions
- Filtros por avaliação e NPS
- Estatísticas em tempo real
- Funções de copiar e imprimir feedbacks
- Interface moderna com tema dark

### 🛠️ Tecnologias Utilizadas
- **Backend**: Node.js + Express.js
- **Banco de Dados**: MongoDB Atlas
- **Frontend**: HTML5, CSS3, JavaScript
- **Autenticação**: Express Session
- **Segurança**: CORS, validações

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- MongoDB Atlas (ou MongoDB local)
- Conta no MongoDB Atlas

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/joehadest/elohim.git
cd elohim
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```env
   MONGODB_URI=sua_string_de_conexao_mongodb_atlas
   ADMIN_USERNAME=seu_usuario_admin
   ADMIN_PASSWORD=sua_senha_muito_segura
   SESSION_SECRET=chave_secreta_aleatoria_32_chars+
   JWT_SECRET=outra_chave_secreta_diferente_32_chars+
   NODE_ENV=production
   ```

4. Execute o servidor:
```bash
npm start
```

5. Acesse:
   - Formulário: `http://localhost:3000`
   - Login: `http://localhost:3000/login`
   - Painel: `http://localhost:3000/painel`

## 📊 Estrutura do Projeto

```
elohim/
├── api/
│   └── index.js            # API principal
├── public/
│   ├── index.html          # Formulário de feedback
│   ├── painel.html         # Painel administrativo
│   ├── login.html          # Página de login
│   └── style.css           # Estilos globais
├── .env                    # Variáveis de ambiente (não versionado)
├── package.json            # Dependências e scripts
├── vercel.json             # Configuração Vercel
└── README.md              # Esta documentação
```

## 🔒 Segurança

- ✅ Autenticação JWT + Session baseada
- ✅ Proteção contra acesso não autorizado ao painel
- ✅ Validação de dados no frontend e backend
- ✅ Sanitização de inputs do usuário
- ✅ Variáveis de ambiente protegidas (.env não versionado)
- ✅ Conexão segura com MongoDB Atlas
- ✅ CORS configurado adequadamente
- ✅ Rate limiting e retry logic implementados

### ⚠️ Importante para Segurança:
- **NUNCA** commite o arquivo `.env` 
- Use senhas fortes para admin e chaves secretas
- Mantenha suas credenciais do MongoDB seguras
- Configure adequadamente a whitelist de IPs no MongoDB Atlas

## 📈 Métricas Disponíveis

- Total de feedbacks recebidos
- Média de avaliações por categoria
- Distribuição de NPS
- Frequência de atividades mais procuradas

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Contato

**Academia Elohim**
- Website: [academiaelohim.com](https://academiaelohim.com)
- Email: contato@academiaelohim.com

---

⭐ Se este projeto foi útil, dê uma estrela no GitHub!
3. **Acesse o painel**: Após login, será redirecionado para `http://localhost:3000/painel`

### 4. Fluxo Completo

1. **Cliente** → Preenche formulário → Envia feedback → Redirecionado para login
2. **Administrador** → Faz login → Acessa painel → Visualiza feedbacks → Faz logout

## Estrutura do Projeto

```
elohim/
├── api/
│   └── index.js               # API serverless para Vercel
├── public/
│   ├── index.html             # Formulário de feedback
│   ├── painel.html            # Painel administrativo
│   ├── login.html             # Página de login
│   └── style.css              # Estilos CSS
├── .env                       # Variáveis de ambiente (não versionado)
├── .gitignore                 # Arquivos ignorados pelo Git
├── package.json               # Dependências e scripts
├── vercel.json                # Configuração para deploy
└── README.md                  # Documentação
```

## Campos do Formulário

- Nome
- E-mail
- Faixa etária
- Tempo como cliente
- Frequência de visita
- Atividades preferidas
- Avaliações (equipamentos, limpeza, atendimento, horários)
- Como conheceu a academia
- NPS (Net Promoter Score)
- Avaliação geral
- Sugestões de melhoria
- Comentários adicionais

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Banco de Dados**: MongoDB Atlas
- **Outros**: CORS, dotenv

## 💾 Configuração do Banco de Dados

O sistema utiliza MongoDB Atlas como banco de dados. Para configurar:

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster e obtenha sua string de conexão
3. Adicione a string no arquivo `.env` como `MONGODB_URI`
4. Certifique-se de que seu IP está na whitelist do MongoDB Atlas

**Importante:** Nunca exponha suas credenciais do banco de dados em código público.

## API Endpoints

- `POST /api/feedback` - Salvar novo feedback
- `GET /api/feedbacks` - Obter todos os feedbacks
- `GET /painel` - Página do painel de administração

## Próximos Passos

- Implementar autenticação para o painel
- Adicionar gráficos para visualização de dados
- Exportar dados para CSV/Excel
- Notificações por e-mail para novos feedbacks
