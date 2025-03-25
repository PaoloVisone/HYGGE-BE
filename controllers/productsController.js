const connection = require('../data/db');

function index(req, res) {
    connection.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
}


module.exports = {
    index
};