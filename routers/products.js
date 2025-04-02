// Importa il modulo Express per la gestione delle route
const express = require('express');

// Importa i controller necessari dal file productsController
const {
    index,           // Controller per visualizzare tutti i prodotti
    show,            // Controller per visualizzare un singolo prodotto
    storeReview,     // Controller per salvare una recensione
    showCategories,  // Controller per visualizzare prodotti per categoria
    showSearchBar,   // Controller per la ricerca dei prodotti
    indexCategories, // Controller per visualizzare tutte le categorie
    storeOrder,      // Controller per salvare un ordine
    storeEmail,      // Controller per salvare una email
    indexEmail       // Controller per visualizzare tutte le email
} = require('../controllers/productsController');

// Crea un nuovo router Express
const router = express.Router();

// Route per la ricerca dei prodotti
router.get('/search', showSearchBar);

// Route per ottenere tutti i prodotti
router.get('/', index);

// Route per ottenere tutte le categorie
router.get('/category', indexCategories);

// Route per salvare un nuovo ordine
router.post('/order', storeOrder)

// Route per ottenere tutte le email
router.get('/email', indexEmail)

// Route per salvare una nuova email
router.post('/email/create', storeEmail)

// Route per ottenere un prodotto specifico tramite ID
router.get('/:slug', show);

// Route per ottenere i prodotti di una categoria specifica
router.get('/category/:id', showCategories);

// Route per salvare una nuova recensione per un prodotto specifico
router.post('/:slug/reviews/create', storeReview)

// Esporta il router per essere utilizzato nell'applicazione principale
module.exports = router;