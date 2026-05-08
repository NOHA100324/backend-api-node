const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.verifyToken);

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);

module.exports = router;
