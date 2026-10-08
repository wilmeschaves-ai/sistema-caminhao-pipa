const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Listar todos os motoristas com os dados do caminhão associado
exports.listarMotoristas = async (req, res) => {
    try {
        const query = `
            SELECT m.*, c.placa AS caminhao_placa, c.modelo AS caminhao_modelo 
            FROM motorista m 
            LEFT JOIN caminhao c ON m.caminhao_id = c.id
        `;
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar motoristas:', err);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Criar um novo motorista (com suporte a foto)
exports.criarMotorista = async (req, res) => {
    try {
        const { nome, cnh, validade_cnh, telefone, status, caminhao_id } = req.body;
        
        if (!nome || !cnh) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ erro: 'Nome e CNH são obrigatórios.' });
        }

        const foto = req.file ? req.file.filename : null;

        const query = 'INSERT INTO motorista (nome, cnh, validade_cnh, telefone, status, caminhao_id, foto) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        const [result] = await db.query(query, [
            nome, 
            cnh, 
            validade_cnh || null, 
            telefone || null, 
            status || 'Ativo', 
            caminhao_id || null,
            foto
        ]);

        res.status(201).json({ mensagem: 'Motorista cadastrado com sucesso!', id: result.insertId });
    } catch (err) {
        console.error('Erro ao salvar motorista:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Já existe um motorista registado com esta CNH.' });
        }
        
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Atualizar um motorista existente (com suporte a nova foto)
exports.atualizarMotorista = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cnh, validade_cnh, telefone, status, caminhao_id } = req.body;

        if (!nome || !cnh) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ erro: 'Nome e CNH são obrigatórios.' });
        }

        // Buscar motorista antigo para verificar se já tinha foto guardada
        const [motoristaAntigo] = await db.query('SELECT foto FROM motorista WHERE id = ?', [id]);
        if (motoristaAntigo.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }

        let novaFoto = motoristaAntigo[0].foto;

        // Se uma nova foto foi enviada, removemos a antiga do servidor e atualizamos
        if (req.file) {
            novaFoto = req.file.filename;
            if (motoristaAntigo[0].foto) {
                const caminhoAntigo = path.join(__dirname, '../../../frontend/uploads', motoristaAntigo[0].foto);
                if (fs.existsSync(caminhoAntigo)) {
                    fs.unlinkSync(caminhoAntigo);
                }
            }
        }

        const query = `
            UPDATE motorista 
            SET nome = ?, cnh = ?, validade_cnh = ?, telefone = ?, status = ?, caminhao_id = ?, foto = ?
            WHERE id = ?
        `;

        await db.query(query, [
            nome, 
            cnh, 
            validade_cnh || null, 
            telefone || null, 
            status || 'Ativo', 
            caminhao_id || null, 
            novaFoto, 
            id
        ]);

        res.json({ mensagem: 'Motorista atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar motorista:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Já existe outro motorista registado com esta CNH.' });
        }
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Deletar um motorista (e remover a foto da pasta uploads)
exports.deletarMotorista = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [motoristaRows] = await db.query('SELECT foto FROM motorista WHERE id = ?', [id]);
        
        if (motoristaRows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado' });
        }

        const foto = motoristaRows[0].foto;

        const [results] = await db.query('DELETE FROM motorista WHERE id = ?', [id]);
        
        if (results.affectedRows > 0 && foto) {
            const caminhoFoto = path.join(__dirname, '../../frontend/uploads', foto);
            if (fs.existsSync(caminhoFoto)) {
                fs.unlinkSync(caminhoFoto);
            }
        }
        
        res.json({ mensagem: 'Motorista excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir motorista:', err);
        res.status(500).json({ erro: 'Erro ao excluir motorista' });
    }
};