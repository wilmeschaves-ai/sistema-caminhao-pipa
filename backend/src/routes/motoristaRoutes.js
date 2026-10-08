const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/motoristaController');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para guardar as imagens na pasta /frontend/uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ajuste os pontos '../' conforme a profundidade da pasta de rotas até chegar ao frontend/uploads
        cb(null, path.join(__dirname, '../../../frontend/uploads')); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'motorista-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', motoristaController.listarMotoristas);
// Adicionámos o 'upload.single('foto')' para intercetar o campo 'foto' enviado pelo formulário
router.post('/', upload.single('foto'), motoristaController.criarMotorista);
router.put('/:id', upload.single('foto'), motoristaController.atualizarMotorista);
router.delete('/:id', motoristaController.deletarMotorista);

module.exports = router;