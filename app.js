require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const routes = require('./routes/routes');
const serverless = require('serverless-http');

const PORT = process.env.PORT || 3000;

const app = express();
const upload = multer();

global.__basedir = __dirname;

app.use(cors());
app.use(express.json());
app.use(upload.any());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log("Server listening on PORT: ", PORT);
});

// module.exports.handler = serverless(app);
