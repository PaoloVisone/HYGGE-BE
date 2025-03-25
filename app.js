const express = require('express');
const app = express();
const port = process.env.PORT;

const errorsHandler = require('./middlewares/errorsHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');

const productsRouter = require('./routes/products');

const imagePath = require('./middlewares/imagePath');

const cors = require('cors');
const e = require('express');

app.use(express.static('public'));
app.use(express.json());
app.use(imagePath);
app.use(cors());

app.get("/api", (req, res) => {
    res.send("API is running");
}
);

app.use('/api/products', productsRouter);

app.use(notFoundHandler);
app.use(errorsHandler);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}
);
