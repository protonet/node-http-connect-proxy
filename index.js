var net  = require('net'),
    util = require('util'),
    
    lookup = require('./lookup').lookup;

var server = net.createServer(function (socket) {
  var buffer = '';
  
  // define it here so it can be unassigned
  var handler = function(data) {
    buffer += data.toString();
    
    if (buffer.indexOf("\r\n\r\n") > 0) {
      var captures = buffer.match(/^CONNECT ([^ ]+) (HTTP\/1\.[01])/);
      
      if (!captures || captures.length < 2) {
        socket.write(captures[2] + " 400 Bad Request\r\n");
        socket.write("Proxy-agent: protonet-proxy/0.0.1\r\n\r\n");
        socket.end();
      }
      
      lookup(captures[1], function(port) {
      
        if (!port) {
          socket.write(captures[2] + " 401 Unknown Proxy Target\r\n");
          socket.write("Proxy-agent: protonet-proxy/0.0.1\r\n\r\n");
          socket.end();
          return;
        }
        
        console.log('Starting a connection to 127.0.0.1:' + port);
        
        var remote = new net.Socket();
        remote.connect(port, '127.0.0.1', function() {
        
          console.log('Connected, initiating pumping');
          
          socket.removeListener('data', handler);
          
          socket.write(captures[2] + " 200 Connection Established\r\n");
          socket.write("Proxy-agent: protonet-proxy/0.0.1\r\n\r\n");

          socket.addListener('data', function(data) { remote.write(data); });
          remote.addListener('data', function(data) { socket.write(data); });
        });
      });
    }
  }
  
  socket.addListener('data', handler);
});

server.listen(8022);

console.log('Server running at http://0.0.0.0:8022/');

