const express = require('express'),
      router = express.Router(),
      db = require('../models')

//Import models

router.get('/', (req, res) => {
      res.render('index', {})
})

module.exports = router;
