const express = require('express');
const { index } = require('../controllers/productsController');
const router = express.Router();


router.get('/', index);


module.exports = router;