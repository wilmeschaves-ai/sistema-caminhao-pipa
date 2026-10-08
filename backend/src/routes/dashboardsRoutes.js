const express = require('express');
const router = express.Router();
const dashboardsController = require('../controllers/dashboardsController');

router.get('/stats', dashboardsController.getEstatisticas);

module.exports = router;