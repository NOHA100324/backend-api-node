const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/items.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Todas las rutas de items requieren autenticación
router.use(verifyToken);

router.get('/', itemsController.getAll);
router.get('/:id', itemsController.getById);
router.post('/', itemsController.create);
router.put('/:id', itemsController.update);
router.delete('/:id', itemsController.delete);

module.exports = router;
