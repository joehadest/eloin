const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

const app = express();
const port = process.env.PORT || 3000;

// Credenciais de login (em produção, use variáveis de ambiente)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'elohim2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configuração de sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'elohim-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Em produção, deve ser true com HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Conexão com MongoDB
const uri = process.env.MONGODB_URI || process.env.npm_config_mongodb_uri;
const client = new MongoClient(uri);

async function connectDB() {
    try {
        console.log('Tentando conectar ao MongoDB...');
        console.log('URI:', uri ? 'Configurada' : 'Não encontrada');
        await client.connect();
        console.log('✅ Conectado ao MongoDB com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        console.error('Detalhes do erro:', error);
    }
}

connectDB();

// Middleware de autenticação
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// Rota de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        req.session.username = username;
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token: 'authenticated-' + Date.now()
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Usuário ou senha incorretos'
        });
    }
});

// Rota de logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.json({ success: true, message: 'Logout realizado com sucesso' });
    });
});

// Rota para verificar autenticação
app.get('/api/auth-status', (req, res) => {
    res.json({
        authenticated: !!req.session.authenticated,
        username: req.session.username || null
    });
});
app.post('/api/feedback', async (req, res) => {
    try {
        const db = client.db('elohimformulario');
        const collection = db.collection('feedbacks');

        const feedbackData = {
            ...req.body,
            timestamp: new Date()
        };

        const result = await collection.insertOne(feedbackData);
        res.status(201).json({ message: 'Feedback salvo com sucesso!', id: result.insertedId });
    } catch (error) {
        console.error('Erro ao salvar feedback:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter todos os feedbacks (para o painel) - PROTEGIDA
app.get('/api/feedbacks', requireAuth, async (req, res) => {
    try {
        console.log('Tentando conectar ao banco de dados...');
        const db = client.db('elohimformulario');
        const collection = db.collection('feedbacks');

        console.log('Buscando feedbacks...');
        const feedbacks = await collection.find({}).sort({ timestamp: -1 }).toArray();
        console.log(`Encontrados ${feedbacks.length} feedbacks`);

        res.json(feedbacks);
    } catch (error) {
        console.error('Erro ao buscar feedbacks:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            details: 'Verifique a conexão com o MongoDB'
        });
    }
});

// Rota para servir o painel (PROTEGIDA)
app.get('/painel', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/painel.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
