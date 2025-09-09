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
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Configuração de sessão para Vercel
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Temporariamente false para debug no Vercel
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        httpOnly: true
    }
}));

// Store para tokens de sessão simples (em memória para esta demonstração)
let activeTokens = new Set();

// Store para credenciais atualizadas (em memória)
let currentCredentials = {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD
};

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
    if (!client) {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('elohim_fitness');
        console.log('🚀 Conectado ao MongoDB Atlas - Academia Elohim Fitness');
    }
    return db;
}

// Rotas da API

// Rota para verificar status de autenticação
app.get('/api/auth/status', (req, res) => {
    const token = req.headers['x-auth-token'];
    const sessionAuth = !!req.session.authenticated;
    const tokenAuth = token && activeTokens.has(token);

    console.log('Verificando status de autenticação:', {
        sessionID: req.sessionID,
        sessionAuth,
        tokenAuth,
        token: token ? 'presente' : 'ausente',
        activeTokensCount: activeTokens.size
    });

    res.json({
        authenticated: sessionAuth || tokenAuth,
        sessionID: req.sessionID,
        method: tokenAuth ? 'token' : sessionAuth ? 'session' : 'none'
    });
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
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === currentCredentials.username && password === currentCredentials.password) {
        // Autenticação tradicional para localhost
        req.session.authenticated = true;

        // Gerar token para Vercel
        const token = generateSimpleToken();
        activeTokens.add(token);

        // Limpar tokens antigos após 24 horas
        setTimeout(() => {
            activeTokens.delete(token);
        }, 24 * 60 * 60 * 1000);

        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token: token
        });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
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
app.post('/api/update-credentials', requireAuthToken, (req, res) => {
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

        console.log(`✅ Credenciais atualizadas - Usuário: ${newUsername}`);

        res.json({
            success: true,
            message: 'Credenciais atualizadas com sucesso'
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

// Rotas para servir arquivos estáticos (para desenvolvimento local)
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '../public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/login.html'));
    });

    app.get('/painel', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/painel.html'));
    });
}

// Exportar app para Vercel
module.exports = app;

// Para execução local
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`🚀 Servidor Academia Elohim Fitness rodando na porta ${port}`);
        console.log(`📝 Formulário: http://localhost:${port}`);
        console.log(`🔐 Login Admin: http://localhost:${port}/login`);
        console.log(`📊 Painel Admin: http://localhost:${port}/painel`);
    });
}
