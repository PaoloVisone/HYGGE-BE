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

function show(req, res) {
    const id = req.params.id;
    const sql = 'SELECT * FROM products WHERE id = ?';

    const reviewSql = "SELECT * FROM reviews WHERE product_id = ?";

    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Il database non risponde" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Film non trovato" });
        }

        connection.query(reviewSql, [id], (err, reviews) => {
            if (err) {
                return res.status(500).json({ error: "Il database non risponde" });
            }
            results[0].reviews = reviews
            res.json(results[0]);
        }
        )

    });


}


module.exports = {
    index,
    show
};