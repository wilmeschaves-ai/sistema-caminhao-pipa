const db = require('../../config/db');

// Listar todos os carregamentos com nomes de caminhão e motorista
exports.listarCarregamentos = async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.fonte_agua, c.litros_carregados, c.data_hora,
                   cam.placa AS caminhao_placa, cam.modelo AS caminhao_modelo,
                   m.nome AS motorista_nome
            FROM carregamento c
            JOIN caminhao cam ON c.caminhao_id = cam.id
            JOIN motorista m ON c.motorista_id = m.id
            ORDER BY c.data_hora DESC
        `;
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Erro ao listar carregamentos:', err);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Criar um novo carregamento
exports.criarCarregamento = async (req, res) => {
    try {
        const { caminhao_id, motorista_id, fonte_agua, litros_carregados } = req.body;
        
        const query = `
            INSERT INTO carregamento (caminhao_id, motorista_id, fonte_agua, litros_carregados) 
            VALUES (?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [caminhao_id, motorista_id, fonte_agua, litros_carregados]);
        res.status(201).json({ mensagem: 'Carregamento registado com sucesso!', id: result.insertId });
    } catch (err) {
        console.error('Erro ao salvar carregamento:', err);
        res.status(500).json({ erro: 'Erro ao registar carregamento' });
    }
};

// Deletar um carregamento
exports.deletarCarregamento = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM carregamento WHERE id = ?', [id]);
        res.json({ mensagem: 'Carregamento excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir carregamento:', err);
        res.status(500).json({ erro: 'Erro ao excluir carregamento' });
    }
};