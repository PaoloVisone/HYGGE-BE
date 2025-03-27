const express = require('express');
const { index, show, storeReview, cameraDaLetto, bagno, salotto, salaDaPranzo, showSearchBar, giardino, garage } = require('../controllers/productsController');
const router = express.Router();


router.get('/search', showSearchBar);

router.get('/', index);
router.get('/:id', show);




router.get('/category/cameraDaLetto', cameraDaLetto);
router.get('/category/bagno', bagno);
router.get('/category/salotto', salotto);
router.get('/category/salaDaPranzo', salaDaPranzo);
router.get('/category/giardino', giardino);
router.get('/category/garage', garage);






router.post('/:id/reviews/create', storeReview)

module.exports = router;