// Importa la connessione al database dal file db.js
const connection = require('../data/db');

// Funzione per ottenere tutti i prodotti con le loro immagini
function index(req, res) {

    // Query SQL per ottenere tutti i prodotti
    const mysqlProducts = 'SELECT * FROM products';

    // Query SQL per ottenere le immagini di un prodotto specifico
    const mysqlProductsWithImages = 'SELECT * FROM images WHERE product_id = ?';

    // Esegue la query per ottenere tutti i prodotti
    connection.query(mysqlProducts, (err, results) => {
        if (err) {
            // Logga l'errore e restituisce un errore 500 al client
            console.log(err);
            res.status(500).send('Internal Server Error');
        }

        // Array per contenere i prodotti con le loro immagini
        const productsWithImages = [];
        let count = 0; // Contatore per tracciare il completamento delle query annidate

        // Itera su ogni prodotto ottenuto dalla query
        results.forEach(product => {
            // Esegue una query per ottenere le immagini del prodotto corrente
            connection.query(mysqlProductsWithImages, [product.id], (err, images) => {
                if (err) {
                    // Logga l'errore e restituisce un errore 500 al client
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                }

                // Aggiunge il prodotto con le sue immagini all'array
                productsWithImages.push({
                    ...product, // Copia i dati del prodotto
                    images: images.map(image => req.imagePath + image.url_image), // Aggiunge il percorso completo delle immagini
                });

                count++; // Incrementa il contatore

                // Se tutte le query annidate sono completate, restituisce i dati al client
                if (count === results.length) {
                    res.json(productsWithImages);
                }
            });
        });
    });
}

// Funzione per ottenere un singolo prodotto con le sue recensioni
function show(req, res) {
    // Ottiene l'ID del prodotto dai parametri della richiesta
    const id = req.params.id;

    // Query SQL per ottenere il prodotto con l'ID specificato
    const sql = 'SELECT * FROM products WHERE id = ?';

    // Query SQL per ottenere le recensioni del prodotto specificato
    const reviewSql = "SELECT * FROM reviews WHERE product_id = ?";

    // Query SQL per ottenere le immagini del prodotto specificato
    const imagesSql = "SELECT url_image FROM images WHERE product_id = ?";

    // Esegue la query per ottenere il prodotto
    connection.query(sql, [id], (err, results) => {
        if (err) {
            // Restituisce un errore 500 se la query fallisce
            return res.status(500).json({ error: "Il database non risponde" });
        }
        if (results.length === 0) {
            // Restituisce un errore 404 se il prodotto non viene trovato
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        // Esegue la query per ottenere le recensioni del prodotto
        connection.query(reviewSql, [id], (err, reviews) => {
            if (err) {
                // Restituisce un errore 500 se la query fallisce
                return res.status(500).json({ error: "Il database non risponde" });
            }

            // Esegue la query per ottenere le immagini del prodotto
            connection.query(imagesSql, [id], (err, images) => {
                if (err) {
                    // Restituisce un errore 500 se la query fallisce
                    return res.status(500).json({ error: "Il database non risponde" });
                }

                // Aggiunge le recensioni e le immagini al prodotto
                results[0].reviews = reviews;
                results[0].images = images.map(image => req.imagePath + image.url_image); // Crea i percorsi completi

                // Restituisce il prodotto con le sue recensioni e immagini al client
                res.json(results[0]);
            });
        });
    });
}

// Esporta le funzioni per essere utilizzate in altre parti dell'applicazione
module.exports = {
    index,
    show
};