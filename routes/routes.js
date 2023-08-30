const express = require('express');
const fs = require('fs');
const API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_URL = process.env.MONDAY_URL;
const fetch = require('node-fetch');
const controller = require('../controller/file.controller');
const multer = require('multer');

const router = express.Router();

router.post('/upload-file', (req, res) => {
  const url = `${MONDAY_URL}/file`;

  const query = 'mutation add_file($file: File!, $itemId: Int!) {add_file_to_column (item_id: $itemId, column_id:"files" file: $file) {id}}';
  const map = req.body.map;
  const variables = req.body.variables;
  const hasFile = req.files.length > 0;
  console.log(variables);
  console.log(req.files[0]);

  console.log(hasFile);

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
          return res.status(200).send(json);
        } else {
          return res.status(500).send({
            error: `Couldn\'t upload image ${originalName}`,
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