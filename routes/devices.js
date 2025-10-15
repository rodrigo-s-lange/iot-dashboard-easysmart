// routes/devices.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * Rotas de Devices
 */

// Listar templates disponíveis
router.get('/templates', deviceController.getTemplates);

// Listar devices do usuário
router.get('/', deviceController.getDevices);

// Criar novo device
router.post('/', deviceController.createDevice);

// Obter device específico (com entidades)
router.get('/:id', deviceController.getDevice);

// Atualizar device
router.put('/:id', deviceController.updateDevice);

// Deletar device
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
