const db = require('../../config/db');

const getEstatisticas = async (req, res) => {
    try {
        // 1. Total de água entregue e total de viagens
        const [resEntregas] = await db.query(`
            SELECT 
                COALESCE(SUM(litros_entregues), 0) AS total_agua,
                COUNT(*) AS total_viagens
            FROM entrega
        `);

        // 2. Total de famílias/beneficiários únicos atendidos
        const [resBeneficiarios] = await db.query(`
            SELECT COUNT(DISTINCT beneficiario_id) AS total_familias 
            FROM entrega
        `);

        // 3. Volume mensal de água entregue
        const [resVolumeMensal] = await db.query(`
            SELECT 
                DATE_FORMAT(data_hora, '%Y-%m') AS mes,
                COALESCE(SUM(litros_entregues), 0) AS total
            FROM entrega
            GROUP BY mes
            ORDER BY mes ASC
            LIMIT 6
        `);

        // 4. Distribuição da frota ligando caminhao -> carregamento -> entrega
        const [resFrota] = await db.query(`
            SELECT 
                c.modelo,
                c.placa,
                COALESCE(SUM(e.litros_entregues), 0) AS total_litros
            FROM caminhao c
            LEFT JOIN carregamento car ON c.id = car.caminhao_id
            LEFT JOIN entrega e ON car.id = e.carregamento_id
            GROUP BY c.id, c.modelo, c.placa
        `);

        // Resposta agregada para o Dashboard
        res.json({
            totalAgua: resEntregas[0].total_agua,
            totalViagens: resEntregas[0].total_viagens,
            totalFamilias: resBeneficiarios[0].total_familias,
            volumeMensal: resVolumeMensal,
            distribuicaoFrota: resFrota
        });

    } catch (err) {
        console.error('Erro ao buscar estatísticas do dashboard:', err);
        res.status(500).json({ erro: 'Erro interno ao carregar estatísticas do dashboard.' });
    }
};

module.exports = {
    getEstatisticas
};