const express = require('express');
const { index, show, storeReview, showCategories, showSearchBar, indexCategories } = require('../controllers/productsController');
const router = express.Router();


router.get('/search', showSearchBar);

router.get('/', index);

router.get('/category', indexCategories);


router.get('/:id', show);

router.get('/category/:id', showCategories);

router.post('/:id/reviews/create', storeReview)

module.exports = router;