const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const app = express();

// Variáveis de ambiente para Vercel
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://webpulse:silva225566@elohimformulario.vcympy9.mongodb.net/?retryWrites=true&w=majority&appName=elohimformulario';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'elohim2024';
const SESSION_SECRET = process.env.SESSION_SECRET || 'elohim-secret-key-2024';
const JWT_SECRET = process.env.JWT_SECRET || 'elohim-jwt-secret-2024';

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
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        // Evitar definir domain para não invalidar cookies em hosts customizados
        // domain: undefined
    },
    name: 'elohim-session'
}));

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

// Middleware de autenticação alternativo baseado em token
function requireAuthToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : (req.headers['x-auth-token'] || null);

        if (headerToken) {
            const decoded = jwt.verify(headerToken, JWT_SECRET);
            req.user = decoded;
            return next();
        }

        if (req.session && req.session.authenticated) {
            return next();
        }

        return res.status(401).json({ error: 'Authentication required' });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
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
            client = new MongoClient(MONGODB_URI, {
                // Otimizações para Vercel
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 8000, // Timeout menor para falha rápida
                socketTimeoutMS: 8000,
                connectTimeoutMS: 8000,
                maxIdleTimeMS: 30000,
                // Otimizações de performance
                retryWrites: true,
                w: 'majority',
                compressors: ['zlib'],
                // Usar versão estável do driver
                useUnifiedTopology: true
            });
            
            await client.connect();
            db = client.db('elohim_fitness');
            console.log('✅ Conectado ao MongoDB Atlas');

            // Criar índice para timestamp se ainda não existir (em background)
            setImmediate(async () => {
                try {
                    await db.collection('feedbacks').createIndex({ timestamp: -1 }, { background: true });
                } catch (e) {
                    console.warn('Falha ao criar índice em feedbacks.timestamp:', e.message);
                }
            });
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

// Endpoint de warmup para prevenir cold starts
app.get('/api/warmup', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Tentar conectar ao banco (isso aquece a conexão)
        await connectToDatabase();
        
        // Carregar credenciais se necessário
        if (!currentCredentials.username || currentCredentials.username === 'admin') {
            await loadCredentialsFromDatabase();
        }
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            status: 'warm',
            message: 'Sistema aquecido com sucesso',
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            database: db ? 'connected' : 'not connected',
            credentials: 'loaded'
        });
    } catch (error) {
        res.status(200).json({
            status: 'warming',
            message: 'Aquecendo sistema...',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : (req.headers['x-auth-token'] || null);
        const sessionAuth = !!(req.session && req.session.authenticated);

        let tokenAuth = false;
        let username = req.session ? req.session.username : null;
        if (headerToken) {
            try {
                const decoded = jwt.verify(headerToken, JWT_SECRET);
                tokenAuth = true;
                username = decoded.username || username;
            } catch (e) {
                tokenAuth = false;
            }
        }

        res.json({
            authenticated: sessionAuth || tokenAuth,
            method: tokenAuth ? 'token' : sessionAuth ? 'session' : 'none',
            username
        });
    } catch (error) {
        res.status(500).json({ authenticated: false, error: 'Erro interno do servidor' });
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
            req.session.authenticated = true;
            req.session.username = username;
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ success: true, message: 'Login realizado com sucesso!', token, username });
        }
        console.log('❌ Credenciais inválidas para usuário:', username);
        console.log('Esperado:', { username: currentCredentials.username });
        console.log('Recebido:', { username, password: password ? '[HIDDEN]' : '[EMPTY]' });

        res.status(401).json({
            success: false,
            error: 'Credenciais inválidas'
        });
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
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logout realizado com sucesso!' });
    });
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
        const limit = Math.max(1, Math.min(500, parseInt(req.query.limit || '100', 10)));
        const allFeedbacks = await feedbacks.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
        res.json(allFeedbacks);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para deletar feedback (protegida)
// Mantém compatibilidade com /api/feedback/:id e adiciona /api/feedbacks/:id (plural que o frontend usa)
const deleteFeedbackHandler = async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const rawId = (req.params.id || '').trim();

        if (!/^[a-fA-F0-9]{24}$/.test(rawId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const database = await connectToDatabase();
        const feedbacks = database.collection('feedbacks');

        const result = await feedbacks.deleteOne({ _id: new ObjectId(rawId) });

        if (result.deletedCount === 1) {
            return res.json({ success: true, message: 'Feedback excluído com sucesso!' });
        }
        return res.status(404).json({ error: 'Feedback não encontrado' });
    } catch (error) {
        console.error('❌ Erro ao excluir feedback:', error.message);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

app.delete('/api/feedback/:id', requireAuthToken, deleteFeedbackHandler);
app.delete('/api/feedbacks/:id', requireAuthToken, deleteFeedbackHandler);

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
