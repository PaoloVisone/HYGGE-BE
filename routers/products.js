const express = require('express');
const { index, show, storeReview, showCategory, showSearchBar } = require('../controllers/productsController');
const router = express.Router();


router.get('/', index);
router.get('/:id', show);

router.get('/search', showSearchBar);

<<<<<<< HEAD

router.post('/:id/reviews', storeReview)
=======
router.get('/category/:id', showCategory);

router.post('/:id/reviews/create', storeReview)
>>>>>>> origin/HEAD

module.exports = router;