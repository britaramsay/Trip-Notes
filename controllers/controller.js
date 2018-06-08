const express = require('express'),
    exphbs = require('express-handlebars'),
    router = express.Router(),
    db = require('../models'),
    request = require('request'),
    aws = require('aws-sdk'),
    S3_BUCKET = process.env.S3_BUCKET,
    Cryptr = require('cryptr'),
    cryptr = new Cryptr(process.env.CRYPTR_KEY),
    Op = db.Sequelize.Op


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
        Key: cryptr.encrypt(req.cookies.userId) + '/' + fileName,
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

router.get('/trips/public', (req, res) => {
    db.Trip.findAll({
        where: { Private: false },
        include: [
            {
                model: db.Checkin,
                include: [db.Photo]
            }
        ]
    }).then(trips => {

        res.render('partials/trips',
            {
                carousel: true,
                trips: trips.map(trip => {
                    trip.photo = findFirstPhoto(trip)
                    trip.tripLink = cryptr.encrypt(trip.UserId + '_' + trip.id).trim()

                    return trip
                }), layout: false
            }
        )
    })
})

// Find all trips made by the current user and render them to trips partial
router.get('/user/trips', (req, res) => {
    db.Trip.findAll({
        where: { UserId: req.cookies.userId },
        include: [
            {
                model: db.Checkin,
                include: [db.Photo]
            }
        ]
    }).then(trips => {
        res.render('partials/trips',
            {
                trips: trips.map(trip => {
                    trip.photo = findFirstPhoto(trip)
                    trip.tripLink = cryptr.encrypt(req.cookies.userId + '_' + trip.id)
                    return trip
                }),
                owner: true, 
                layout: false
            }
        )
    })
})

function findFirstPhoto(trip) {
    for (var i = 0; i < trip.Checkins.length; i++) {
        for (var j = 0; j < trip.Checkins[i].Photos.length; j++) {
            return trip.Checkins[i].Photos[j]
        }
    }

    return null
}

// Find a trip based off of the encrypted key (user.id_trip.id)
router.get('/trip/:key', (req, res) => {
    let [tripOwner, decryptedTrip] = cryptr.decrypt(req.params.key).split('_')

    db.Trip.findOne({
        where: { id: decryptedTrip },
        include: [
            {
                model: db.Checkin,
                include: [db.Location, db.Note, db.Photo]
            }
        ]
    }).then(trip => {
        trip.key = req.params.key
        db.sequelize.query(`select Tags.* FROM TripTags
        INNER JOIN Tags on Tags.id = TripTags.TagId
        WHERE TripTags.TripId = ` + trip.id, { model: db.Tag }
        ).then(tags => {
            res.render('trip', {
                trip: trip,
                owner: tripOwner === req.cookies.userId,
                tags: tags,
                checkins: trip.Checkins.map(checkin => {
                    checkin.owner = tripOwner === req.cookies.userId
                    checkin.checkinKey = cryptr.encrypt(tripOwner + '_' + checkin.id)
                    checkin.Notes.map(note => {
                        note.noteKey = cryptr.encrypt(tripOwner + '_' + note.id)
                        return note
                    })
                    checkin.Photos.map(photo => {
                        photo.photoKey = cryptr.encrypt(tripOwner + '_' + photo.id)
                        return photo
                    })
                    return checkin
                })
            })
        })

    })
})

// delete a Trip, Checkin, Photo, or Note (only user who owns can delete)
router.delete('/:type/:key', (req, res) => {
    // TODO: if type is Photo, we need to delete the image from AWS as well

    let [decryptedUser, decryptedObjId] = cryptr.decrypt(req.params.key).split('_')

    if (decryptedUser != req.cookies.userId) {
        res.status(401).end()
    } else if (['Trip', 'Checkin', 'Note', 'Photo'].indexOf(req.params.type) == -1) {
        res.status(501).end()
    } else {
        db[req.params.type].findOne({
            where: { id: decryptedObjId }
        }).then(obj => {
            obj.destroy()
            res.status(200).end()
        })
    }
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

// add a tag to a trip
router.post('/trip/tag', (req, res) => {
    let [tripOwner, tripId] = cryptr.decrypt(req.body.key).split('_'),
        tag = req.body.tag

    if (tripOwner !== req.cookies.userId) {
        return res.status(401).end()
    }


    db.Tag.findOrCreate({
        where: {
            Name: tag
        }
    }).spread((tag, created) => {
        db.TripTag.count({ where: { TripId: tripId, TagId: tag.id } }).then(count => {
            if (!count) {
                db.TripTag.create(
                    {
                        TripId: tripId,
                        TagId: tag.id
                    }
                ).then(tripTag => {
                    res.json(true)
                })
            } else {
                res.json(false)
            }
        })


    })
})

router.delete('/trip/tag/:key/:tag', (req, res) => {
    let [tripOwner, tripId] = cryptr.decrypt(req.params.key).split('_'),
        tag = req.params.tag

    if (tripOwner !== req.cookies.userId) {
        return res.status(401).end()
    }

    db.Tag.findOne({ where: { Name: tag } }).then(tag => {
        db.TripTag.findOne({ where: { TripId: tripId, TagId: tag.id } }).then(tripTag => {
            tripTag.destroy()
            res.send(200).end()
        })
    })

})

router.post('/newImage', (req, res) => {
    let [tripOwner, checkin] = cryptr.decrypt(req.body.checkin).split('_')

    db.Photo.count({
        where: { CheckinId: checkin }
    }).then(count => {
        db.Photo.create({
            URL: req.body.url,
            Order: count + 1,
            CheckinId: checkin,
        }).then(photo => {
            photo.photoKey = cryptr.encrypt(tripOwner + '_' + photo.id)
            req.app.render('partials/photo', { photo: photo, owner: true, layout: false }, (err, html) => {
                if (err) {
                    res.status(500).end()
                }
                else {
                    res.json({ html: html, key: req.body.checkin })
                }
            })
        })
    })
})

// Posts user's current location or venue searched for 
router.post('/checkin', (req, res) => {
    // let tripId = cryptr.decrypt(req.body.trip).split('_').pop()

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
            limit: 3
        }
    }
    // If user used geolocation to check in
    else if (req.body.lat && req.body.long) {
        qs = {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            ll: req.body.lat + ',' + req.body.long,
            v: '20180323',
            limit: 3
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
            // Parse api response
            // 
            var locations = JSON.parse(body).response.venues;
            console.log(locations)
            // console.log(response.id, response.name)
            res.render('partials/locations', { locations: locations, layout: false })


        }
    })
})

router.post('/checkinLocation', (req, res) => {
    let location = req.body.location.split('+')
    let lng = location.pop()
    let lat = location.pop()
    let name = location.pop()
    let apiID = location.pop()

    let [tripOwner, tripId] = cryptr.decrypt(req.body.trip).split('_')

    db.Checkin.count({
        where: {
            TripId: tripId
        }
    }).then(count => {
        // Create a checkin with the next highest order number
        db.Location.findOrCreate({
            where: {
                ApiID: apiID
            },
            defaults: {
                Name: name,
                Lat: lat,
                Lng: lng
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
                checkin.owner = tripOwner === req.cookies.userId

                // Save when you click on a check in for uploading photos after checked in?
                res.cookie('checkIn', checkin.dataValues.id, { maxAge: 900000 });

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
            note.noteKey = cryptr.encrypt(req.cookies.userId + '_' + note.id)
            req.app.render('partials/note', { note: note, owner: true, layout: false }, (err, html) => {
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

router.post('/trip/search', (req, res) => {
    let searchQuery = req.body.search
    var trips;
    db.Trip.findAll({
        where: { 
            [Op.and]: {
                Private: 0, 
                [Op.or]: {
                    Title: {[Op.like]: ['%' + searchQuery +'%']},
                    Description: {[Op.like]: ['%' + searchQuery +'%']}
                }
            }
        },
        include: [{model: db.Checkin, include: [db.Photo]}]
    }).then(matches => {
        trips = matches.map(match => {return {id: match.dataValues.id, Title: match.dataValues.Title, Description: match.dataValues.Description, photo: findFirstPhoto(match), tripLink: cryptr.encrypt(match.dataValues.UserId + '_' + match.dataValues.id)}})
    })
    
    db.Tag.findAll({
        where: {Name: {[Op.like]: ['%' + searchQuery +'%']}},
        include: [{
            model: db.Trip, 
            where: { Private: 0 }, 
            include: [{
                model: db.Checkin, 
                include: [db.Photo]
            }]
        }]
    }).then(tags => {
        var tagsMatching = [];
        tags.forEach(tag => {
            var oneTag = tag.dataValues.Trips[0];
            tag.dataValues.Trips.forEach(trip => {tagsMatching.push({id: trip.dataValues.id, Title: trip.dataValues.Title, Description: trip.dataValues.Description, photo: findFirstPhoto(trip), tripLink: cryptr.encrypt(trip.dataValues.UserId + '_' + trip.dataValues.id)})})
        })

        function findDuplicateTrip(array, attr, value) {
            for(var i = 0; i < array.length; i++) {
                if(array[i][attr] === value) {
                    return i;
                }
            }
            return -1;
        }

        tagsMatching.filter(function (value, index, self) { 
            if(findDuplicateTrip(trips, 'id', value.id) == -1){
                trips.push(value)
            }
        })
        
        res.render('searchTrips', {trips: trips, owner: false})
    })
})

module.exports = router;
