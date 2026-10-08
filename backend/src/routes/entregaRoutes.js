const express = require('express');
const router = express.Router();
const entregaController = require('../controllers/entregaController');

router.get('/', entregaController.listarEntregas);
router.post('/', entregaController.criarEntrega);
router.delete('/:id', entregaController.deletarEntrega);

module.exports = router;