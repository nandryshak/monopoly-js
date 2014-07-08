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
  , _ = require("underscore");

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

// Game Functions
function RollDice() {
    var one = _.random(1, 6);
    var two = _.random(1, 6);
    return [one, two];
}

// Routing
app.get("/", function(request, response) {
    response.render("index");
});

app.post("/message", function(request, response) {
    // the request body expects a param named "message"
    var message = request.body.message;
    if (_.isUndefined(message) || _.isEmpty(message.trim())) {
        return response.json(400, {error: "Message is invalid"});
    }
    var name = request.body.name;
    // let our chatroom know there was a new message
    io.sockets.emit("incomingMessage", {message: message, name: name});

    return response.json(200, {message: "Message received"});
});

// Socket.IO events
io.on("connection", function(socket) {

    ////////////////////////////////////////////////////////////////////////////
    // When a user connects, we expect an event called "newUser" and then we'll
    // emit an event called "newConnection" with a list of all participants to
    // all connected clients
    socket.on("newUser", function(data) {
        participants.push({id: data.id, name: data.name});
        io.sockets.emit("newConnection", {participants: participants});
    });
    // when a user changes his name
    socket.on("nameChange", function(data) {
        _.findWhere(participants, {id: socket.id}).name = data.name;
        io.sockets.emit("nameChanged", {id: data.id, name: data.name});
    });
    // when a user disconnects, the event "disconnect" is automatically captured
    // by the server.
    socket.on("disconnect", function() {
        participants = _.without(participants, _.findWhere(participants, {id: socket.id}));
        io.sockets.emit("userDisconnected", {id: socket.id, sender: "system"});
    });
    ////////////////////////////////////////////////////////////////////////////

    socket.on("RollDice", function(data) {
        var result = RollDice();
        io.sockets.emit("DiceResult", {result: result});
    });
    
    socket.on("ImproveProperty", function(data) {
    });
    
    socket.on("SellImprovement", function(data) {
    });
    
    socket.on("ProposeTrade", function(data) {
    });
    
});

server.listen(app.get("port"), app.get("ipaddr"), function() {
    console.log("Server started. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});
