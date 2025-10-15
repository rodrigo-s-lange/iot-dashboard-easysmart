// routes/entities.js
const express = require('express');
const router = express.Router();
const entityController = require('../controllers/entityController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * Rotas de Entidades
 */

// Listar entidades de um device
router.get('/devices/:deviceId/entities', entityController.getDeviceEntities);

// Criar nova entidade
router.post('/devices/:deviceId/entities', entityController.createEntity);

// Criar múltiplas entidades (bulk)
router.post('/devices/:deviceId/entities/bulk', entityController.createMultipleEntities);

// Atualizar valor de entidade (toggle, set value)
router.patch('/devices/:deviceId/entities/:entityId/value', entityController.updateEntityValue);

// Atualizar configuração de entidade
router.put('/entities/:entityId', entityController.updateEntity);

// Deletar entidade
router.delete('/entities/:entityId', entityController.deleteEntity);

module.exports = router;
