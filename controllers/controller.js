const express = require('express'),
    router = express.Router(),
    db = require('../models')

router.get('/', (req, res) => {
    res.render('about', {})
})

router.get('/dashboard', (req, res) => {
      res.render('index', {})
})

// finds or creates user associated with Google Firebase's auth ID
router.get('/user/:uid', (req, res) => {
    db.User.findOrCreate({
        where: {
            AuthID: req.params.uid
        }
    }).spread((user, created) => {
        let foundUser = user.get({ plain: true })
        foundUser.isNew = created
        res.json(foundUser)
    })
})

module.exports = router;
