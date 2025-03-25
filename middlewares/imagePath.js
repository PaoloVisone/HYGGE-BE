// Funzione middleware per impostare il percorso delle immagini
function setImagePath(req, res, next) {
    // Crea il percorso dell'immagine utilizzando il protocollo e l'host della richiesta
    req.imagePath = `${req.protocol}://${req.get("host")}/img/`;
    // Passa al middleware successivo
    next();
}


// Esporta la funzione in modo che possa essere utilizzata in altre parti dell'applicazione
module.exports = setImagePath;