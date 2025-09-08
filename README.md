# 🏋️ Academia Eloin Fitness

Sistema completo de feedback e gestão para a Academia Eloin Fitness, oferecendo musculação, cardio, crossfit e muito mais.

## 📋 Sobre

A Academia Eloin Fitness é uma academia completa que oferece diversos serviços fitness para seus alunos. Este sistema foi desenvolvido para coletar feedback dos clientes e gerenciar essas informações através de um painel administrativo seguro.

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
git clone https://github.com/joehadest/eloin.git
cd eloin
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `config/.env.example` para `config/.env`
   - Configure sua string de conexão do MongoDB
   - Defina usuário e senha do painel administrativo

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
eloin/
├── config/
│   └── .env                 # Variáveis de ambiente
├── public/
│   ├── index.html          # Formulário de feedback
│   ├── painel.html         # Painel administrativo
│   ├── login.html          # Página de login
│   └── style.css           # Estilos globais
├── src/
│   └── server.js           # Servidor Express
├── package.json            # Dependências e scripts
└── README.md              # Esta documentação
```

## 🔒 Segurança

- Autenticação baseada em sessão
- Proteção contra acesso não autorizado
- Validação de dados no frontend e backend
- Sanitização de inputs

## 📈 Métricas Disponíveis

- Total de feedbacks recebidos
- Média de avaliações por categoria
- Distribuição de NPS
- Frequência de atividades mais procuradas

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Contato

**Academia Eloin Fitness**
- Website: [academiaeloin.com](https://academiaeloin.com)
- Email: contato@academiaeloin.com

---

⭐ Se este projeto foi útil, dê uma estrela no GitHub!
3. **Acesse o painel**: Após login, será redirecionado para `http://localhost:3000/painel`

### 4. Fluxo Completo

1. **Cliente** → Preenche formulário → Envia feedback → Redirecionado para login
2. **Administrador** → Faz login → Acessa painel → Visualiza feedbacks → Faz logout

## Estrutura do Projeto

```
eloin/
├── config/
│   └── .env                    # Variáveis de ambiente (MongoDB URI)
├── public/
│   ├── index.html             # Formulário de feedback
│   ├── painel.html            # Painel de visualização dos feedbacks
│   ├── script.js              # JavaScript do frontend
│   └── style.css              # Estilos CSS
├── src/
│   └── server.js              # Backend Node.js com Express
├── .gitignore                 # Arquivos ignorados pelo Git
├── package.json               # Dependências e scripts
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

## Configuração do Banco de Dados

O sistema está configurado para usar MongoDB Atlas. A string de conexão está no arquivo `.env`:

```
MONGODB_URI=mongodb+srv://webpulse:silva225566@eloinformulario.vcympy9.mongodb.net/?retryWrites=true&w=majority&appName=eloinformulario
```

## API Endpoints

- `POST /api/feedback` - Salvar novo feedback
- `GET /api/feedbacks` - Obter todos os feedbacks
- `GET /painel` - Página do painel de administração

## Próximos Passos

- Implementar autenticação para o painel
- Adicionar gráficos para visualização de dados
- Exportar dados para CSV/Excel
- Notificações por e-mail para novos feedbacks
