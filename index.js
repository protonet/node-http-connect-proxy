var net  = require('net'),
    util = require('util');

// dynamic just 'cause
function lookupHost(host) {
  if (host == 'foobar')
    return ['team.protonet.info', 22];

  return null;
}

var server = net.createServer(function (socket) {
  var buffer = '';
  
  var handler = function(data) {
    buffer += data.toString();
    
    if (buffer.indexOf("\r\n\r\n") > 0) {
      var captures = buffer.match(/^CONNECT ([^ ]+) (HTTP\/1\.[01])/);
      var hostname = captures[1];
      var pair = lookupHost(hostname);
      
      if (!pair) {
        socket.write(captures[2] + " 401 Unknown Target\r\n");
        socket.write("Proxy-agent: protonet-proxy/0.0.1\r\n\r\n");
        socket.end();
        return;
      }
      
      console.log('Starting a connection to ' + pair[0]);
      
      var remote = new net.Socket();
      remote.connect(pair[1], pair[0], function() {
      
        console.log('Connected, initiating pumping');
        
        socket.removeListener('data', handler);
        
        socket.write(captures[2] + " 200 Connection Established\r\n");
        socket.write("Proxy-agent: protonet-proxy/0.0.1\r\n\r\n");

        
        //util.pump(socket, remote);
        //util.pump(remote, socket);
        
        socket.addListener('data', function(data) { remote.write(data); });
        remote.addListener('data', function(data) { socket.write(data); });
      });
    }
  }
  
  socket.addListener('data', handler);
  
});

server.listen(8022);

console.log('Server running at http://0.0.0.0:8022/');

