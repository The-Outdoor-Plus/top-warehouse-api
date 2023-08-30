const uploadFile = require('../middleware/upload');

const upload = async (req, res, next) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: 'Please upload a file!' });
    }

    next();
  } catch (e) {
    if (e.code == 'LIMIT_FILE_SIZE') {
      return res.status(500).send({
        message: 'File size cannot be larger than 100MB',
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${JSON.stringify(req.body)}. ${e}`,
    });
  }
}

module.exports = {
  upload
}