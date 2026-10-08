const express = require('express');
const router = express.Router();
const beneficiarioController = require('../controllers/beneficiarioController');

// Rotas mapeadas para as funções do controlador
router.get('/', beneficiarioController.listarBeneficiarios);
router.post('/', beneficiarioController.criarBeneficiario);
router.put('/:id', beneficiarioController.atualizarBeneficiario); // Linha que gerava o erro se a função estivesse em falta
router.delete('/:id', beneficiarioController.deletarBeneficiario);

module.exports = router;