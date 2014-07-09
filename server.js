/**
 * Module dependencies:
 * - Express
 * - http
 * - underscore
 * - Socket.IO
 */

// var GameBoard = JSON.parse(file).GameBoard;

var express = require("express")
  , http = require("http")
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io')(server)
  , bodyParser = require("body-parser")
  , _ = require("underscore")
  , session = require("express-session")
  , cookieParser = require("cookie-parser");

// MongoDB, Connect, Session Storage
var passportSocketIo = require("passport.socketio")
  , connect = require("connect")
  , MongoStore = require("connect-mongo-store")(connect)
  , mongoStore = new MongoStore("mongodb://localhost:27017/mpdb", [])
  , passport = require("passport")
  , GoogleStrategy = require("passport-google").Strategy;

/**
 * Format of a participant:
 * {
 *     id: "sessionId",
 *     name: "participantName"
 * }
 */ 
var participants = [];

// Server config
app.set("ipaddr", "127.0.0.1");
app.set("port", 8080);
app.set("views", __dirname + "/views"); 
app.set("view engine", "jade");
app.use(express.static("public", __dirname + "/public"));
// Support JSON, urlencoded, and multipart requests
app.use(bodyParser());
app.use(cookieParser("secret"));
app.use(passport.initialize());

// connect to mongo session store
app.use(connect.session({store: mongoStore, secret: "secret"}));
mongoStore.on("connect", function() {
    console.log("Store is ready to use");
});
mongoStore.on("error", function(err) {
    console.log("Connect session error: ", err);
});

passport.use(new GoogleStrategy({
    returnURL: "http://localhost:8080/auth/google/return",
    realm: "http://localhost:8080/"
    },
    function (identifier, profile, done) {
        console.log("Login success!");
        profile.identifier = identifier;
        return done(null, profile);
    }
));
passport.serializeUser(function(user, done) {
    done(null, user);
    console.log("User serialized:", user.name.givenName);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
    console.log("User deserialized");
});

// // socket.io config
// io.use(passportSocketIo.authorize({
//     cookieParser: cookieParser,
//     key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
//     secret:      'session_secret',    // the session_secret to parse the cookie
//     store:       mongoStore,        // we NEED to use a sessionstore. no memorystore please
//     success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
//     fail:        onAuthorizeFail      // *optional* callback on fail/error - read more below
// }));

// function onAuthorizeSuccess(data, accept) {
//     console.log("Successful connection to socket.io");
//     accept();
// }

// function onAuthorizeFail(data, message, error, accept) {
//     if (error) {
//         throw new Error(message);
//     }
//     console.log("Failed connection to socket.io:", message);
//     if (error) {
//         accept(new Error(message));
//     }
// }

// // Game Functions
// function RollDice() {
//     var one = _.random(1, 6);
//     var two = _.random(1, 6);
//     return [one, two];
// }

// Routing
app.get("/", function(request, response) {
    response.render("index");
});

app.get("/auth/google", passport.authenticate('google'));
app.get('/auth/google/return', 
        passport.authenticate('google', { failureRedirect: '/loginfailure' }),
        function(req, res) {
            res.redirect('/');
        });

app.get("/loginfailure", function(request, response) {
    response.render("fail");
});

// app.post("/message", function(request, response) {
//     // the request body expects a param named "message"
//     var message = request.body.message;
//     if (_.isUndefined(message) || _.isEmpty(message.trim())) {
//         return response.json(400, {error: "Message is invalid"});
//     }
//     var name = request.body.name;
//     // let our chatroom know there was a new message
//     io.sockets.emit("incomingMessage", {message: message, name: name});

//     return response.json(200, {message: "Message received"});
// });

// Socket.IO events
// io.on("connection", function(socket) {

//     ////////////////////////////////////////////////////////////////////////////
//     // When a user connects, we expect an event called "newUser" and then we'll
//     // emit an event called "newConnection" with a list of all participants to
//     // all connected clients
//     socket.on("newUser", function(data) {
//         participants.push({id: data.id, name: data.name});
//         io.sockets.emit("newConnection", {participants: participants});
//     });
//     // when a user changes his name
//     socket.on("nameChange", function(data) {
//         _.findWhere(participants, {id: socket.id}).name = data.name;
//         io.sockets.emit("nameChanged", {id: data.id, name: data.name});
//     });
//     // when a user disconnects, the event "disconnect" is automatically captured
//     // by the server.
//     socket.on("disconnect", function() {
//         participants = _.without(participants, _.findWhere(participants, {id: socket.id}));
//         io.sockets.emit("userDisconnected", {id: socket.id, sender: "system"});
//     });
//     ////////////////////////////////////////////////////////////////////////////

//     socket.on("RollDice", function(data) {
//         var result = RollDice();
//         io.sockets.emit("DiceResult", {result: result});
//     });
    
//     socket.on("ImproveProperty", function(data) {
//     });
    
//     socket.on("SellImprovement", function(data) {
//     });
    
//     socket.on("ProposeTrade", function(data) {
//     });
    
// });

server.listen(app.get("port"), app.get("ipaddr"), function() {
    console.log("Server started. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});
