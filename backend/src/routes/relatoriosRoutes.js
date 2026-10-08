const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');

// Relatório Geral
router.get('/', relatoriosController.obterRelatorio);
router.get('/pdf', relatoriosController.exportarPDF);
router.get('/excel', relatoriosController.exportarExcel);

// Relatório por Beneficiário
router.get('/por-beneficiario', relatoriosController.relatorioPorBeneficiario);
router.get('/por-beneficiario/pdf', relatoriosController.exportarPDFBeneficiario);
router.get('/por-beneficiario/excel', relatoriosController.exportarExcelBeneficiario);

// Relatório por Caminhão
router.get('/por-caminhao', relatoriosController.relatorioPorCaminhao);
router.get('/por-caminhao/pdf', relatoriosController.exportarPDFCaminhao);
router.get('/por-caminhao/excel', relatoriosController.exportarExcelCaminhao);

// Estatísticas
router.get('/estatisticas', relatoriosController.obterEstatisticas);

module.exports = router;