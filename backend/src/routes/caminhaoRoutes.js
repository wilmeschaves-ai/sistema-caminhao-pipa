const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const caminhaoController = require('../controllers/caminhaoController');

// Configuração do Multer para armazenamento das fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../frontend/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Rotas
router.get('/', caminhaoController.listarCaminhoes);
router.post('/', upload.single('foto'), caminhaoController.criarCaminhao);
router.put('/:id', upload.single('foto'), caminhaoController.atualizarCaminhao); // <--- Nova rota de atualização
router.delete('/:id', caminhaoController.deletarCaminhao);

module.exports = router;