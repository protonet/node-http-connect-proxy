var http = require('http');

var endpoint = "http://directory.protonet.info/resolve_to_port";

exports.lookup = function(name, callback) {
  console.log("lookup node_name", name);
  name += '.protonet.info';


  http.get(endpoint + '?node_name=' + name, function(response) {
    response.setEncoding('utf8');

    // response.data buffer
    var chunks = [];

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      chunks.push(chunk);
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      if (response.statusCode === 200) {
        doc = JSON.parse(chunks.join(''));
        callback(doc.port);
      }
      else {
        console.log("Recived error: " + chunks[0]);
      }
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
};
