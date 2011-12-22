var net  = require('net'),
    util = require('util'),
    
    lookup = require('./lookup').lookup,
    
    TUNNEL_HOST = '127.0.0.1',
    HEADERS = "Proxy-agent: protonet-proxy/0.0.1\r\n";

var server = net.createServer(function (socket) {
  var buffer = '',
      http_version = 'HTTP/1.0';
  
  send_response = function(numeric, text, close) {
    socket.write(http_version + ' ' + numeric + ' ' + text + "\r\n");
    socket.write(HEADERS + "\r\n");
    
    if (close) socket.end();
  }
  
  // define it here so it can be unassigned
  var handler = function(data) {
    buffer += data.toString();
    
    if (buffer.indexOf("\r\n\r\n") > 0) {
      var captures = buffer.match(/^CONNECT ([^ ]+) (HTTP\/1\.[01])/);
      
      if (!captures || captures.length < 2) {
        return send_response(400, 'Bad Request', true);
      }
      
      http_version = captures[2];
      
      lookup(captures[1], function(port) {
      
        if (!port) {
          return send_response(401, 'Unknown Proxy Target', true);
        }
        
        console.log('Starting a connection to ' + TUNNEL_HOST + ':' + port);
        
        var remote = new net.Socket();
        remote.connect(port, TUNNEL_HOST, function() {
        
          console.log('Connected, initiating tunnel pumping');
          
          socket.removeListener('data', handler);
          
          send_response(200, 'Connection Established');

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

