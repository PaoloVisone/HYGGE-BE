// Importa i moduli di base necessari per l'applicazione
const express = require('express');          // Framework web Express per Node.js
const nodemailer = require("nodemailer");    // Modulo per gestire l'invio di email
const bodyParser = require("body-parser");   // Middleware per parsare il corpo delle richieste HTTP

// Crea una nuova istanza dell'applicazione Express
const app = express();

// Recupera la porta del server dalle variabili d'ambiente
const port = process.env.PORT;

// Configura il servizio di posta elettronica usando Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',     // Specifica il servizio email da utilizzare
    secure: true,         // Attiva la connessione sicura SSL/TLS
    auth: {
        user: 'albertoorlandowork@gmail.com',    // Indirizzo email del mittente
        pass: process.env.DB_PASS_EMAIL          // Password dell'email dalle variabili d'ambiente
    }
});

// Verifica la connessione al server SMTP di Gmail
transporter.verify(function (error, success) {
    if (error) {
        console.log('Errore di connessione SMTP:', error);
    } else {
        console.log('Server SMTP pronto per inviare email');
    }
});

// Funzione asincrona per inviare l'email di conferma dell'ordine
const sendOrderConfirmationEmail = async (email, orderDetails) => {
    try {
        // Crea il riepilogo dell'ordine formattando ogni prodotto
        const orderSummary = orderDetails.products.map((product, index) => {
            return `${index + 1}. ${product.name} - Quantità: ${product.quantity} - Prezzo: €${product.price.toFixed(2)}`;
        }).join('\n');

        // Recupera il prezzo totale dai dettagli dell'ordine
        const totalCost = orderDetails.total_price;

        // Configura i dettagli dell'email da inviare
        const mailOptions = {
            from: "albertoorlandowork@gmail.com",    // Mittente dell'email
            to: email,                               // Destinatario dell'email
            subject: "Conferma del suo ordine HYGGE", // Oggetto dell'email
            text: `Gentile Cliente,

La ringraziamo per aver scelto HYGGE. 
Siamo lieti di confermarle che abbiamo ricevuto correttamente il suo ordine.

RIEPILOGO ORDINE:
${orderSummary}

TOTALE: €${totalCost.toFixed(2)}

Il suo ordine è stato preso in carico e verrà elaborato con la massima cura dal nostro team.

ASSISTENZA DEDICATA:
Per qualsiasi informazione relativa al suo ordine, può contattarci all'indirizzo:
helphygge@gmail.com

La ringraziamo per la fiducia accordataci.

Cordiali saluti,
Il Team HYGGE`
        };

        // Invia l'email usando il trasportatore configurato
        const info = await transporter.sendMail(mailOptions);
        console.log("Email di conferma ordine inviata:", info.response);
        return info;
    } catch (err) {
        // Registra i dettagli dell'errore se l'invio fallisce
        console.error("Dettagli errore:", {
            message: err.message,
            stack: err.stack,
            code: err.code
        });
        throw err;
    }
};

// Importa i middleware necessari per l'applicazione
const errorsHandler = require('./middlewares/errorsHandler');    // Gestisce gli errori globali
const notFound = require('./middlewares/notFound');             // Gestisce le route non trovate
const products = require('./routers/products');                 // Router per i prodotti
const imagePath = require('./middlewares/imagePath');           // Gestisce i percorsi delle immagini
const cors = require('cors');                                   // Gestisce le richieste cross-origin

// Configura i middleware globali dell'applicazione
app.use(express.static('public'));                             // Serve i file statici
app.use(express.json());                                       // Parsa le richieste JSON
app.use(imagePath);                                           // Aggiunge i percorsi delle immagini
app.use(cors({ origin: "http://localhost:5173" }));           // Configura CORS per il frontend

// Route di test per verificare che l'API sia attiva
app.get("/api", (req, res) => {
    res.send("API is running");
});

// Registra il router dei prodotti
app.use('/api/products', products);

// Endpoint per gestire la conferma degli ordini
app.post("/api/confirm-order", async (req, res) => {
    try {
        // Estrae email e dettagli ordine dalla richiesta
        const { email, orderDetails } = req.body;

        // Valida il formato dell'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                error: "Formato email non valido",
                example: "example@email.com"
            });
        }

        // Logga i dati ricevuti per debug
        console.log("Dati ordine ricevuti:", {
            email,
            orderDetails: JSON.stringify(orderDetails, null, 2)
        });

        // Valida i dati dell'ordine
        if (!email || !orderDetails || !orderDetails.products || !orderDetails.total_price) {
            console.log("Validazione fallita:", { email, orderDetails });
            return res.status(400).json({
                error: "Dati dell'ordine non validi",
                required: {
                    email: "string",
                    orderDetails: {
                        products: [
                            {
                                name: "string",
                                quantity: "number",
                                price: "number"
                            }
                        ],
                        total_price: "number"
                    }
                }
            });
        }

        // Invia l'email di conferma
        await sendOrderConfirmationEmail(email, orderDetails);

        // Invia la risposta di successo
        res.status(200).json({
            message: "Email di conferma inviata con successo!",
            orderSummary: {
                email,
                totalAmount: orderDetails.total_price,
                productsCount: orderDetails.products.length
            }
        });

    } catch (error) {
        // Gestisce e logga eventuali errori
        console.error("Errore completo:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            error: "Errore nell'invio dell'email di conferma.",
            details: error.message
        });
    }
});

// Middleware per gestire le route non trovate
app.use(notFound);

// Middleware per la gestione degli errori
app.use(errorsHandler);

// Avvia il server sulla porta specificata
app.listen(port, () => {
    console.log(`Server in esecuzione su http://localhost:${port}`);
});






