require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/routes');

const PORT = process.env.PORT || 3000;

const app = express();

global.__basedir = __dirname;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log("Server listening on PORT: ", PORT);
});
