const db = require('../../config/db');

// Listar todos os caminhões
exports.listarCaminhoes = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM caminhao');
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar caminhões:', err);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Criar um novo caminhão
exports.criarCaminhao = async (req, res) => {
    try {
        const { placa, modelo, capacidade_litros, renavam, vencimento_ipva } = req.body;
        const foto = req.file ? req.file.filename : null;
        
        if (!placa || !capacidade_litros) {
            return res.status(400).json({ erro: 'Placa e capacidade são obrigatórias.' });
        }

        const query = `
            INSERT INTO caminhao (placa, modelo, capacidade_litros, renavam, vencimento_ipva, status, foto) 
            VALUES (?, ?, ?, ?, ?, 'Disponível', ?)
        `;
        
        const [results] = await db.query(query, [
            placa, 
            modelo || null, 
            capacidade_litros, 
            renavam || null, 
            vencimento_ipva || null,
            foto
        ]);
        
        res.status(201).json({ mensagem: 'Caminhão cadastrado com sucesso!', id: results.insertId });
    } catch (err) {
        console.error('Erro ao cadastrar caminhão:', err);
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
            return res.status(400).json({ erro: 'Já existe um caminhão cadastrado com esta placa.' });
        }
        res.status(500).json({ erro: 'Erro interno ao cadastrar o caminhão.' });
    }
};

// Atualizar um caminhão existente
exports.atualizarCaminhao = async (req, res) => {
    try {
        const { id } = req.params;
        const { placa, modelo, capacidade_litros, renavam, vencimento_ipva } = req.body;
        const novaFoto = req.file ? req.file.filename : null;

        if (!placa || !capacidade_litros) {
            return res.status(400).json({ erro: 'Placa e capacidade são obrigatórias.' });
        }

        // Verifica se o caminhão existe
        const [caminhaoAtual] = await db.query('SELECT * FROM caminhao WHERE id = ?', [id]);
        if (caminhaoAtual.length === 0) {
            return res.status(404).json({ erro: 'Caminhão não encontrado.' });
        }

        // Define a foto: se enviou uma nova, usa a nova; caso contrário, mantém a antiga
        const fotoFinal = novaFoto || caminhaoAtual[0].foto;

        const query = `
            UPDATE caminhao 
            SET placa = ?, modelo = ?, capacidade_litros = ?, renavam = ?, vencimento_ipva = ?, foto = ?
            WHERE id = ?
        `;

        await db.query(query, [
            placa,
            modelo || null,
            capacidade_litros,
            renavam || null,
            vencimento_ipva || null,
            fotoFinal,
            id
        ]);

        res.json({ mensagem: 'Caminhão atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar caminhão:', err);
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
            return res.status(400).json({ erro: 'Já existe outro caminhão cadastrado com esta placa.' });
        }
        res.status(500).json({ erro: 'Erro interno ao atualizar o caminhão.' });
    }
};

// Deletar um caminhão
exports.deletarCaminhao = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM caminhao WHERE id = ?';
        
        const [results] = await db.query(query, [id]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: 'Caminhão não encontrado' });
        }
        
        res.json({ mensagem: 'Caminhão excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir caminhão:', err);
        res.status(500).json({ erro: 'Erro ao excluir caminhão' });
    }
};