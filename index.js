var util = require('util');

var net  = require('net'),

    lookup = require('./lookup').lookup,
    tunnel = require('./tunnel').open,
    trans = require('./transparent').open,

    TUNNEL_HOST = '127.0.0.1',
    HEADERS = "Proxy-agent: protonet-proxy/0.0.1\r\n";

process.on('uncaughtException',function(error){
// process error
  util.log(error);
});

var server = net.createServer(function (socket) {
  var buffer = '',
      http_version = 'HTTP/1.0';

  send_response = function(numeric, text, close) {
    util.log('Sending HTTP ' + numeric + ' ' + text + ' response');

    try {
      socket.write(http_version + ' ' + numeric + ' ' + text + "\r\n");
      socket.write(HEADERS + "\r\n");

      if (close) {
        util.log('Disconnecting client');
        socket.end();
      }
    } catch(ex) {
      util.log('Error occurred while sending HTTP response');
    }
  }

  // define it here so it can be unassigned
  var handler = function(data) {
    buffer += data.toString();

    if (buffer.indexOf("\r\n\r\n") > 0) {
      socket.removeListener('data', handler);

      var captures = buffer.match(/^CONNECT ([^:]+):([0-9]+) (HTTP\/1\.[01])/);

      if (!captures || captures.length < 2) {
        util.log('Received invalid HTTP request');
        return send_response(400, 'Bad Request', true);
      }

      var tmp = captures[1].split('~');
      var target = tmp[0];
      var old_style = tmp.length > 1;
      util.log('Client requested a tunnel to ' + target + ' port ' + captures[2]);
      if (old_style) util.log('Using the old HTTP CONNECT method');

      http_version = captures[3];

      lookup(target, function(port) {
        util.log('Remote port is ' + port);

        if (!port) { return send_response(401, 'Unknown Proxy Target', true); }

        var method = old_style ? tunnel : trans;
        var remote = method(TUNNEL_HOST, port, 'localhost:' + captures[2], function(data) {
          if (data == null) { return send_response(500, 'Remote node refused tunnel or does not respond', true); }

          util.log('Connected to upstream service, initiating tunnel pumping');

          var closeBoth = function() {
            util.log('Disconnecting tunnel');
            try { socket.end(); } catch(ex) {}
            try { remote.end(); } catch(ex) {}
          }

          var tunnel = function(other) {
            return function(data) {
              try { other.write(data); }
              catch(ex) {
                util.log('Error during socket write');
                closeBoth();
              }
            }
          };

          socket.addListener('data', tunnel(remote));
          remote.addListener('data', tunnel(socket));

          socket.addListener('close', closeBoth);
          remote.addListener('close', closeBoth);

          socket.addListener('error', closeBoth);
          socket.addListener('error', closeBoth);

          send_response(200, 'Connection Established');

          if (data.length > 0) {
            try { socket.write(data); } catch(ex) {}
          }
        });
      });
    }
  }

  socket.addListener('data', handler);
});

server.listen(8022);

util.log('Proxy server running at http://0.0.0.0:8022/');

