const express = require('express');
const router = express.Router();
const https = require("https");

const log = require('../helpers/loger');
const Count = require('../models/visitor-counts');

/* GET home page. */
router.get('/', (req, res, next) => {
  var options = {
    host: 'jsonplaceholder.typicode.com',
    port: 443,
    path: '/users',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
  };
  var req = https.get(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
  
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });
  
  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
});

module.exports = router;