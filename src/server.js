const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

// Conexão com MongoDB (comentada para teste)
// const uri = process.env.MONGODB_URI || process.env.npm_config_mongodb_uri;
// const client = new MongoClient(uri);

// async function connectDB() {
//     try {
//         console.log('Tentando conectar ao MongoDB...');
//         console.log('URI:', uri ? 'Configurada' : 'Não encontrada');
//         await client.connect();
//         console.log('✅ Conectado ao MongoDB com sucesso!');
//     } catch (error) {
//         console.error('❌ Erro ao conectar ao MongoDB:', error.message);
//         console.error('Detalhes do erro:', error);
//     }
// }

// connectDB();

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
    
    // Usar credenciais atualizadas (globais) ou fallback para as originais
    const currentUsername = global.ADMIN_USERNAME || process.env.ADMIN_USERNAME || ADMIN_USERNAME;
    const currentPassword = global.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || ADMIN_PASSWORD;

    if (username === currentUsername && password === currentPassword) {
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

// Rota para atualizar credenciais - PROTEGIDA
app.post('/api/update-credentials', requireAuth, (req, res) => {
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
        if (currentPassword !== ADMIN_PASSWORD) {
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

        // Atualizar credenciais na memória (em produção, salvar em arquivo de configuração ou banco)
        process.env.ADMIN_USERNAME = newUsername;
        process.env.ADMIN_PASSWORD = newPassword;
        
        // Também atualizar as variáveis globais
        global.ADMIN_USERNAME = newUsername;
        global.ADMIN_PASSWORD = newPassword;

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
app.get('/api/auth-status', (req, res) => {
    res.json({
        authenticated: !!req.session.authenticated,
        username: req.session.username || null
    });
});
app.post('/api/feedback', async (req, res) => {
    try {
        const db = client.db('elohim_fitness');
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
        const db = client.db('elohim_fitness');
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
