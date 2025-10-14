const express = require('express');
const DeviceController = require('../controllers/deviceController');
const authenticate = require('../middleware/authMiddleware');
const { checkDeviceLimit } = require('../middleware/checkPlanLimits');

const router = express.Router();

// Todas rotas requerem autenticação
router.use(authenticate);

router.get('/', DeviceController.list);
router.post('/', checkDeviceLimit, DeviceController.create);
router.get('/:id', DeviceController.getOne);
router.put('/:id', DeviceController.update);
router.delete('/:id', DeviceController.delete);

module.exports = router;
