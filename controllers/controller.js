const express = require('express'),
    exphbs = require("express-handlebars"),
    router = express.Router(),
    db = require('../models'),
    request = require('request'),
    aws = require('aws-sdk'),
    S3_BUCKET = process.env.S3_BUCKET;

aws.config.region = 'us-east-2';
// We will set heroku config variables in the command line when we host it
router.get('/sign-s3', (req, res) => {
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.end();
        }
        const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
        };
        console.log(returnData)
        res.write(JSON.stringify(returnData));
        res.end();
    });
});

// Render about page at home route
router.get('/', (req, res) => {
    res.render('about', {})
})

// Render index page when dashboard is visited
router.get('/dashboard', (req, res) => {
    res.render('index', {})
})

// Find all trips made by the current user and render them to trips partial
router.get('/user/trips/:authId', (req, res) => {
    db.User.findOne({ where: { AuthID: req.params.authId } }).then(user => {
        db.Trip.findAll({
            where: { UserId: user.id },
        }).then(trips => {
            res.render('partials/trips', { trips: trips, layout: false })
        })

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
        where: {
            AuthID: req.body.uid
        }
    }).then(user => {
        userId = user.id
        // create new trip
        db.Trip.create({
            UserId: userId,
            Title: req.body.title,
            Description: req.body.description,
            Private: req.body.private
        }).then(function (data) {
            res.render('partials/tripsummary', { trip: data, layout: false })
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
    if (req.body.venue && req.body.city) {
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
    else if (req.body.lat && req.body.long) {
        qs = {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            ll: req.body.lat + ',' + req.body.long,
            v: '20180323',
            limit: 1
        }
    }
    // Request foursquare api
    request({
        url: 'https://api.foursquare.com/v2/venues/search',
        method: 'GET',
        qs: qs
    }, function (err, resp, body) {
        if (err) {
            console.error(err);
        } else {
            // Parse api response
            var response = JSON.parse(body).response.venues[0];
            // Find trip specified by user
            db.Trip.findOne({
                where: {
                    Title: tripName,
                    // Get user id
                    UserId: 1
                }
            }).then(trip => {
                // Get id of selected trip
                let tripId = trip.dataValues.id
                // Find all check ins in this trip and order by descending
                db.Checkin.count({
                    where: {
                        TripId: tripId
                    }
                }).then(count => {
                    // Create a checkin with the next highest order number
                    db.Checkin.create({
                        Order: count + 1,
                        TripId: tripId,
                        Location: {
                            ApiID: response.id,
                            Name: response.name,
                            Lat: response.location.lat,
                            Lng: response.location.lng
                        }
                    }, {
                            include: [{
                                association: db.Checkin.belongsTo(db.Location)
                            }]
                        }).then(function (data) { res.json(data) })
                })
            })
        }
    })
})

router.post('/saveTrip', (req, res) => {
    db.SavedTrip.create({
        UserId: req.body.uid,
        TripId: req.body.trip
    }).then(function (data) { res.json(data) })
})

module.exports = router;
