const db = require('../../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs'); // <-- Importar o ExcelJS

const relatoriosController = {
    // 1. Gerar dados do relatório com filtros
    async obterRelatorio(req, res) {
        try {
            const { data_inicio, data_fim, caminhao_id } = req.query;
            
            let query = `
                SELECT 
                    DATE_FORMAT(e.data_hora, '%Y-%m-%d %H:%i') AS data,
                    CONCAT(COALESCE(c.modelo, 'Caminhão'), ' - ', COALESCE(c.placa, '')) AS caminhao,
                    b.nome AS beneficiario,
                    e.litros_entregues AS litros,
                    'Concluído' AS status
                FROM entrega e
                LEFT JOIN carregamento car ON e.carregamento_id = car.id
                LEFT JOIN caminhao c ON car.caminhao_id = c.id
                LEFT JOIN beneficiario b ON e.beneficiario_id = b.id
                WHERE 1=1
            `;
            
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            if (caminhao_id) {
                query += ` AND c.id = ?`;
                params.push(caminhao_id);
            }
            query += ` ORDER BY e.data_hora DESC`;

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            res.status(500).json({ error: "Erro interno no servidor" });
        }
    },

    // 2. Obter estatísticas para o Dashboard
    async obterEstatisticas(req, res) {
        try {
            const estatisticas = {
                total_litros: 125000,
                total_familias: 48,
                total_viagens: 25,
                volume_mes: [12, 19, 15, 25, 22, 30],
                frota_distribuicao: [45, 35, 20]
            };
            res.json(estatisticas);
        } catch (error) {
            console.error("Erro ao buscar estatísticas do dashboard:", error);
            res.status(500).json({ error: "Erro interno no servidor" });
        }
    },

    // 3. Exportação para PDF
    async exportarPDF(req, res) {
        try {
            const { data_inicio, data_fim, caminhao_id } = req.query;
            
            let query = `
                SELECT 
                    DATE_FORMAT(e.data_hora, '%Y-%m-%d %H:%i') AS data,
                    CONCAT(COALESCE(c.modelo, 'Caminhão'), ' - ', COALESCE(c.placa, '')) AS caminhao,
                    b.nome AS beneficiario,
                    e.litros_entregues AS litros
                FROM entrega e
                LEFT JOIN carregamento car ON e.carregamento_id = car.id
                LEFT JOIN caminhao c ON car.caminhao_id = c.id
                LEFT JOIN beneficiario b ON e.beneficiario_id = b.id
                WHERE 1=1
            `;
            
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            if (caminhao_id) {
                query += ` AND c.id = ?`;
                params.push(caminhao_id);
            }
            query += ` ORDER BY e.data_hora DESC`;

            const [rows] = await db.query(query, params);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_entregas.pdf');
            doc.pipe(res);

            doc.fontSize(20).fillColor('#1E3A8A').text('Relatório de Entregas', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#6B7280').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
            doc.moveDown(1.5);

            const tableTop = doc.y;
            const itemX = 50;
            
            doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold');
            doc.text('Data/Hora', itemX, tableTop, { width: 110 });
            doc.text('Caminhão', itemX + 110, tableTop, { width: 130 });
            doc.text('Beneficiário', itemX + 240, tableTop, { width: 140 });
            doc.text('Litros', itemX + 380, tableTop, { width: 80, align: 'right' });

            doc.moveTo(itemX, tableTop + 15).lineTo(itemX + 460, tableTop + 15).strokeColor('#D1D5DB').stroke();

            let position = tableTop + 25;
            doc.font('Helvetica').fontSize(9);

            if (rows.length === 0) {
                doc.text('Nenhum registo encontrado para os filtros selecionados.', itemX, position, { width: 460, align: 'center' });
            } else {
                rows.forEach((row) => {
                    if (position > 700) {
                        doc.addPage();
                        position = 50;
                    }
                    doc.fillColor('#374151');
                    doc.text(row.data || '', itemX, position, { width: 110 });
                    doc.text(row.caminhao || '', itemX + 110, position, { width: 130 });
                    doc.text(row.beneficiario || '', itemX + 240, position, { width: 140 });
                    doc.text(`${Number(row.litros || 0).toLocaleString('pt-BR')} L`, itemX + 380, position, { width: 80, align: 'right' });
                    position += 20;
                    doc.moveTo(itemX, position - 5).lineTo(itemX + 460, position - 5).strokeColor('#F3F4F6').stroke();
                });
            }

            doc.end();
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Erro interno ao gerar PDF" });
            }
        }
    },

    // 4. Exportação Real para Excel usando ExcelJS
    async exportarExcel(req, res) {
        try {
            const { data_inicio, data_fim, caminhao_id } = req.query;
            
            let query = `
                SELECT 
                    DATE_FORMAT(e.data_hora, '%Y-%m-%d %H:%i') AS data,
                    CONCAT(COALESCE(c.modelo, 'Caminhão'), ' - ', COALESCE(c.placa, '')) AS caminhao,
                    b.nome AS beneficiario,
                    e.litros_entregues AS litros,
                    'Concluído' AS status
                FROM entrega e
                LEFT JOIN carregamento car ON e.carregamento_id = car.id
                LEFT JOIN caminhao c ON car.caminhao_id = c.id
                LEFT JOIN beneficiario b ON e.beneficiario_id = b.id
                WHERE 1=1
            `;
            
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            if (caminhao_id) {
                query += ` AND c.id = ?`;
                params.push(caminhao_id);
            }
            query += ` ORDER BY e.data_hora DESC`;

            const [rows] = await db.query(query, params);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Relatórios de Pipas';
            const worksheet = workbook.addWorksheet('Relatório de Entregas');

            worksheet.columns = [
                { header: 'Data / Hora', key: 'data', width: 20 },
                { header: 'Caminhão', key: 'caminhao', width: 25 },
                { header: 'Beneficiário', key: 'beneficiario', width: 30 },
                { header: 'Litros Entregues', key: 'litros', width: 18 },
                { header: 'Status', key: 'status', width: 15 }
            ];

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1E3A8A' }
            };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).height = 25;

            rows.forEach(row => {
                const addedRow = worksheet.addRow({
                    data: row.data,
                    caminhao: row.caminhao,
                    beneficiario: row.beneficiario,
                    litros: Number(row.litros || 0),
                    status: row.status
                });

                addedRow.getCell('litros').numFmt = '#,##0';
                addedRow.getCell('litros').alignment = { horizontal: 'right' };
                addedRow.getCell('data').alignment = { horizontal: 'center' };
                addedRow.getCell('status').alignment = { horizontal: 'center' };
            });

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'D1D5DB' } },
                        left: { style: 'thin', color: { argb: 'D1D5DB' } },
                        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
                        right: { style: 'thin', color: { argb: 'D1D5DB' } }
                    };
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_entregas.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Erro ao exportar Excel:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Erro interno no servidor ao gerar Excel" });
            }
        }
    },

    // 5. Relatório: Total de litros recebidos por beneficiário
    
    async relatorioPorBeneficiario(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;
            
            let query = `
                SELECT 
                    b.nome AS beneficiario,
                    CONCAT(COALESCE(b.logradouro, ''), ', ', COALESCE(b.numero, ''), ' - ', COALESCE(b.bairro, ''), ', ', COALESCE(b.cidade, '')) AS endereco,
                    COUNT(e.id) AS total_entregas,
                    SUM(e.litros_entregues) AS total_litros
                FROM entrega e
                INNER JOIN beneficiario b ON e.beneficiario_id = b.id
                WHERE 1=1
            `;
            
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }

            query += ` GROUP BY b.id, b.nome, b.logradouro, b.numero, b.bairro, b.cidade ORDER BY total_litros DESC`;

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error("Erro ao gerar relatório por beneficiário:", error);
            res.status(500).json({ error: "Erro interno no servidor" });
        }
    },


    // 6. Relatório: Desempenho e litragem por caminhão
    async relatorioPorCaminhao(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;
            
            let query = `
                SELECT 
                    CONCAT(COALESCE(c.modelo, 'Caminhão'), ' - ', COALESCE(c.placa, '')) AS caminhao,
                    COUNT(DISTINCT car.id) AS total_carregamentos,
                    COUNT(e.id) AS total_entregas,
                    SUM(e.litros_entregues) AS total_litros
                FROM caminhao c
                LEFT JOIN carregamento car ON car.caminhao_id = c.id
                LEFT JOIN entrega e ON e.carregamento_id = car.id
                WHERE 1=1
            `;
            
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }

            query += ` GROUP BY c.id, c.modelo, c.placa ORDER BY total_litros DESC`;

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error("Erro ao gerar relatório por caminhão:", error);
            res.status(500).json({ error: "Erro interno no servidor" });
        }
    },

    // 7. Exportar PDF por Beneficiário
    async exportarPDFBeneficiario(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;
            let query = `
                SELECT 
                    b.nome AS beneficiario, 
                    CONCAT(COALESCE(b.logradouro, ''), ', ', COALESCE(b.numero, ''), ' - ', COALESCE(b.bairro, ''), ', ', COALESCE(b.cidade, '')) AS endereco, 
                    COUNT(e.id) AS total_entregas, 
                    SUM(e.litros_entregues) AS total_litros
                FROM entrega e
                INNER JOIN beneficiario b ON e.beneficiario_id = b.id
                WHERE 1=1
            `;
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            query += ` GROUP BY b.id, b.nome, b.logradouro, b.numero, b.bairro, b.cidade ORDER BY total_litros DESC`;
            const [rows] = await db.query(query, params);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_por_beneficiario.pdf');
            doc.pipe(res);

            doc.fontSize(20).fillColor('#1E3A8A').text('Relatório por Beneficiário', { align: 'center' });
            doc.moveDown(1.5);

            const tableTop = doc.y;
            const itemX = 50;
            doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold');
            doc.text('Beneficiário', itemX, tableTop, { width: 140 });
            doc.text('Endereço', itemX + 140, tableTop, { width: 170 });
            doc.text('Entregas', itemX + 310, tableTop, { width: 60, align: 'center' });
            doc.text('Total Litros', itemX + 370, tableTop, { width: 90, align: 'right' });
            doc.moveTo(itemX, tableTop + 15).lineTo(itemX + 460, tableTop + 15).strokeColor('#D1D5DB').stroke();

            let position = tableTop + 25;
            doc.font('Helvetica').fontSize(9);
            rows.forEach((row) => {
                if (position > 700) { doc.addPage(); position = 50; }
                doc.fillColor('#374151');
                doc.text(row.beneficiario || '', itemX, position, { width: 140 });
                doc.text(row.endereco || '-', itemX + 140, position, { width: 170 });
                doc.text(String(row.total_entregas || 0), itemX + 310, position, { width: 60, align: 'center' });
                doc.text(`${Number(row.total_litros || 0).toLocaleString('pt-BR')} L`, itemX + 370, position, { width: 90, align: 'right' });
                position += 20;
            });
            doc.end();
        } catch (error) {
            console.error("Erro PDF Beneficiário:", error);
            if (!res.headersSent) res.status(500).json({ error: "Erro ao gerar PDF" });
        }
    },
    // 8. Exportar Excel por Beneficiário
    async exportarExcelBeneficiario(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;
            let query = `
                SELECT 
                    b.nome AS beneficiario, 
                    CONCAT(COALESCE(b.logradouro, ''), ', ', COALESCE(b.numero, ''), ' - ', COALESCE(b.bairro, ''), ', ', COALESCE(b.cidade, '')) AS endereco, 
                    COUNT(e.id) AS total_entregas, 
                    SUM(e.litros_entregues) AS total_litros
                FROM entrega e
                INNER JOIN beneficiario b ON e.beneficiario_id = b.id
                WHERE 1=1
            `;
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            query += ` GROUP BY b.id, b.nome, b.logradouro, b.numero, b.bairro, b.cidade ORDER BY total_litros DESC`;
            const [rows] = await db.query(query, params);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Por Beneficiário');
            worksheet.columns = [
                { header: 'Beneficiário', key: 'beneficiario', width: 30 },
                { header: 'Endereço', key: 'endereco', width: 40 },
                { header: 'Total Entregas', key: 'total_entregas', width: 15 },
                { header: 'Total Litros', key: 'total_litros', width: 18 }
            ];

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
            
            rows.forEach(row => {
                const added = worksheet.addRow({
                    beneficiario: row.beneficiario,
                    endereco: row.endereco || '-',
                    total_entregas: row.total_entregas,
                    total_litros: Number(row.total_litros || 0)
                });
                added.getCell('total_litros').numFmt = '#,##0';
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_por_beneficiario.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Erro Excel Beneficiário:", error);
            if (!res.headersSent) res.status(500).json({ error: "Erro ao gerar Excel" });
        }
    },
    // 9. Exportar PDF por Caminhão
    async exportarPDFCaminhao(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;
            let query = `
                SELECT CONCAT(COALESCE(c.modelo, 'Caminhão'), ' - ', COALESCE(c.placa, '')) AS caminhao,
                       COUNT(DISTINCT car.id) AS total_carregamentos, COUNT(e.id) AS total_entregas, 
                       SUM(e.litros_entregues) AS total_litros
                FROM caminhao c
                LEFT JOIN carregamento car ON car.caminhao_id = c.id
                LEFT JOIN entrega e ON e.carregamento_id = car.id
                WHERE 1=1
            `;
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            query += ` GROUP BY c.id, c.modelo, c.placa ORDER BY total_litros DESC`;
            const [rows] = await db.query(query, params);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_por_caminhao.pdf');
            doc.pipe(res);

            doc.fontSize(20).fillColor('#1E3A8A').text('Desempenho por Caminhão', { align: 'center' });
            doc.moveDown(1.5);

            const tableTop = doc.y;
            const itemX = 50;
            doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold');
            doc.text('Caminhão', itemX, tableTop, { width: 180 });
            doc.text('Carregamentos', itemX + 180, tableTop, { width: 90, align: 'center' });
            doc.text('Entregas', itemX + 270, tableTop, { width: 80, align: 'center' });
            doc.text('Total Litros', itemX + 350, tableTop, { width: 110, align: 'right' });
            doc.moveTo(itemX, tableTop + 15).lineTo(itemX + 460, tableTop + 15).strokeColor('#D1D5DB').stroke();

            let position = tableTop + 25;
            doc.font('Helvetica').fontSize(9);
            rows.forEach((row) => {
                if (position > 700) { doc.addPage(); position = 50; }
                doc.fillColor('#374151');
                doc.text(row.caminhao || '', itemX, position, { width: 180 });
                doc.text(String(row.total_carregamentos || 0), itemX + 180, position, { width: 90, align: 'center' });
                doc.text(String(row.total_entregas || 0), itemX + 270, position, { width: 80, align: 'center' });
                doc.text(`${Number(row.total_litros || 0).toLocaleString('pt-BR')} L`, itemX + 350, position, { width: 110, align: 'right' });
                position += 20;
            });
            doc.end();
        } catch (error) {
            console.error("Erro PDF Caminhão:", error);
            if (!res.headersSent) res.status(500).json({ error: "Erro ao gerar PDF" });
        }
    },

    // 10. Exportar Excel por Caminhão
    async exportarExcelCaminhao(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;
            let query = `
                SELECT CONCAT(COALESCE(c.modelo, 'Caminhão'), ' - ', COALESCE(c.placa, '')) AS caminhao,
                       COUNT(DISTINCT car.id) AS total_carregamentos, COUNT(e.id) AS total_entregas, 
                       SUM(e.litros_entregues) AS total_litros
                FROM caminhao c
                LEFT JOIN carregamento car ON car.caminhao_id = c.id
                LEFT JOIN entrega e ON e.carregamento_id = car.id
                WHERE 1=1
            `;
            const params = [];
            if (data_inicio && data_fim) {
                query += ` AND DATE(e.data_hora) BETWEEN ? AND ?`;
                params.push(data_inicio, data_fim);
            }
            query += ` GROUP BY c.id, c.modelo, c.placa ORDER BY total_litros DESC`;
            const [rows] = await db.query(query, params);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Por Caminhão');
            worksheet.columns = [
                { header: 'Caminhão', key: 'caminhao', width: 30 },
                { header: 'Carregamentos', key: 'total_carregamentos', width: 18 },
                { header: 'Entregas', key: 'total_entregas', width: 15 },
                { header: 'Total Litros', key: 'total_litros', width: 18 }
            ];

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };

            rows.forEach(row => {
                const added = worksheet.addRow({
                    caminhao: row.caminhao,
                    total_carregamentos: row.total_carregamentos,
                    total_entregas: row.total_entregas,
                    total_litros: Number(row.total_litros || 0)
                });
                added.getCell('total_litros').numFmt = '#,##0';
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_por_caminhao.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Erro Excel Caminhão:", error);
            if (!res.headersSent) res.status(500).json({ error: "Erro ao gerar Excel" });
        }
    }
};

module.exports = relatoriosController;