const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();

// Variáveis de ambiente para Vercel
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://webpulse:silva225566@eloinformulario.vcympy9.mongodb.net/?retryWrites=true&w=majority&appName=eloinformulario';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'eloin2024';
const SESSION_SECRET = process.env.SESSION_SECRET || 'eloin-secret-key-2024';

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
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Middleware de autenticação
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
        db = client.db('eloin_fitness');
        console.log('🚀 Conectado ao MongoDB Atlas - Academia Eloin Fitness');
    }
    return db;
}

// Rotas da API

// Rota para enviar feedback
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
        console.log('✅ Novo feedback salvo - Academia Eloin Fitness:', result.insertedId);

        res.json({
            success: true,
            message: 'Feedback enviado com sucesso para Academia Eloin Fitness!'
        });
    } catch (error) {
        console.error('❌ Erro ao salvar feedback da Academia Eloin Fitness:', error);
        res.status(500).json({
            error: 'Erro interno do servidor da Academia Eloin Fitness'
        });
    }
});

// Rota para login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true, message: 'Login realizado com sucesso!' });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Rota para logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout realizado com sucesso!' });
});

// Rota para obter todos os feedbacks (protegida)
app.get('/api/feedbacks', requireAuth, async (req, res) => {
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
app.delete('/api/feedback/:id', requireAuth, async (req, res) => {
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
        console.log(`🚀 Servidor Academia Eloin Fitness rodando na porta ${port}`);
        console.log(`📝 Formulário: http://localhost:${port}`);
        console.log(`🔐 Login Admin: http://localhost:${port}/login`);
        console.log(`📊 Painel Admin: http://localhost:${port}/painel`);
    });
}
