const express = require('express'),
      bodyParser = require('body-parser'),
      PORT = process.env.PORT || 8080,
      app = express(),
      db = require("./models")

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Import routes and give the server access to them.
var routes = require("./controllers/controller.js");

app.use(routes);

// Sync DB, then start our server so that it can begin listening to client requests.
db.sequelize.sync({force: true}).then(() => app.listen(PORT, () => console.log("App listening on PORT " + PORT)));
