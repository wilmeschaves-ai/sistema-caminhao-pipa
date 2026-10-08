const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const usuarioController = require('../controllers/usuarioController');

// Configuração do armazenamento do Multer (salvando diretamente na pasta frontend/uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../frontend/uploads')); // Ajuste conforme o caminho relativo da sua pasta uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rotas
router.post('/login', usuarioController.login);
router.get('/usuarios', usuarioController.listarUsuarios);
router.post('/usuarios', upload.single('foto'), usuarioController.criarUsuario);
router.put('/usuarios/:id', upload.single('foto'), usuarioController.atualizarUsuario);
router.delete('/usuarios/:id', usuarioController.deletarUsuario);

module.exports = router;