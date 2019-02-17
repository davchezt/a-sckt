const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");
const path = require("path");
const md5 = require("md5");
const morgan = require("morgan");
const bodyParser = require("body-parser");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

Date.prototype.toUnixTime = function() {
  return (this.getTime() / 1000) | 0;
};
Date.time = function() {
  return new Date().toUnixTime();
};

const requestMiddleware = (req, res, next) => {
  req.requestTime = Date.now();
  req.io = io;
  next();
};
process.env.JWT_KEY = "DaVchezt";
let db = null;

mongoose.set("useCreateIndex", true);
mongoose.connect(
  "mongodb://localhost:27017/socket",
  { useNewUrlParser: true },
  (err, conn) => {
    if (err) {
      log.error("Error in connection: " + err);
      return;
    }
    db = conn;
  }
);
mongoose.Promise = global.Promise;

app.use(requestMiddleware);
app.use(
  morgan("combined", {
    skip: (req, res, next) => {
      return res.statusCode < 400;
    }
  })
);
app.use("/uploads", express.static("uploads"));
app.use("/bower_components", express.static("bower_components"));
app.use("/assets", express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("json spaces", 2); // pretty print

app.post("/send/:room/", function(req, res) {
  var room = req.params.room;
  message = req.body;

  io.sockets.in(room).emit("message", { room: room, message: message });

  res.end("message sent");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

const https = require("https");
app.get("/anu", (req, result) => {
  var options = {
    host: "jsonplaceholder.typicode.com",
    port: 443,
    path: "/users",
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };
  var req = https.get(options, function(res) {
    console.log("STATUS: " + res.statusCode);
    console.log("HEADERS: " + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res
      .on("data", function(chunk) {
        // You can process streamed parts here...
        bodyChunks.push(chunk);
      })
      .on("end", function() {
        var body = Buffer.concat(bodyChunks);
        console.log("BODY: " + body);
        // ...and/or process the entire body here.
        result.status(res.statusCode).json({
          message: "ok",
          data: JSON.parse(body)
        });
      });
  });

  req.on("error", function(e) {
    console.log("ERROR: " + e.message);
  });
});

// Sockets
let rooms = [];

io.on("connection", function(socket) {
  socket.on("disconnect", () => {
    Object.keys(rooms).forEach(function(id) {
      socket.leave(rooms[id]);
    });
  });

  socket.on("subscribe", function(room) {
    if (rooms.indexOf(room) === -1) rooms.push(room);
    io.sockets.in(room).emit("message", { room: room, message: "Join room" });
    io.emit("room", { room: room, message: "Room Created" });
    socket.join(room);
  });

  socket.on("unsubscribe", function(room) {
    if (rooms.indexOf(room) === -1) rooms.splice(id, 1);
    io.sockets.in(room).emit("message", { room: room, message: "Leave room" });
    socket.leave(room);
  });

  socket.on("ping-text", function(data) {
    io.sockets.in(data.room).emit("message", data);
  });

  // RTC
  socket.on("start-call", (peer) => {
    console.log('start-call');
    io.sockets.in(peer.room).emit("start-call", peer);
  });
  socket.on("in-call", (peer) => {
    console.log('in-call');
    io.sockets.in(peer.room).emit("in-call");
  });
  socket.on("chat-call", (peer) => {
    console.log('chat-call');
    io.sockets.in(peer.room).emit("chat-call", peer);
  });
  socket.on("stop-call", (peer) => {
    console.log('stop-call');
    io.sockets.in(peer.room).emit("stop-call");
  });
  
  socket.on('join', function(room) {
    var peers = io.nsps['/'].adapter.rooms[room] ? Object.keys(io.nsps['/'].adapter.rooms[room].sockets) : []
    
    socket.emit('peers', peers);
    socket.join(room);
  });
  socket.on('leave', function(room) {
	  socket.leave(room);
  });
  socket.on('signal', function(data) {
    var client = io.sockets.connected[data.id];
    client && client.emit('signal', {
      id: socket.id,
      signal: data.signal,
    });
  });
  // END RTC
});

// Handle 404
app.use((req, res, next) => {
  const error = new Error("Error 404");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
  log.error("get " + error.message);
});

var port = process.env.PORT || 8080;

http.listen(port, function() {
  console.log("listening at port: " + port);
  // Secret + titik + value
  // console.log(md5('DaVchezt.4bahagia'))
});
