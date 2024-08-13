const express = require('express');
const API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_URL = process.env.MONDAY_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model('User', userSchema);

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = decoded;
    next();
  });
}

router.post('/create-top', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid Username' });
    }

    // Compare Passwords
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid Password'});
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET);
    res.status(200).json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', e: error });
  }
});

router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/upload-file', verifyToken, (req, res) => {
  const url = `${MONDAY_URL}/file`;
  const query = 'mutation add_file($file: File!, $itemId: ID!) {add_file_to_column (item_id: $itemId, column_id:"files" file: $file) {id}}';
  const map = req.body.map;
  const variables = req.body.variables;
  const hasFile = req.files.length > 0;

  if (hasFile) {
    const originalName = req.files[0].originalname;
    var data = '';
    const boundary = 'xxxxxxxxxxxxxxx';

    data += "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=\"query\"; \r\n";
    data += "Content-Type:application/json\r\n\r\n";
    data += "\r\n" + query + "\r\n";

    // data += "--" + boundary + "\r\n";
    // data += "Content-Disposition: form-data; name=\"itemid\"; \r\n";
    // data += "Content-Type:application/json\r\n\r\n";
    // data += "\r\n" + itemid + "\r\n";
    
    // construct variables part
    data += "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=\"variables\"; \r\n";
    data += "Content-Type:application/json \r\n\r\n";
    data += "\r\n" + JSON.stringify(variables)  + "\r\n";

    // construct map part
    data += "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=\"map\"; \r\n";
    data += "Content-Type:application/json\r\n\r\n";
    data += "\r\n" + JSON.stringify(map)+ "\r\n";

    // construct file part - the name needs to be the same as passed in the map part of the request. So if your map is {"image":"variables.file"}, the name should be image.
    data += "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=\"image\"; filename=\"" + originalName + "\"\r\n";
    data += "Content-Type:application/octet-stream\r\n\r\n";

    const payload = Buffer.concat([
      Buffer.from(data, 'utf8'),
      // new Buffer.from(req.file, 'binary'),
      req.files[0].buffer,
      Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
    ]);

    const options = {
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Authorization': API_KEY,
      },
      body: payload,
    }

    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        console.log(json)
        if (json.data && json.data.add_file_to_column && json.data.add_file_to_column.id) {
          return res.status(200).send({
            ...json,
            fileName: originalName,
          });
        } else {
          return res.status(500).send({
            error: `Couldn\'t upload image ${originalName}`,
            fileName: originalName,
          });
        }
      })
      .catch(e => res.status(500).send(e));
  } else {
    return res.status(500).send({
      error: 'Please uplaod a file',
    });
  }
  // const image = __basedir + "/resources/temp/" + req.file.originalname;
  // console.log(image);
  // const originalName = req.file.originalname;

  // fs.readFile(image, async function(error, content) {
  //   if (error) {
  //     console.error(error);
  //     res.send(500).send(error);
  //   }

  //   console.log('Content', content);

  //   
  // });
});

module.exports = router;