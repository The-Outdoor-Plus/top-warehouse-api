require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const routes = require('./routes/routes');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

const app = express();
const upload = multer();

global.__basedir = __dirname;

// Connect to MongoDB Database
mongoose.connect('mongodb://localhost:27017/top-warehouse-api')
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB: ', error);
});

app.use(cors());
app.use(express.json());
app.use(upload.any());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log("Server listening on PORT: ", PORT);
});

app.get('/', (req, res) => {
  res.send('TOP Warehouse API Up!');
});

// module.exports.handler = serverless(app);
