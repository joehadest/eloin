const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Variáveis de ambiente para Vercel
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://webpulse:silva225566@elohimformulario.vcympy9.mongodb.net/?retryWrites=true&w=majority&appName=elohimformulario';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'elohim2024';
const SESSION_SECRET = process.env.SESSION_SECRET || 'elohim-secret-key-2024';

// Middleware
app.use(cors()); // Simplificado para debug
app.use(express.json());

// Servir arquivos estáticos SEMPRE (não só em desenvolvimento)
app.use(express.static(path.join(__dirname, '../public')));

// Configuração de sessão para Vercel
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true apenas em produção
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    },
    name: 'elohim-session' // Nome personalizado para evitar conflitos
}));

// Store para tokens de sessão simples (em memória para esta demonstração)
let activeTokens = new Set();

// Store para credenciais atualizadas (inicializado com padrões)
let currentCredentials = {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD
};

// Função para carregar credenciais do banco de dados
async function loadCredentialsFromDatabase() {
    try {
        const database = await connectToDatabase();
        const settings = database.collection('settings');

        const credentialDoc = await settings.findOne({ type: 'admin_credentials' });

        if (credentialDoc) {
            currentCredentials.username = credentialDoc.username;
            currentCredentials.password = credentialDoc.password;
            console.log('✅ Credenciais carregadas do banco de dados:', credentialDoc.username);
            return true;
        } else {
            console.log('ℹ️ Nenhuma credencial encontrada no banco, usando padrão');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar credenciais do banco:', error.message);
        return false;
    }
}

// Função para salvar credenciais no banco de dados
async function saveCredentialsToDatabase(username, password) {
    try {
        if (!client) {
            console.log('MongoDB não conectado, não foi possível salvar credenciais');
            return false;
        }

        const database = await connectToDatabase();
        const settings = database.collection('settings');

        await settings.updateOne(
            { type: 'admin_credentials' },
            {
                $set: {
                    username: username,
                    password: password,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log('✅ Credenciais salvas no banco de dados');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar credenciais no banco:', error);
        return false;
    }
}

// Função para gerar token simples
function generateSimpleToken() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Middleware de autenticação alternativo baseado em token
function requireAuthToken(req, res, next) {
    const token = req.headers['x-auth-token'];

    if (token && activeTokens.has(token)) {
        next();
    } else if (req.session && req.session.authenticated) {
        // Fallback para sessão tradicional (localhost)
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Middleware de autenticação original (mantido para compatibilidade)
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Conexão com MongoDB
let client;
let db;

async function connectToDatabase() {
    try {
        if (!client) {
            console.log('🔄 Conectando ao MongoDB...');
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            db = client.db('elohim_fitness');
            console.log('✅ Conectado ao MongoDB Atlas');
        }
        return db;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        client = null;
        throw error;
    }
}

// Rotas da API

// Teste simples
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Servidor funcionando!',
        credentials: {
            username: currentCredentials.username,
            hasPassword: !!currentCredentials.password
        }
    });
});

// Endpoint temporário para inicializar credenciais (versão simplificada)
app.post('/api/init-credentials', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username e password são obrigatórios'
            });
        }

        // Salvar diretamente na memória (sem MongoDB por enquanto)
        currentCredentials.username = username;
        currentCredentials.password = password;

        console.log(`✅ Credenciais inicializadas: ${username}`);

        res.json({
            success: true,
            message: 'Credenciais inicializadas com sucesso (em memória)'
        });
    } catch (error) {
        console.error('Erro ao inicializar credenciais:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});
app.get('/api/auth/status', (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        const sessionAuth = !!(req.session && req.session.authenticated);
        const tokenAuth = token && activeTokens.has(token);

        console.log('Verificando status de autenticação:', {
            sessionID: req.sessionID,
            sessionAuth,
            tokenAuth,
            token: token ? 'presente' : 'ausente',
            activeTokensCount: activeTokens.size,
            sessionUsername: req.session ? req.session.username : 'none'
        });

        res.json({
            authenticated: sessionAuth || tokenAuth,
            sessionID: req.sessionID,
            method: tokenAuth ? 'token' : sessionAuth ? 'session' : 'none',
            username: req.session ? req.session.username : null
        });
    } catch (error) {
        console.error('Erro ao verificar status de autenticação:', error);
        res.status(500).json({
            authenticated: false,
            error: 'Erro interno do servidor'
        });
    }
});// Rota para enviar feedback
app.post('/api/feedback', async (req, res) => {
    try {
        const database = await connectToDatabase();
        const feedbacks = database.collection('feedbacks');

        const feedbackData = {
            ...req.body,
            timestamp: new Date(),
            ip: req.ip || req.connection.remoteAddress
        };

        const result = await feedbacks.insertOne(feedbackData);
        console.log('✅ Novo feedback salvo - Academia Elohim Fitness:', result.insertedId);

        res.json({
            success: true,
            message: 'Feedback enviado com sucesso para Academia Elohim Fitness!'
        });
    } catch (error) {
        console.error('❌ Erro ao salvar feedback da Academia Elohim Fitness:', error);
        res.status(500).json({
            error: 'Erro interno do servidor da Academia Elohim Fitness'
        });
    }
});

// Rota para login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Tentativa de login:', { username, hasPassword: !!password });
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Credenciais atuais:', {
            username: currentCredentials.username,
            hasPassword: !!currentCredentials.password
        });

        // Tentar carregar credenciais do banco se ainda não foram carregadas
        if (currentCredentials.username === ADMIN_USERNAME && currentCredentials.password === ADMIN_PASSWORD) {
            console.log('🔄 Recarregando credenciais do banco...');
            await loadCredentialsFromDatabase();
        }

        if (username === currentCredentials.username && password === currentCredentials.password) {
            // Autenticação tradicional para localhost
            req.session.authenticated = true;
            req.session.username = username;

            // Gerar token para Vercel
            const token = generateSimpleToken();
            activeTokens.add(token);

            // Limpar tokens antigos após 24 horas
            setTimeout(() => {
                activeTokens.delete(token);
            }, 24 * 60 * 60 * 1000);

            console.log('✅ Login bem-sucedido para usuário:', username);

            res.json({
                success: true,
                message: 'Login realizado com sucesso!',
                token: token,
                username: username
            });
        } else {
            console.log('❌ Credenciais inválidas para usuário:', username);
            console.log('Esperado:', { username: currentCredentials.username });
            console.log('Recebido:', { username, password: password ? '[HIDDEN]' : '[EMPTY]' });

            res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para logout
app.post('/api/logout', (req, res) => {
    const token = req.headers['x-auth-token'];

    if (token) {
        activeTokens.delete(token);
    }

    req.session.destroy();
    res.json({ success: true, message: 'Logout realizado com sucesso!' });
});

// Rota de debug para verificar credenciais (remover em produção)
app.get('/api/debug/credentials', async (req, res) => {
    try {
        // Recarregar credenciais do banco
        await loadCredentialsFromDatabase();

        res.json({
            environment: process.env.NODE_ENV,
            hasMongoUri: !!process.env.MONGODB_URI,
            defaultUsername: ADMIN_USERNAME,
            currentUsername: currentCredentials.username,
            hasCurrentPassword: !!currentCredentials.password,
            usingDefaultCredentials: currentCredentials.username === ADMIN_USERNAME && currentCredentials.password === ADMIN_PASSWORD
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Rota para obter todos os feedbacks (protegida)
app.get('/api/feedbacks', requireAuthToken, async (req, res) => {
    try {
        const database = await connectToDatabase();
        const feedbacks = database.collection('feedbacks');
        const allFeedbacks = await feedbacks.find({}).sort({ timestamp: -1 }).toArray();
        res.json(allFeedbacks);
    } catch (error) {
        console.error('❌ Erro ao buscar feedbacks:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para deletar feedback (protegida)
app.delete('/api/feedback/:id', requireAuthToken, async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const database = await connectToDatabase();
        const feedbacks = database.collection('feedbacks');

        const result = await feedbacks.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 1) {
            res.json({ success: true, message: 'Feedback excluído com sucesso!' });
        } else {
            res.status(404).json({ error: 'Feedback não encontrado' });
        }
    } catch (error) {
        console.error('❌ Erro ao excluir feedback:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para atualizar credenciais - PROTEGIDA
app.post('/api/update-credentials', requireAuthToken, async (req, res) => {
    try {
        const { newUsername, currentPassword, newPassword } = req.body;

        // Verificar se todos os campos foram enviados
        if (!newUsername || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar senha atual
        if (currentPassword !== currentCredentials.password) {
            return res.status(401).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        // Validar nova senha (mínimo 6 caracteres)
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A nova senha deve ter pelo menos 6 caracteres'
            });
        }

        // Atualizar credenciais
        currentCredentials.username = newUsername;
        currentCredentials.password = newPassword;

        // Salvar no banco de dados
        const saved = await saveCredentialsToDatabase(newUsername, newPassword);

        console.log(`✅ Credenciais atualizadas - Usuário: ${newUsername} - Salvo no DB: ${saved}`);

        res.json({
            success: true,
            message: saved ? 'Credenciais atualizadas com sucesso' : 'Credenciais atualizadas (não foi possível salvar no banco)'
        });

    } catch (error) {
        console.error('Erro ao atualizar credenciais:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para verificar autenticação
app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

// Rotas para servir páginas HTML SEMPRE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/painel.html'));
});

// Exportar app para Vercel
module.exports = app;

// Inicializar credenciais do banco de dados para Vercel
if (require.main !== module) {
    // Executar imediatamente no ambiente Vercel
    console.log('🔄 Inicializando credenciais para Vercel...');
    loadCredentialsFromDatabase()
        .then(() => {
            console.log('✅ Credenciais carregadas do banco no Vercel');
        })
        .catch(error => {
            console.error('❌ Erro ao carregar credenciais no Vercel:', error);
            console.log('⚠️ Usando credenciais padrão');
        });
}

// Para execução local
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, async () => {
        console.log(`🚀 Servidor Academia Elohim Fitness rodando na porta ${port}`);
        console.log(`📝 Formulário: http://localhost:${port}`);
        console.log(`🔐 Login Admin: http://localhost:${port}/login`);
        console.log(`📊 Painel Admin: http://localhost:${port}/painel`);

        // Carregar credenciais do banco de dados na inicialização
        console.log('🔄 Carregando credenciais do banco de dados...');
        const loaded = await loadCredentialsFromDatabase();
        if (loaded) {
            console.log('✅ Credenciais do banco carregadas com sucesso');
        } else {
            console.log('⚠️ Usando credenciais padrão do .env');
        }
    });
}
