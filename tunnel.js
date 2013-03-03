var net = require('net');

exports.open = function(host, port, target, callback) {
  console.log('Connecting to ' + host + ':' + port);

  var proxy = new net.Socket();
  proxy.connect(port, host, function() {
    console.log('Tunneling to ' + target + ' through ' + host + ':' + port);

    proxy.write('CONNECT ' + target + " HTTP/1.0\r\n\r\n");
  });

  var buffer = '';

  var handler = function(data) {
    buffer += data.toString();

    if (buffer.indexOf("\r\n\r\n") > 0) {
      var captures = buffer.match(/([0-9]{3}) (.+)/);

      if (!captures || captures.length < 2 || captures[1] != '200') {
        return callback(null);
      }

      buffer = buffer.slice(buffer.indexOf("\r\n\r\n") + 4);

      console.log('Tunnel connected, handing socket back');

      proxy.removeListener('data', handler);

      callback(buffer);
    }
  }

  proxy.addListener('data', handler);

  proxy.addListener('error', function(){
    return callback(null);
  });
  return proxy;
}
