const mysql = require('mysql2');

const passwords = ["0175", "corso139", "fafa1234", "ApologizE1975!1"]; // Lista di password da provare
let connection;

const tryConnect = async (index = 0) => {
    if (index >= passwords.length) {
        console.error("❌ Nessuna password valida trovata!");
        return;
    }

    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: passwords[index], 
        database: process.env.DB_NAME
    });

    connection.connect((err) => {
        if (err) {
            console.warn(`⚠️ Tentativo fallito con password: ${passwords[index]}`);
            tryConnect(index + 1); // Prova la password successiva
        } else {
            console.log("✅ Connesso a MySQL con successo!");
        }
    });
};

tryConnect();

module.exports = connection;
