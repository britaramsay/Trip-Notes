const express = require('express'),
      router = express.Router(),
      db = require('../models'),
      request = require('request')

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

router.post('/newtrip', (req, res) => {
      var userId;
      db.User.findOne({
            where: {AuthID: req.body.uid}
      }).then(user => {
            userId = user.id
            db.Trip.create({
                  UserId: userId,
                  Title: req.body.title,
                  Description: req.body.description,
                  Private: req.body.private
      
            }).then(function () {
                  // res.json(dbPost)
            })
      })
      
})

// Posts user's current location or venue searched for 
router.post('/checkin', (req, res) => {
      var qs;
      if(req.body.venue && req.body.city) {
            qs = {
                  client_id: process.env.CLIENT_ID,
                  client_secret: process.env.CLIENT_SECRET,
                  query: req.body.venue,
                  near: req.body.city,
                  v: '20180323',
                  limit: 1
            }
      }
      else if(req.body.lat && req.body.long) {
            qs = {
                  client_id: process.env.CLIENT_ID,
                  client_secret: process.env.CLIENT_SECRET,
                  ll: req.body.lat+','+req.body.long,
                  v: '20180323',
                  limit: 1
            } 
      }
      request({
            url: 'https://api.foursquare.com/v2/venues/search',
            method: 'GET',
            qs: qs
      }, function(err, res, body) {
            if (err) {
                  console.error(err);
            } else {
                  var response = JSON.parse(body).response.venues[0];
                  console.log(response)

                  db.Location.create({
                        ApiID: response.id,
                        Name: response.name,
                        Lat: response.location.lat,
                        Lng: response.location.lng
                  }).then(function(){

                  })
            }
      });
})

module.exports = router;
