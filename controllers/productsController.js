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
            // Se c'è un errore, stampa il messaggio di errore e invia una risposta di errore 500 (Internal Server Error)
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
                    // Se c'è un errore nella query delle immagini, stampa il messaggio di errore e invia una risposta di errore 500
                    console.error("Error fetching product images:", err);
                    return res.status(500).send('Internal Server Error');
                }

                // Aggiunge il prodotto e le sue immagini all'array `productsWithImages`
                productsWithImages.push({
                    ...product, // Spread operator per copiare tutte le proprietà del prodotto
                    // Mappa le immagini aggiungendo il percorso base (che potrebbe essere qualcosa come "http://example.com/images/")
                    images: images.map(image => req.imagePath + image.url_image)
                });

                // Incrementa il contatore delle query completate
                count++;

                // Se tutte le query sono completate (cioè quando il contatore è uguale alla lunghezza dell'array di prodotti)
                if (count === results.length) {
                    // Stampa un messaggio di successo nel log
                    console.log("Products with images fetched successfully");
                    // Invia la risposta JSON con i prodotti e le loro immagini
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
    console.log("Show function called with slug:", req.params.slug);

    const slug = req.params.slug; // Usa lo slug dai parametri della richiesta
    const sql = 'SELECT * FROM products WHERE slug = ?';
    const reviewSql = "SELECT * FROM reviews WHERE product_id = (SELECT id FROM products WHERE slug = ?)";
    const imagesSql = "SELECT * FROM images WHERE product_id = (SELECT id FROM products WHERE slug = ?)";

    connection.query(sql, [slug], (err, results) => {
        if (err) {
            console.error("Error fetching product:", err);
            return res.status(500).json({ error: "Il database non risponde" });
        }
        if (results.length === 0) {
            console.warn("Product not found for slug:", slug);
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        connection.query(reviewSql, [slug], (err, reviews) => {
            if (err) {
                console.error("Error fetching reviews:", err);
                return res.status(500).json({ error: "Il database non risponde" });
            }

            connection.query(imagesSql, [slug], (err, images) => {
                if (err) {
                    console.error("Error fetching images:", err);
                    return res.status(500).json({ error: "Il database non risponde" });
                }

                results[0].reviews = reviews;
                results[0].images = images.map(image => req.imagePath + image.url_image);
                console.log("Product fetched successfully with reviews and images");
                res.json(results[0]);
            });
        });
    });
}


// Funzione per ottenere tutte le categorie
function indexCategories(req, res) {
    // Query SQL per ottenere tutte le categorie dal database
    const sql = 'SELECT * FROM categories';

    // Esegue la query per ottenere tutte le categorie
    connection.query(sql, (err, results) => {
        // Gestione errori nella query delle categorie
        if (err) {
            // Se si verifica un errore nella query, stampa l'errore e invia una risposta di errore 500
            console.log(err);
            return res.status(500).json({ error: "Database query failed" });
        }

        // Restituisce le categorie al client in formato JSON
        res.json(results);
    });
}


// Funzione per ottenere i prodotti di una categoria specifica con le immagini associate
function showCategories(req, res) {
    const { id } = req.params; // Usa l'id della categoria
    const sql = `
        SELECT 
            products.id, 
            products.slug,
            products.name, 
            products.price, 
            products.description, 
            categories.name AS category_name,
            images.url_image 
        FROM products 
        JOIN categories ON categories.id = products.category_id 
        JOIN images ON products.id = images.product_id
        WHERE categories.id = ?;
    `;

    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Database query failed" });
        }

        const products = results.reduce((acc, row) => {
            const product = acc.find(p => p.id === row.id);
            if (product) {
                product.images.push(req.imagePath + row.url_image);
            } else {
                acc.push({
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    slug: row.slug,
                    description: row.description,
                    category_name: row.category_name,
                    images: [req.imagePath + row.url_image]
                });
            }
            return acc;
        }, []);

        res.json(products);
    });
}



// Funzione per le ricerche con ordinamento per prezzo
function showSearchBar(req, res) {
    // Estrae i parametri della query dalla richiesta
    const { name, category, sortPrice } = req.query; // sortPrice può essere 'asc' o 'desc'

    let searchConditions = [];  // Array per le condizioni di ricerca
    let queryParams = [];      // Array per i parametri della query
    let orderByClause = '';    // Clausola per l'ordinamento

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

    // Imposta l'ordinamento per prezzo se specificato
    if (sortPrice) {
        orderByClause = `ORDER BY products.price ${sortPrice === 'asc' ? 'ASC' : 'DESC'}`;
    }

    // Se non ci sono filtri di ricerca, usa una condizione sempre vera
    const whereClause = searchConditions.length > 0
        ? `WHERE ${searchConditions.join(' AND ')}`
        : '';

    // Costruisce la query SQL con ordinamento
    const sqlQuery = `
        SELECT DISTINCT
            products.id,  
            products.slug,
            products.name,  
            products.price,  
            products.description,  
            categories.name AS category_name,  
            images.url_image 
        FROM products
        LEFT JOIN images ON products.id = images.product_id 
        LEFT JOIN categories ON products.category_id = categories.id
        ${whereClause} 
        ${orderByClause}
    `;

    // Esegue la query
    connection.query(sqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca dei prodotti:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }

        // Raggruppa i risultati
        const products = results.reduce((acc, row) => {
            const product = acc.find(p => p.id === row.id);
            if (product) {
                if (row.url_image) {
                    product.images.push(req.imagePath + row.url_image);
                }
            } else {
                acc.push({
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    slug: row.slug,
                    description: row.description,
                    category_name: row.category_name,
                    images: row.url_image ? [req.imagePath + row.url_image] : []
                });
            }
            return acc;
        }, []);

        res.json(products);
    });
}

// Funzione per salvare una nuova recensione
function storeReview(req, res) {
    const { slug } = req.params; // Usa lo slug del prodotto
    const { name, review, rating } = req.body; // Estrae i dati della recensione

    // Query per ottenere l'id del prodotto tramite lo slug
    const getProductIdSql = 'SELECT id FROM products WHERE slug = ?';

    connection.query(getProductIdSql, [slug], (err, results) => {
        if (err) {
            console.error("Error fetching product ID:", err);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length === 0) {
            console.warn("Product not found for slug:", slug);
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        const productId = results[0].id; // Ottieni l'id del prodotto

        // Query per inserire la nuova recensione
        const newReviewSql = 'INSERT INTO reviews (name, review, rating, product_id) VALUES (?, ?, ?, ?)';

        connection.query(newReviewSql, [name, review, rating, productId], (err, results) => {
            if (err) {
                console.error("Error inserting review:", err);
                return res.status(500).json({ error: "Database query failed" });
            }

            res.status(201).json({ message: "Review added", id: results.insertId });
        });
    });
}


function storeOrder(req, res) {
    // Stampa un log con i dati ricevuti nella richiesta (utile per il debug)
    console.log("StoreOrder function called with data:", req.body);

    // Estrae i dati inviati nel corpo della richiesta (req.body) e li assegna a variabili locali
    const { name, total_price, surname, email, tax_id_code, address, phone_number } = req.body;

    // Stampa un log con i dati ricevuti per il debug, così puoi verificare se sono corretti
    console.log("Dati ricevuti:", req.body);

    // Crea una query SQL per inserire i dati dell'ordine nella tabella 'orders'.
    // Si omette il campo 'status' che, presumibilmente, non è necessario per questa inserzione.
    const query = `
                INSERT INTO orders (name, total_price, surname, email, tax_id_code, address, phone_number)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

    // Esegui la query SQL utilizzando i dati ricevuti nella richiesta.
    // Gli argomenti (?) nella query vengono sostituiti dai valori specificati nell'array dopo la query
    connection.query(query, [name, total_price, surname, email, tax_id_code, address, phone_number], (err, results) => {
        // Se c'è un errore durante l'esecuzione della query, stampa un messaggio di errore nel log
        // e restituisce una risposta HTTP 500 (errore server) con un messaggio generico di fallimento della query
        if (err) {
            console.error("Error inserting order:", err); // Log dettagliato dell'errore
            return res.status(500).json({ error: "Database query failed" });
        }

        // Se l'inserimento è andato a buon fine, stampa l'ID dell'ordine appena creato nel log
        // L'ID è accessibile tramite results.insertId, che è restituito dal database dopo un inserimento riuscito
        console.log("Order added successfully with ID:", results.insertId); // Log di successo

        // Restituisce una risposta HTTP 201 (Creato) con un messaggio di conferma e l'ID dell'ordine
        res.status(201).json({ message: "Order added", id: results.insertId });
    });
}


// Definisce una funzione che gestisce la richiesta di recupero delle email
function indexEmail(req, res) {
    // Definisce una query SQL per ottenere tutte le email dalla tabella "client_email"
    const sql = 'SELECT * FROM client_email';

    // Esegue la query SQL sulla connessione al database
    connection.query(sql, (err, results) => {
        // Se si verifica un errore durante l'esecuzione della query
        if (err) {
            // Logga l'errore nella console per il debug
            console.log(err);
            // Restituisce una risposta con errore 500 (Internal Server Error) al client
            return res.status(500).json({ error: "Database query failed" });
        }

        // Se la query è stata eseguita con successo, restituisce i risultati (le email) al client in formato JSON
        res.json(results);
    });
}


// funzione per il pop-up: gestisce l'inserimento di un'email e l'invio di un'email di benvenuto
function storeEmail(req, res) {
    // Estrae l'email dalla richiesta (req.body)
    const { email } = req.body;

    // Crea un trasportatore per inviare email tramite Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Usa il servizio Gmail per l'invio dell'email
        auth: {
            user: 'albertoorlandowork@gmail.com', // Sostituisci con il tuo indirizzo email
            pass: process.env.DB_PASS_EMAIL   // Usa la password dell'email salvata nelle variabili d'ambiente
        }
    });

    // Query per controllare se l'email esiste già nel database
    const checkEmailSql = 'SELECT * FROM client_email WHERE email = ?';

    // Esegue la query per verificare l'email
    connection.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            // Se si verifica un errore durante la query, logga l'errore e restituisce un errore al client
            console.error("Error checking email:", err);
            return res.status(500).json({ error: "Database query failed" });
        }

        // Se l'email è già presente nel database (results.length > 0), restituisce un conflitto
        if (results.length > 0) {
            // Configurazione per inviare un'email di benvenuto

            // Impostazioni per il contenuto dell'email
            const mailOptions = {
                from: 'albertoorlandowork@gmail.com', // Indirizzo email mittente
                to: email, // Destinatario dell'email (l'email fornita dall'utente)
                subject: "Bentornato in HYGGE!", // Oggetto dell'email, cambia se l'utente è già registrato
                text: `Bentornato nella famiglia HYGGE! 🌟

Grazie per il tuo continuo interesse! Siamo felici di averti ancora con noi.
Continuerai a ricevere tutte le nostre novità e offerte esclusive direttamente 
nella tua casella di posta.

A presto con nuove sorprese!
Il team HYGGE 🎁`  // Corpo dell'email, diverso a seconda se l'utente è nuovo o tornato
            };

            // Invia l'email
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    // Se si verifica un errore durante l'invio dell'email, logga l'errore e restituisce un errore al client
                    console.error("Error sending email:", err);
                    return res.status(500).json({ error: "Failed to send welcome email" });
                }

                // Se l'email è stata inviata con successo, logga la risposta e restituisce un successo al client
                console.log("Welcomeback email sent:", info.response);
                res.status(201).json({ message: "Email added and welcomeback email sent", id: insertResults.insertId });
            });
        }

        // Query per inserire la nuova email nel database (se non trovata)
        const insertEmailSql = 'INSERT INTO client_email (email) VALUES (?)';

        // Esegue la query per inserire l'email
        connection.query(insertEmailSql, [email], (err, insertResults) => {
            if (err) {
                // Se si verifica un errore durante l'inserimento, logga l'errore e restituisce un errore al client
                console.error("Error inserting email:", err);
                return res.status(500).json({ error: "Nuova mail Database query failed" });
            }

            // Configurazione per inviare un'email di benvenuto

            // Nuovo trasportatore per inviare l'email di benvenuto
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Usa il servizio Gmail per l'invio dell'email
                auth: {
                    user: 'albertoorlandowork@gmail.com', // Sostituisci con il tuo indirizzo email
                    pass: process.env.DB_PASS_EMAIL   // Usa la password dell'email salvata nelle variabili d'ambiente
                }
            });

            // Impostazioni per il contenuto dell'email
            const mailOptions = {
                from: 'albertoorlandowork@gmail.com', // Indirizzo email mittente
                to: email, // Destinatario dell'email (l'email fornita dall'utente)
                subject: "Benvenuto in HYGGE!", // Oggetto dell'email
                text: `Benvenuto nella famiglia HYGGE! 🌟

Grazie per esserti iscritto alla nostra newsletter! 
Siamo felici di averti con noi e, come regalo di benvenuto, abbiamo qualcosa di speciale per te.

Usa il codice: SALE10 
per ottenere uno sconto del 10% sul tuo prossimo acquisto!

Riceverai tutte le novità sui nostri prodotti e offerte esclusive.

A presto,
Il team HYGGE` // Corpo dell'email
            };

            // Invia l'email
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    // Se si verifica un errore durante l'invio dell'email, logga l'errore e restituisce un errore al client
                    console.error("Error sending email:", err);
                    return res.status(500).json({ error: "Failed to send welcome email" });
                }

                // Se l'email è stata inviata con successo, logga la risposta e restituisce un successo al client
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
