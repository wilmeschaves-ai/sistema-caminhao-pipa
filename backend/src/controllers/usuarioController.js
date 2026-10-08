const bcrypt = require('bcrypt');
const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Função de Login
exports.login = async (req, res) => {
    try {
        const { login, senha } = req.body;

        if (!login || !senha) {
            return res.status(400).json({ erro: 'Login e senha são obrigatórios.' });
        }

        // Buscar usuário pelo campo login
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE login = ?', [login]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const usuario = usuarios[0];

        // Compara a senha digitada com o hash salvo no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        // Retorna os dados do usuário logado (sem a senha)
        res.json({
            mensagem: 'Login efetuado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                login: usuario.login,
                perfil: usuario.perfil
            }
        });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

exports.listarUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nome, login, perfil, foto, criado_em FROM usuarios ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ erro: 'Erro interno ao listar usuários.' });
    }
};

exports.criarUsuario = async (req, res) => {
    const { nome, login, senha, perfil } = req.body || {};
    const foto = req.file ? req.file.filename : null;

    try {
        if (!nome || !login || !senha || !perfil) {
            return res.status(400).json({ erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);
        
        const [result] = await db.query(
            'INSERT INTO usuarios (nome, login, senha, perfil, foto) VALUES (?, ?, ?, ?, ?)',
            [nome, login, senhaHash, perfil, foto]
        );
        
        res.status(201).json({ mensagem: 'Usuário criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ erro: 'Erro ao criar usuário.' });
    }
};

exports.atualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome, login, senha, perfil } = req.body || {};
    const novaFoto = req.file ? req.file.filename : null;
    // Resto do código...

    try {
        // Buscar foto antiga para apagar se houver nova
        const [oldUser] = await db.query('SELECT foto FROM usuarios WHERE id = ?', [id]);
        
        let query = 'UPDATE usuarios SET nome = ?, login = ?, perfil = ?';
        let params = [nome, login, perfil];

        if (novaFoto) {
            query += ', foto = ?';
            params.push(novaFoto);
            // Apagar ficheiro antigo da pasta uploads
            if (oldUser.length > 0 && oldUser[0].foto) {
                const oldPath = path.join(__dirname, '../../../frontend/uploads', oldUser[0].foto);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        if (senha && senha.trim() !== '') {
            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senha, saltRounds);
            query += ', senha = ?';
            params.push(senhaHash);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        res.json({ mensagem: 'Usuário atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
    }
};

exports.deletarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [oldUser] = await db.query('SELECT foto FROM usuarios WHERE id = ?', [id]);
        if (oldUser.length > 0 && oldUser[0].foto) {
            const oldPath = path.join(__dirname, '../../../frontend/uploads', oldUser[0].foto);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ mensagem: 'Usuário eliminado com sucesso!' });
    } catch (error) {
        console.error('Erro ao eliminar usuário:', error);
        res.status(500).json({ erro: 'Erro ao eliminar usuário.' });
    }
};