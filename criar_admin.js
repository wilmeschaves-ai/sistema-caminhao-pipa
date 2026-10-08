const pool = require('./backend/config/db');
const bcrypt = require('bcrypt');

async function criarAdminTeste() {
    try {
        const nome = 'Administrador';
        const login = 'admin@prefeitura.com'; // Usado como identificador de login
        const senhaPura = '123456';
        const perfil = 'admin';

        // Criptografar a senha
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senhaPura, saltRounds);

        // Inserir na base de dados usando as colunas corretas (login e perfil)
        const sql = `
            INSERT INTO usuarios (nome, login, senha, perfil) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE senha = ?, nome = ?, perfil = ?
        `;

        await pool.query(sql, [nome, login, senhaHash, perfil, senhaHash, nome, perfil]);

        console.log('✅ Utilizador admin criado com sucesso!');
        console.log('----------------------------------------');
        console.log(`📧 Login: ${login}`);
        console.log(`🔑 Senha: ${senhaPura}`);
        console.log('----------------------------------------');

        process.exit();
    } catch (error) {
        console.error('❌ Erro ao criar o utilizador admin:', error.message);
        process.exit(1);
    }
}

criarAdminTeste();