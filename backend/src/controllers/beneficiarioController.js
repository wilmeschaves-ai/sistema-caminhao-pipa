const db = require('../../config/db');
const multer = require('multer');
const path = require('path');

// Configuração do armazenamento de imagens com o Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Certifique-se de que a pasta 'uploads' existe na raiz ou no seu diretório público
        cb(null, path.join(__dirname, '../../../frontend/uploads')); 
    },
    filename: (req, file, cb) => {
        // Cria um nome único baseado na data atual + nome original para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'beneficiario-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por foto
}).single('foto_residencia'); // Nome do campo enviado pelo formulário HTML

// Listar todos os beneficiários
exports.listarBeneficiarios = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM beneficiario');
        res.json(results);
    } catch (err) {
        console.error('Erro ao listar beneficiários:', err);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};

// Criar um novo beneficiário (com suporte a upload de foto)
exports.criarBeneficiario = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Erro no upload da foto:', err);
            return res.status(400).json({ erro: 'Erro ao carregar a imagem da residência.' });
        }

        try {
            const { nome, documento, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
            
            // Se o upload ocorreu bem, pegamos o nome do ficheiro guardado, caso contrário fica null
            const fotoResidencia = req.file ? req.file.filename : null;
            
            const query = `
                INSERT INTO beneficiario (nome, documento, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, foto_residencia) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.query(query, [
                nome, documento, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, fotoResidencia
            ]);

            res.status(201).json({ mensagem: 'Beneficiário cadastrado com sucesso!', id: result.insertId });
        } catch (dbErr) {
            // Verifica se é um erro de documento duplicado
            if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
                return res.status(400).json({ 
                    erro: 'Este documento (CPF/CNPJ) já está cadastrado para outro beneficiário.' 
                });
            }

            console.error('Erro ao salvar beneficiário:', dbErr);
            res.status(500).json({ erro: 'Erro ao cadastrar beneficiário' });
        }
    });
};

// Deletar um beneficiário
exports.deletarBeneficiario = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Opcional: Poderia também apagar o ficheiro físico da pasta se desejado
        const query = 'DELETE FROM beneficiario WHERE id = ?';
        await db.query(query, [id]);
        
        res.json({ mensagem: 'Beneficiário excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir beneficiário:', err);
        res.status(500).json({ erro: 'Erro ao excluir beneficiário' });
    }
};
// Atualizar um beneficiário existente
exports.atualizarBeneficiario = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ erro: 'Erro ao carregar a imagem da residência.' });
        }

        try {
            const { id } = req.params;
            const { nome, documento, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
            
            const fotoResidencia = req.file ? req.file.filename : null;

            let query = '';
            let params = [];

            if (fotoResidencia) {
                // Se enviou uma nova foto, atualiza a coluna da foto também
                query = `
                    UPDATE beneficiario 
                    SET nome = ?, documento = ?, telefone = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, foto_residencia = ? 
                    WHERE id = ?
                `;
                params = [nome, documento, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, fotoResidencia, id];
            } else {
                // Se não enviou nova foto, mantém a foto anterior
                query = `
                    UPDATE beneficiario 
                    SET nome = ?, documento = ?, telefone = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ? 
                    WHERE id = ?
                `;
                params = [nome, documento, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, id];
            }

            await db.query(query, params);
            res.json({ mensagem: 'Beneficiário atualizado com sucesso!' });

        } catch (dbErr) {
            if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
                return res.status(400).json({ erro: 'Este documento já está a ser utilizado por outro beneficiário.' });
            }
            console.error('Erro ao atualizar beneficiário:', dbErr);
            res.status(500).json({ erro: 'Erro interno ao atualizar beneficiário' });
        }
    });
};