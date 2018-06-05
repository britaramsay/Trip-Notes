const express = require('express'),
    exphbs = require('express-handlebars'),
    router = express.Router(),
    db = require('../models'),
    request = require('request'),
    aws = require('aws-sdk'),
    S3_BUCKET = process.env.S3_BUCKET,
    Cryptr = require('cryptr'),
    cryptr = new Cryptr(process.env.CRYPTR_KEY);

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
        // Same image in folder based on user, or checkin/trip?
        Key: cryptr.encrypt(req.cookies.userId)+'/'+fileName,
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
            url: `https://s3.us-east-2.amazonaws.com/${S3_BUCKET}/${cryptr.encrypt(req.cookies.userId)}/${fileName}`
        };
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
router.get('/user/trips', (req, res) => {
    db.Trip.findAll({
        where: { UserId: req.cookies.userId },
    }).then(trips => {
        res.render('partials/trips', { trips: trips.map(trip => { trip.tripLink = cryptr.encrypt(req.cookies.userId + '_' + trip.id); return trip }), layout: false })
    })
})

// Find a trip based off of the encrypted key (user.id_trip.id)
router.get('/trip/:key', (req, res) => {
    console.log('hello', req.params.key)

    let decryptedTrip = cryptr.decrypt(req.params.key).split('_').pop()
    db.Trip.findOne({
        where: { id: decryptedTrip }
    }).then(trip => {
        trip.key = req.params.key

        db.Checkin.findAll({
            where: { TripId: decryptedTrip },
            include: [db.Location, db.Note]
        }).then(checkins => {
            res.render('trip', { trip: trip, checkins: checkins.map(checkin => { checkin.checkinKey = cryptr.encrypt(req.cookies.userId + '_' + checkin.id); return checkin; }) })
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

        res.cookie('userId', user.id, { maxAge: 900000 });

        res.json(foundUser)
    })
})

// Find user id of the current user and create a new trip
router.post('/newtrip', (req, res) => {
    db.Trip.create({
        UserId: req.cookies.userId,
        Title: req.body.title,
        Description: req.body.description,
        Private: req.body.private
    }).then(trip => {
        trip.tripLink = cryptr.encrypt(req.cookies.userId + '_' + trip.id)

        req.app.render('partials/tripsummary', { trip: trip, layout: false }, (err, html) => {
            if (err) {
                res.status(500).end()
            }
            else {
                res.json({ html: html, name: trip.Title })
            }
        })

    })
})

router.post('/newImage', (req, res) => {
    let checkin = cryptr.decrypt(req.body.checkin).split('_').pop()

    db.Photo.count({ where: {CheckinId: checkin }
    }).then(count => {
        db.Photo.create({
            URL: req.body.url,
            Order: count + 1,
            CheckinId: checkin,
        })
    })
})

// Posts user's current location or venue searched for 
router.post('/checkin', (req, res) => {
    let tripId = cryptr.decrypt(req.body.trip).split('_').pop()

    // Define foursquare query search
    let qs;
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
    }, (err, resp, body) => {
        if (err) {
            console.error(err);
        } else {
            console.log(body)
            // Parse api response
            var response = JSON.parse(body).response.venues[0];
            db.Checkin.count({
                where: {
                    TripId: tripId
                }
            }).then(count => {
                // Create a checkin with the next highest order number
                db.Location.findOrCreate({
                    where: {
                        ApiID: response.id
                    },
                    defaults: {
                        Name: response.name,
                        Lat: response.location.lat,
                        Lng: response.location.lng
                    }
                }).spread((location, created) => {
                    db.Checkin.create(
                        {
                            Order: count + 1,
                            TripId: tripId,
                            LocationId: location.id
                        }
                    ).then(checkin => {
                        checkin.Location = location
                        checkin.checkinKey = cryptr.encrypt(req.cookies.userId + '_' + checkin.id)
                        // Save when you click on a check in for uploading photos after checked in?
                        res.cookie('checkIn', checkin.dataValues.id, {maxAge: 900000});

                        req.app.render('partials/checkin', { checkin: checkin, layout: false }, (err, html) => {
                            if (err) {
                                res.status(500).end()
                            }
                            else {
                                res.json({ html: html, name: checkin.Location.Name })
                            }
                        })
                    })
                })
            })
        }
    })
})

// Create a note for a checkin
router.post('/note', (req, res) => {
    let checkin = cryptr.decrypt(req.body.checkin).split('_').pop()

    db.Note.count({ where: { CheckinId: checkin } }).then(count => {
        db.Note.create({
            Order: count + 1,
            Note: req.body.note,
            CheckinId: checkin
        }).then(note => {
            req.app.render('partials/note', { note: note, layout: false }, (err, html) => {
                if (err) {
                    res.status(500).end()
                }
                else {
                    res.json({ html: html, checkinKey: req.body.checkin })
                }
            })
        })
    })
})

router.post('/saveTrip', (req, res) => {
    db.SavedTrip.create({
        UserId: req.cookies.userId,
        TripId: req.body.trip
    }).then((data) => { res.json(data) })
})

module.exports = router;
