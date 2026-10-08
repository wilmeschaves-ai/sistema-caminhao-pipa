const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- IMPORTANTE: Garanta que o path está aqui no topo
require('dotenv').config();

// Conexão com o banco
require('./config/db');

const authRoutes = require('./src/routes/authRoutes');
const caminhaoRoutes = require('./src/routes/caminhaoRoutes');
const motoristaRoutes = require('./src/routes/motoristaRoutes');
const beneficiarioRoutes = require('./src/routes/beneficiarioRoutes');
const carregamentoRoutes = require('./src/routes/carregamentoRoutes');
const entregaRoutes = require('./src/routes/entregaRoutes');
const relatoriosRoutes = require('./src/routes/relatoriosRoutes');
const dashboardsRoutes = require('./src/routes/dashboardsRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// DISPONIBILIZAR A PASTA UPLOADS DO FRONTEND PUBLICAMENTE
// Como o server.js está na pasta backend e a pasta uploads está no frontend, 
// subimos um nível (..) e entramos na pasta frontend/uploads
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// Rotas da API


// Altere isto:
// app.use('/api/auth', authRoutes);

// Para isto:
app.use('/api', authRoutes);
app.use('/api/caminhoes', caminhaoRoutes);
app.use('/api/motoristas', motoristaRoutes);
app.use('/api/beneficiarios', beneficiarioRoutes);
app.use('/api/carregamentos', carregamentoRoutes);
app.use('/api/entregas', entregaRoutes);

app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/dashboards', dashboardsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});