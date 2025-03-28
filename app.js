const express = require('express');
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT;

// Configura il trasportatore Nodemailer (ad esempio con un account Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use 'service' instead of 'host'
    secure: true,      // Use SSL/TLS
    auth: {
        user: 'albertoorlandowork@gmail.com',
        pass: process.env.DB_PASS_EMAIL
    }
});
// Test SMTP connection
transporter.verify(function (error, success) {
    if (error) {
        console.log('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});
const sendOrderConfirmationEmail = async (email, orderDetails) => {
    const mailOptions = {
        from: "albertoorlandowork@gmail.com", // Usa un'email valida
        to: email,
        subject: "Conferma del tuo ordine",
        text: `Grazie per il tuo ordine! Dettagli ordine: ${JSON.stringify(orderDetails)}`,
    };
    try {
        const info = await transporter.sendMail(mailOptions); // Usa `await`
        console.log("Email inviata con successo:", info.response);
        return info;
    } catch (err) {
        console.error("Errore durante l'invio dell'email:", err);
        throw err; // Propaga l'errore per una migliore gestione
    }
};
const errorsHandler = require('./middlewares/errorsHandler');
const notFound = require('./middlewares/notFound');
const productsRouter = require('./routers/products');
const imagePath = require('./middlewares/imagePath');
const cors = require('cors');
app.use(express.static('public'));
app.use(express.json());
app.use(imagePath);
app.use(cors({ origin: "http://localhost:5173" }));
app.get("/api", (req, res) => {
    res.send("API is running");
}
);
app.use('/api/products', productsRouter);
// Endpoint per confermare l'ordine
app.post("/api/confirm-order", (req, res) => {
    const { email, orderDetails } = req.body; // Recupera i dettagli dell'ordine
    // Invia l'email di conferma
    sendOrderConfirmationEmail(email, orderDetails)
        .then(() => {
            res.status(200).send("Email inviata con successo!");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Errore nell'invio dell'email.");
        });
});
app.use(notFound);
app.use(errorsHandler);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}
);






