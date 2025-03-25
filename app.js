const express = require('express');
const app = express();
const port = process.env.PORT;

const errorsHandler = require('./middlewares/errorsHandler');
const notFound = require('./middlewares/notFound');

const productsRouter = require('./routers/products');

const imagePath = require('./middlewares/imagePath');


const cors = require('cors');

app.use(express.static('public'));
app.use(express.json());
app.use(imagePath);

app.use(cors());

app.get("/api", (req, res) => {
    res.send("API is running");
}
);

app.use('/api/products', productsRouter);

app.use(notFound);
app.use(errorsHandler);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}
);
