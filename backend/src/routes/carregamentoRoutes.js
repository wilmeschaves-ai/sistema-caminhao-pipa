const express = require('express');
const router = express.Router();
const carregamentoController = require('../controllers/carregamentoController');

router.get('/', carregamentoController.listarCarregamentos);
router.post('/', carregamentoController.criarCarregamento);
router.delete('/:id', carregamentoController.deletarCarregamento);

module.exports = router;