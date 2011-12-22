var net = require('net');

exports.open = function(host, port, target, callback) {
  console.log('Starting a connection to ' + target + ' via ' + host + ':' + port);
  
  var proxy = new net.Socket();
  proxy.connect(port, host, function() {
    proxy.write('CONNECT ' + target + " HTTP/1.0\r\n\r\n");
  });
  
  var buffer = '';
  
  var handler = function(data) {
    buffer += data.toString();
    
    if (buffer.indexOf("\r\n\r\n") > 0) {
      console.log(buffer);
      var captures = buffer.match(/([0-9]{3}) (.+)/);
      
      if (!captures || captures.length < 2 || captures[1] != '200') {
        return;
      }
      
      buffer = buffer.slice(buffer.indexOf("\r\n\r\n") + 4);
      
      console.log('Proxy connected, handing back');
      
      proxy.removeListener('data', handler);
      
      callback(buffer);
    }
  }
  
  proxy.addListener('data', handler);
  
  return proxy;
}
