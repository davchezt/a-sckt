You have to create a room with conversation_id and make users to subscribe to that room, so that you can emit a private message to that room it by,

## client
```js
var socket = io.connect('http://ip:port');

socket.emit('subscribe', conversation_id);

socket.emit('send message', {
  room: conversation_id,
  message: "Some message"
});

socket.on('conversation private post', function(data) {
    //display data.message
});
```

## Server
```js
socket.on('subscribe', function(room) {
  console.log('joining room', room);
  socket.join(room);
});

socket.on('send message', function(data) {
  console.log('sending room post', data.room);
  socket.broadcast.to(data.room).emit('conversation private post', {
    message: data.message
  });
});
```

```js
const https = require('https');

var postData = JSON.stringify({
    'msg' : 'Hello World!'
});

var options = {
  hostname: 'posttestserver.com',
  port: 443,
  path: '/post.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

var req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  var bodyChunks = [];
  res.on('data', (d) => {
    process.stdout.write(d);
    bodyChunks.push(d);
  });
  res.on('end', () => {
    var body = Buffer.concat(bodyChunks);
    process.stdout.write(body);
    console.log(JSON.parse(body));
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
```