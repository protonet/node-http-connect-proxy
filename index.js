var net  = require('net'),
    
    lookup = require('./lookup').lookup,
    tunnel = require('./tunnel').open,
    
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
      socket.removeListener('data', handler);
      
      var captures = buffer.match(/^CONNECT ([^:]+):([0-9]+) (HTTP\/1\.[01])/);
      
      if (!captures || captures.length < 2) {
        console.log('Received invalid HTTP request');
        return send_response(400, 'Bad Request', true);
      }
      
      console.log('Client requested a tunnel to ' + captures[1] + ' port ' + captures[2]);
      
      http_version = captures[3];
      
      lookup(captures[1], function(port) {
      
        if (!port) { return send_response(401, 'Unknown Proxy Target', true); }
        
        var remote = tunnel(TUNNEL_HOST, port, 'localhost:' + captures[2], function(data) {
          console.log('Connected to upstream service, initiating tunnel pumping');
          
          socket.addListener('data', function(data) { remote.write(data); });
          remote.addListener('data', function(data) { socket.write(data); });
          
          send_response(200, 'Connection Established');

          if (data.length > 0) { socket.write(data); }
        });
      });
    }
  }
  
  socket.addListener('data', handler);
});

server.listen(8022);

console.log('Proxy server running at http://0.0.0.0:8022/');

