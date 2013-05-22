var net = require('net');

exports.open = function(host, port, trash, callback) {
  console.log('Connecting to ' + host + ':' + port);

  var proxy = new net.Socket();
  proxy.connect(port, host, function() {
    console.log('Connected, proxying traffic verbatim');

    callback('');
  });

  proxy.addListener('error', function(){
    return callback(null);
  });
  
  return proxy;
}
