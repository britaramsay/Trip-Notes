const express = require('express'),
      router = express.Router(),
      db = require('../models'),
      request = require('request')

// Render about page at home route
router.get('/', (req, res) => {
    res.render('about', {})
})

// Render index page when dashboard is visited
router.get('/dashboard', (req, res) => {
      res.render('index', {})
})

// Find all trips made by the current user and render them to trips partial
router.get('/user/trips/:id', (req, res) => {
      console.log(req.params.id)
      db.Trip.findAll({
            where: {
                  UserId: req.params.id
            }
      }).then(trips => {
            console.log(trips)
            var hbsObject = {
                  trips: trips
            }
            res.render('partials/trips', {trips: trips, layout: false})
      })
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

// Find user id of the current user and create a new trip
router.post('/newtrip', (req, res) => {
      var userId;
      // Find id of user with the requested authId
      db.User.findOne({
            where: {AuthID: req.body.uid}
      }).then(user => {
            userId = user.id
            // create new trip
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
      var tripName = 'Disney'
      // Change to req.body.tripName later, create a trip called Disney for testing

      // Define foursquare query search
      var qs;
      // If user searched a location
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
      // If user used geolocation to check in
      else if(req.body.lat && req.body.long) {
            qs = {
                  client_id: process.env.CLIENT_ID,
                  client_secret: process.env.CLIENT_SECRET,
                  ll: req.body.lat+','+req.body.long,
                  v: '20180323',
                  limit: 1
            } 
      }
      // Request foursquare api
      request({
            url: 'https://api.foursquare.com/v2/venues/search',
            method: 'GET',
            qs: qs
      }, function(err, res, body) {
            if (err) {
                  console.error(err);
            } else {
                  // Parse api response
                  var response = JSON.parse(body).response.venues[0];
                  console.log(response)
                  // Create new location
                  db.Location.create({
                        ApiID: response.id,
                        Name: response.name,
                        Lat: response.location.lat,
                        Lng: response.location.lng
                  }).then (location => {
                        // Get id of new location
                        var locationId = location.dataValues.id
                        console.log(locationId)
                        // Find trip made by user with the name passed in from user
                        db.Trip.findOne({
                              where: {
                                    Title: tripName,
                                    // Get user id
                                    UserId: 1
                              }
                        }).then(trip => {
                              // Get id of selected trip
                              let tripId = trip.dataValues.id
                              console.log(trip.dataValues.id, locationId)
                              // Find all check ins in this trip and order by descending
                              db.Checkin.findAll({
                                    order: [['Order', "DESC"]],
                                    where: {
                                          TripId: tripId
                                    }
                              }).then(data => {
                                    var maxOrder;
                                    // If there are no checkins, set max order to 0
                                    if(data.length == 0) maxOrder = 0;
                                    // Otherwise set to Order value of first checkin in response (latest checkin)
                                    else maxOrder = data[0].dataValues.Order
                                    // Create a checkin with the next highest order number
                                    db.Checkin.create({
                                          Order: maxOrder + 1,
                                          TripId: tripId,
                                          LocationId: locationId
                                    })
                              })
                        })
                  })
            }
      });
})

module.exports = router;
