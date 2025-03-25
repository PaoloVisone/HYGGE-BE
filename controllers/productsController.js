// Importa la connessione al database dal file db.js
const connection = require('../data/db');

// Funzione per ottenere tutti i prodotti con le loro immagini
function index(req, res) {
    // Query SQL per ottenere tutti i prodotti dalla tabella "products"
    const mysqlProducts = 'SELECT * FROM products';

    // Query SQL per ottenere le immagini di un prodotto specifico dalla tabella "images"
    const mysqlProductsWithImages = 'SELECT * FROM images WHERE product_id = ?';

    // Esegue la query per ottenere tutti i prodotti
    connection.query(mysqlProducts, (err, results) => {
        if (err) {
            // Logga l'errore nel server e restituisce un errore 500 al client
            console.log(err);
            return res.status(500).send('Internal Server Error');
        }

        // Array per contenere i prodotti con le loro immagini
        const productsWithImages = [];
        let count = 0; // Contatore per tracciare il completamento delle query annidate

        // Itera su ogni prodotto ottenuto dalla query principale
        results.forEach(product => {
            // Esegue una query per ottenere le immagini del prodotto corrente
            connection.query(mysqlProductsWithImages, [product.id], (err, images) => {
                if (err) {
                    // Logga l'errore nel server e restituisce un errore 500 al client
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }

                // Aggiunge il prodotto con le sue immagini all'array `productsWithImages`
                productsWithImages.push({
                    ...product, // Copia tutti i campi del prodotto (ad esempio id, nome, prezzo, ecc.) utilizzando lo spread operator
                    images: images.map(image => req.imagePath + image.url_image), // Trasforma l'array di immagini: per ogni immagine, aggiunge il percorso base (req.imagePath) al nome del file immagine (image.url_image) per creare un URL completo
                });

                count++; // Incrementa il contatore per ogni query completata

                // Se tutte le query annidate sono completate, restituisce i dati al client
                if (count === results.length) {
                    res.json(productsWithImages); // Restituisce l'array di prodotti con immagini
                }
            });
        });
    });
}

// Funzione per ottenere un singolo prodotto con le sue recensioni
function show(req, res) {
    // Ottiene l'ID del prodotto dai parametri della richiesta
    const id = req.params.id;

    // Query SQL per ottenere il prodotto con l'ID specificato dalla tabella "products"
    const sql = 'SELECT * FROM products WHERE id = ?';

    // Query SQL per ottenere le recensioni del prodotto specificato dalla tabella "reviews"
    const reviewSql = "SELECT * FROM reviews WHERE product_id = ?";

    const imagesSql = "SELECT * FROM images WHERE product_id = ?";

    // Esegue la query per ottenere il prodotto
    connection.query(sql, [id], (err, results) => {
        if (err) {
            // Logga l'errore e restituisce un errore 500 se la query fallisce
            return res.status(500).json({ error: "Il database non risponde" });
        }
        if (results.length === 0) {
            // Restituisce un errore 404 se il prodotto non viene trovato
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        // Esegue la query per ottenere le recensioni del prodotto
        connection.query(reviewSql, [id], (err, reviews) => {
            if (err) {
                // Logga l'errore e restituisce un errore 500 se la query fallisce
                return res.status(500).json({ error: "Il database non risponde" });
            }

            connection.query(imagesSql, [id], (err, images) => {
                if (err) {
                    return res.status(500).json({ error: "Il database non risponde" });
                }

                // Aggiunge le recensioni al prodotto
                results[0].reviews = reviews;
                results[0].images = images.map(image => req.imagePath + image.url_image);

                // Restituisce il prodotto con le sue recensioni al client
                res.json(results[0]);
            });




        });
    });
}

// Funzione per salvare una nuova recensione
function storeReview(req, res) {
    const { id } = req.params;

    const { name, review, rating } = req.body;

    const newReviewSql = 'INSERT INTO reviews (name, review,rating,product_id) VALUES (?, ?, ?,?)';

    connection.query(newReviewSql, [name, review, rating, id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database query failed" })
        res.status(201)
        return res.json({ message: "Review added", id: results.insertId })
    })
}

// Esporta le funzioni per essere utilizzate in altre parti dell'applicazione
module.exports = {
    index, // Funzione per ottenere tutti i prodotti con immagini
    show, // Funzione per ottenere un singolo prodotto con recensioni
    storeReview // Funzione per salvare una nuova recensione
};