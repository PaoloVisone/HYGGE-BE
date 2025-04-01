// Importa la connessione al database configurata nel file db.js
const connection = require('../data/db');
const nodemailer = require('nodemailer'); // Import nodemailer for sending emails

/**
 * GESTIONE PRODOTTI E IMMAGINI
 */

// Funzione per ottenere tutti i prodotti con le loro immagini associate
function index(req, res) {
    // Log per debug dell'esecuzione della funzione
    console.log("Index function called");

    // Query SQL per selezionare tutti i prodotti dal database
    const mysqlProducts = 'SELECT * FROM products';

    // Query SQL per ottenere le immagini associate a un prodotto specifico
    const mysqlProductsWithImages = 'SELECT * FROM images WHERE product_id = ?';

    // Esegue la query principale per ottenere tutti i prodotti
    connection.query(mysqlProducts, (err, results) => {
        // Gestione errori nella query principale
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).send('Internal Server Error');
        }

        // Array per memorizzare i prodotti con le loro immagini
        const productsWithImages = [];
        // Contatore per tenere traccia delle query completate
        let count = 0;

        // Itera su ogni prodotto per ottenere le sue immagini
        results.forEach(product => {
            // Query per ottenere le immagini del prodotto corrente
            connection.query(mysqlProductsWithImages, [product.id], (err, images) => {
                // Gestione errori nella query delle immagini
                if (err) {
                    console.error("Error fetching product images:", err);
                    return res.status(500).send('Internal Server Error');
                }

                // Aggiunge il prodotto e le sue immagini all'array
                productsWithImages.push({
                    ...product, // Spread operator per copiare tutte le proprietà del prodotto
                    // Mappa le immagini aggiungendo il percorso base
                    images: images.map(image => req.imagePath + image.url_image)
                });

                // Incrementa il contatore delle query completate
                count++;

                // Se tutte le query sono completate, invia la risposta
                if (count === results.length) {
                    console.log("Products with images fetched successfully");
                    res.json(productsWithImages);
                }
            });
        });
    });
}

/**
 * GESTIONE SINGOLO PRODOTTO
 */

// Funzione per ottenere un singolo prodotto con recensioni e immagini
function show(req, res) {
    // Log per debug con l'ID del prodotto richiesto
    console.log("Show function called with ID:", req.params.id);

    // Recupera l'ID del prodotto dai parametri della richiesta
    const id = req.params.id;

    // Query SQL per ottenere il prodotto specifico
    const sql = 'SELECT * FROM products WHERE id = ?';

    // Query SQL per ottenere le recensioni del prodotto
    const reviewSql = "SELECT * FROM reviews WHERE product_id = ?";

    // Query SQL per ottenere le immagini del prodotto
    const imagesSql = "SELECT * FROM images WHERE product_id = ?";

    // Esegue la query principale per ottenere il prodotto
    connection.query(sql, [id], (err, results) => {
        // Gestione errori nella query del prodotto
        if (err) {
            console.error("Error fetching product:", err);
            return res.status(500).json({ error: "Il database non risponde" });
        }

        // Se il prodotto non viene trovato
        if (results.length === 0) {
            console.warn("Product not found for ID:", id);
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        // Query per ottenere le recensioni
        connection.query(reviewSql, [id], (err, reviews) => {
            // Gestione errori nella query delle recensioni
            if (err) {
                console.error("Error fetching reviews:", err);
                return res.status(500).json({ error: "Il database non risponde" });
            }

            // Query per ottenere le immagini
            connection.query(imagesSql, [id], (err, images) => {
                // Gestione errori nella query delle immagini
                if (err) {
                    console.error("Error fetching images:", err);
                    return res.status(500).json({ error: "Il database non risponde" });
                }

                // Aggiunge recensioni e immagini al prodotto
                results[0].reviews = reviews;
                results[0].images = images.map(image => req.imagePath + image.url_image);

                // Log di successo
                console.log("Product fetched successfully with reviews and images");

                // Invia la risposta completa
                res.json(results[0]);
            });
        });
    });
}

function indexCategories(req, res) {
    // Query SQL per ottenere tutte le categorie
    const sql = 'SELECT * FROM categories';

    // Esegue la query per ottenere tutte le categorie
    connection.query(sql, (err, results) => {
        if (err) {
            // Logga l'errore e restituisce un errore 500 al client
            console.log(err);
            return res.status(500).json({ error: "Database query failed" });
        }

        // Restituisce le categorie al client
        res.json(results);
    });
}

function showCategories(req, res) {

    const { id } = req.params;

    // Query SQL per ottenere i prodotti con le categorie e le immagini associate
    const sql = `
        SELECT 
            products.id, 
            products.name, 
            products.price, 
            products.description, 
            categories.name AS category_name,
            images.url_image 
        FROM products 
        JOIN categories ON categories.id = products.category_id 
        JOIN images  ON products.id = images.product_id
        WHERE categories.id = ?;
    `;

    // Esegue la query per ottenere i prodotti della categoria specificata 
    connection.query(sql, [id], (err, results) => {
        if (err) {
            // Logga l'errore e restituisce un errore 500 al client
            console.log(err);
            return res.status(500).json({ error: "Database query failed" });
        }

        // Mappa i prodotti e raggruppa le immagini per prodotto
        const products = results.reduce((acc, row) => {
            const product = acc.find(p => p.id === row.id);
            if (product) {
                // Aggiunge l'immagine al prodotto esistente
                product.images.push(req.imagePath + row.url_image);
            } else {
                // Crea un nuovo prodotto con le immagini
                acc.push({
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    description: row.description,
                    category_name: row.category_name,
                    images: [req.imagePath + row.url_image]
                });
            }
            return acc;
        }, []);

        // Restituisce i prodotti con le immagini al client
        res.json(products);
    });
}



// funzione per le ricerche
function showSearchBar(req, res) {
    const { name, category, minPrice, maxPrice } = req.query; // Aggiungi i parametri per il prezzo

    let searchConditions = [];
    let queryParams = [];

    // Filtro per il nome del prodotto
    if (name) {
        searchConditions.push("LOWER(products.name) LIKE ?");
        queryParams.push(`%${name.toLowerCase()}%`);
    }

    // Filtro per la categoria
    if (category) {
        searchConditions.push("LOWER(categories.name) LIKE ?");
        queryParams.push(`%${category.toLowerCase()}%`);
    }

    // Filtro per il prezzo minimo
    if (minPrice) {
        searchConditions.push("products.price >= ?");
        queryParams.push(Number(minPrice));
    }

    // Filtro per il prezzo massimo
    if (maxPrice) {
        searchConditions.push("products.price <= ?");
        queryParams.push(Number(maxPrice));
    }

    // Verifica che ci sia almeno un termine di ricerca
    if (searchConditions.length === 0) {
        return res.status(400).json({ error: 'Nessun criterio di ricerca fornito' });
    }

    // Costruisce la query SQL
    const sqlQuery = `
        SELECT
            products.id,
            products.name,
            products.price,
            products.description,
            categories.name AS category_name,
            images.url_image
        FROM products
        LEFT JOIN images ON products.id = images.product_id
        LEFT JOIN categories ON products.category_id = categories.id
        WHERE ${searchConditions.join(' AND ')}
    `;

    // Esegue la query
    connection.query(sqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca dei prodotti:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }

        // Raggruppa i prodotti e le immagini
        const products = results.reduce((acc, row) => {
            const product = acc.find(p => p.id === row.id);
            if (product) {
                // Aggiunge l'immagine al prodotto esistente
                if (row.url_image) {
                    product.images.push(req.imagePath + row.url_image);
                }
            } else {
                // Crea un nuovo prodotto con le immagini
                acc.push({
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    description: row.description,
                    category_name: row.category_name,
                    images: row.url_image ? [req.imagePath + row.url_image] : []
                });
            }
            return acc;
        }, []);

        // Restituisce i prodotti filtrati
        res.json(products);
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

function storeOrder(req, res) {
    console.log("StoreOrder function called with data:", req.body); // Debug log
    const { name, total_price, surname, email, tax_id_code, address, phone_number } = req.body;

    // Debug: verifica i dati ricevuti
    console.log("Dati ricevuti:", req.body);

    // Query SQL per inserire un ordine (rimosso il campo `status`)
    const query = `
                INSERT INTO orders (name, total_price, surname, email, tax_id_code, address, phone_number)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

    connection.query(query, [name, total_price, surname, email, tax_id_code, address, phone_number], (err, results) => {
        if (err) {
            console.error("Error inserting order:", err); // Improved error log
            return res.status(500).json({ error: "Database query failed" });
        }
        console.log("Order added successfully with ID:", results.insertId); // Debug log
        res.status(201).json({ message: "Order added", id: results.insertId });
    });
}

function indexEmail(req, res) {
    // Query SQL per ottenere tutte le email
    const sql = 'SELECT * FROM client_email';

    // Esegue la query per ottenere tutte le email
    connection.query(sql, (err, results) => {
        if (err) {
            // Logga l'errore e restituisce un errore 500 al client
            console.log(err);
            return res.status(500).json({ error: "Database query failed" });
        }

        // Restituisce le email al client
        res.json(results);
    });
}

// funzione per il pop up
function storeEmail(req, res) {
    const { email } = req.body;

    // Query to check if the email already exists
    const checkEmailSql = 'SELECT * FROM client_email WHERE email = ?';

    connection.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).json({ error: "Database query failed" });
        }

        // If email already exists, return a conflict response
        if (results.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Query to insert the new email
        const insertEmailSql = 'INSERT INTO client_email (email) VALUES (?)';

        connection.query(insertEmailSql, [email], (err, insertResults) => {
            if (err) {
                console.error("Error inserting email:", err);
                return res.status(500).json({ error: "Database query failed" });
            }

            // Send a welcome email
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Use your email service provider
                auth: {
                    user: 'albertoorlandowork@gmail.com', // Replace with your email
                    pass: process.env.DB_PASS_EMAIL   // Replace with your email password
                }
            });

            const mailOptions = {
                from: 'albertoorlandowork@gmail.com', // Replace with your email
                to: email,
                subject: results.length > 0 ? "Bentornato in HYGGE!" : "Benvenuto in HYGGE!",
                text: results.length > 0 ? "Grazie per essere tornato! Sei già iscritto alla nostra newsletter."
                    : "Grazie per esserti iscritto alla nostra newsletter! Riceverai tutte le novità sui nostri prodotti."
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error("Error sending email:", err);
                    return res.status(500).json({ error: "Failed to send welcome email" });
                }

                console.log("Welcome email sent:", info.response);
                res.status(201).json({ message: "Email added and welcome email sent", id: insertResults.insertId });
            });
        });
    });
}

// Esporta le funzioni per l'uso in altre parti dell'applicazione
module.exports = {
    index,           // Gestisce la visualizzazione di tutti i prodotti
    show,            // Gestisce la visualizzazione di un singolo prodotto
    storeReview,     // Gestisce il salvataggio di una nuova recensione
    showSearchBar,   // Gestisce la ricerca dei prodotti
    showCategories,  // Gestisce la visualizzazione dei prodotti per categoria
    indexCategories, // Gestisce la lista delle categorie
    storeOrder,      // Gestisce il salvataggio di un nuovo ordine
    storeEmail,      // Gestisce il salvataggio di una email per newsletter
    indexEmail       // Gestisce la lista delle email salvate
};
