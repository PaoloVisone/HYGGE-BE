const express = require('express');
const { index, show, storeReview, showCategory, showSearchBar } = require('../controllers/productsController');
const router = express.Router();


router.get('/', index);
router.get('/:id', show);

router.get('/search', showSearchBar);

router.get('/category/:id', showCategory);

router.post('/:id/reviews/create', storeReview)

module.exports = router;