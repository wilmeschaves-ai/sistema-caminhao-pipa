const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const usuarioController = require('../controllers/usuarioController');

// Configuração do Multer para upload de fotos de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Aponta para a pasta /frontend/uploads a partir de /backend/src/routes/
        cb(null, path.join(__dirname, '../../../frontend/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rotas de Autenticação
router.post('/login', usuarioController.login);

// Rotas de Gestão de Usuários (CRUD com suporte a upload de foto)
router.get('/usuarios', usuarioController.listarUsuarios);
router.post('/usuarios', upload.single('foto'), usuarioController.criarUsuario);
router.put('/usuarios/:id', upload.single('foto'), usuarioController.atualizarUsuario);
router.delete('/usuarios/:id', usuarioController.deletarUsuario);

module.exports = router;