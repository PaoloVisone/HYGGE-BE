// Importa i moduli necessari
const express = require('express');          // Framework web
const nodemailer = require("nodemailer");    // Modulo per l'invio di email
const bodyParser = require("body-parser");   // Parser per il corpo delle richieste

// Crea l'applicazione Express
const app = express();

// Definisce la porta del server dalle variabili d'ambiente
const port = process.env.PORT;

// Configura il trasportatore Nodemailer per Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',     // Usa il servizio Gmail
    secure: true,         // Abilita SSL/TLS per una connessione sicura
    auth: {
        user: 'albertoorlandowork@gmail.com',    // Email mittente
        pass: process.env.DB_PASS_EMAIL          // Password da variabili d'ambiente
    }
});

// Verifica la connessione al server SMTP
transporter.verify(function (error, success) {
    if (error) {
        console.log('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

// Funzione asincrona per inviare email di conferma ordine
const sendOrderConfirmationEmail = async (email, orderDetails) => {
    // Configura le opzioni dell'email
    const mailOptions = {
        from: "albertoorlandowork@gmail.com",    // Mittente
        to: email,                               // Destinatario
        subject: "Conferma del tuo ordine",      // Oggetto
        text: `Grazie per il tuo ordine! CODICE ordine: ${JSON.stringify(orderDetails)}`, // Corpo
    };

    try {
        // Tenta di inviare l'email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email inviata con successo:", info.response);
        return info;
    } catch (err) {
        console.error("Errore durante l'invio dell'email:", err);
        throw err;
    }
};

// Importa i middleware e i router necessari
const errorsHandler = require('./middlewares/errorsHandler');    // Gestore errori
const notFound = require('./middlewares/notFound');             // Gestore 404
const productsRouter = require('./routers/products');           // Router prodotti
const imagePath = require('./middlewares/imagePath');           // Middleware percorso immagini
const cors = require('cors');                                   // Middleware CORS

// Configura i middleware globali
app.use(express.static('public'));                             // Serve file statici
app.use(express.json());                                       // Parse JSON bodies
app.use(imagePath);                                           // Gestione percorsi immagini
app.use(cors({ origin: "http://localhost:5173" }));           // Configura CORS

// Endpoint di test per verificare che l'API sia attiva
app.get("/api", (req, res) => {
    res.send("API is running");
});

// Monta il router dei prodotti
app.use('/api/products', productsRouter);

// Endpoint per la conferma dell'ordine
app.post("/api/confirm-order", (req, res) => {
    // Estrae email e dettagli ordine dal corpo della richiesta
    const { email, orderDetails } = req.body;

    // Invia l'email di conferma
    sendOrderConfirmationEmail(email, orderDetails)
        .then(() => {
            // Risponde con successo
            res.status(200).json({ message: "Email inviata con successo!" });
        })
        .catch((error) => {
            // Gestisce eventuali errori
            console.error(error);
            res.status(500).json({ error: "Errore nell'invio dell'email." });
        });
});

// Middleware per gestire le route non trovate (404)
app.use(notFound);

// Middleware per la gestione degli errori
app.use(errorsHandler);

// Avvia il server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});






