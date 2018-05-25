const express = require("express"),
      router = express.Router();

//Import models

router.get('/', (req, res) => {
      res.render('index', {})
})

module.exports = router;
