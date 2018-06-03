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
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };
    // TODO: Hash url to keep images w duplicate file names
    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.end();
        }
        const returnData = {
            signedRequest: data,
            url: `https://s3.us-east-2.amazonaws.com/${S3_BUCKET}/${fileName}`
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
router.get('/user/trips/:authId', (req, res) => {
    db.Trip.findAll({
        where: { UserId: req.cookies.userId },
    }).then(trips => {
        res.render('partials/trips', { trips: trips.map(trip => { trip.tripLink = cryptr.encrypt(req.cookies.userId + '_' + trip.id); return trip }), layout: false })
    })
})

// Find a trip based off of the encrypted key (user.id_trip.id)
// should only be accessible IF public OR private & belongs to signed in user
router.get('/trip/:key', (req, res) => {
    console.log('hello', req.params.key)

    let decryptedTrip = cryptr.decrypt(req.params.key).split('_').pop()
    db.Trip.findOne({
        where: { id: decryptedTrip }
    }).then(trip => {
        db.Checkin.findAll({
            where: { TripId: decryptedTrip },
            include: [db.Location]
        }).then(checkins => {
            console.log('checkins', checkins)
            res.render('trip', { trip: trip, checkins: checkins })
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
        
        res.cookie('userId', user.id, {maxAge: 900000});

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
    }).then(function (data) {
        res.render('partials/tripsummary', { trip: data, layout: false })
    })
})

router.post('/newImage', (req, res) => {
    db.Photo.count({
        where: {
            // Have option to click which checkin the image goes with and send id in body
            // For now change to one of you checkin ids
            CheckinId: 23
        }
    }).then(count => {
        db.Photo.create({
            URL: req.body.url,
            Order: count + 1,
            CheckinId: 23,
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
                    UserId: req.cookies.userId
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
                    }).then(function (data) { 
                        // Save when you click on a check in for uploading photos after checked in?
                        res.cookie('checkIn', data.dataValues.id, {maxAge: 900000});

                        res.render('partials/checkin', {checkin: data, layout: false}) 
                    })
                })
            })
        }
    })
})

router.post('/saveTrip', (req, res) => {
    db.SavedTrip.create({
        UserId: req.cookies.userId,
        TripId: req.body.trip
    }).then(function (data) { res.json(data) })
})

module.exports = router;
