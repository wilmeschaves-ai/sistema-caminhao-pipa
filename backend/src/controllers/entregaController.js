const db = require('../../config/db');

// Listar todas as entregas com detalhes do carregamento e do beneficiário
exports.listarEntregas = async (req, res) => {
    try {
        const query = `
        SELECT 
            e.id, 
            e.data_hora, 
            e.litros_entregues, 
            e.observacao,
            b.nome AS beneficiario_nome, 
            c.fonte_agua, 
            cam.placa AS caminhao_placa, 
            m.nome AS motorista_nome
        FROM entrega e
        JOIN beneficiario b ON e.beneficiario_id = b.id
        JOIN carregamento c ON e.carregamento_id = c.id
        JOIN caminhao cam ON c.caminhao_id = cam.id
        JOIN motorista m ON c.motorista_id = m.id
        ORDER BY e.data_hora DESC
    `;

        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Erro ao listar entregas:', err);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Registar uma nova entrega com validação de saldo de água
exports.criarEntrega = async (req, res) => {
    try {
        const { carregamento_id, beneficiario_id, litros_entregues, observacao } = req.body;
        const qtdeEntregue = parseFloat(litros_entregues);

        // 1. Verificar o total carregado e o que já foi entregue deste carregamento
        const sqlSaldo = `
            SELECT 
                c.litros_carregados,
                IFNULL(SUM(e.litros_entregues), 0) AS total_entregue
            FROM carregamento c
            LEFT JOIN entrega e ON e.carregamento_id = c.id
            WHERE c.id = ?
            GROUP BY c.id
        `;

        const [saldoResult] = await db.query(sqlSaldo, [carregamento_id]);

        if (saldoResult.length === 0) {
            return res.status(404).json({ erro: 'Carregamento não encontrado.' });
        }

        const { litros_carregados, total_entregue } = saldoResult[0];
        const litrosRestantes = litros_carregados - total_entregue;

        // 2. Validar se a quantidade solicitada excede o saldo disponível
        if (qtdeEntregue > litrosRestantes) {
            return res.status(400).json({ 
                erro: `Água insuficiente! Este carregamento tem ${litros_carregados}L, já foram entregues ${total_entregue}L, restando apenas ${litrosRestantes}L.` 
            });
        }

        // 3. Efetuar o registo da entrega
        const queryInsert = `
            INSERT INTO entrega (carregamento_id, beneficiario_id, litros_entregues, observacao, data_hora) 
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        const [result] = await db.query(queryInsert, [carregamento_id, beneficiario_id, qtdeEntregue, observacao || null]);
        
        res.status(201).json({ 
            mensagem: 'Entrega registada com sucesso!', 
            id: result.insertId,
            litrosRestantes: litrosRestantes - qtdeEntregue 
        });

    } catch (err) {
        console.error('Erro ao salvar entrega:', err);
        res.status(500).json({ erro: 'Erro ao registar entrega' });
    }
};

// Deletar uma entrega
exports.deletarEntrega = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM entrega WHERE id = ?', [id]);
        res.json({ mensagem: 'Entrega excluída com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir entrega:', err);
        res.status(500).json({ erro: 'Erro ao excluir entrega' });
    }
};