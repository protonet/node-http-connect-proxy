Dynamic HTTP Proxy
==================

Main author: Daniel Lamando

Overview
--------
We (Protonet) have a homebrew system surrounding node publishing with quite a
few moving parts. Each published node has a SSH tunnel set up so that a port on
the central server (bound to localhost) is tunneled to the node's web server.
Normal HTTP proxying is used to permit access to remote web interfaces via
Apache virtual hosts and a rewritemap script, written in Ruby and accessing a
MongoDB database.

All of that works well, but when we wanted to also allow for tunneling non-HTTP
traffic (such as ssh connections), the sh*t hit the fan. Apache seemed to go
numb when rewriting anything with the `CONNECT` method. After days of research
and testing, we decided to try Node.JS proxies, would would be easily modifyable.
But what we found was even more limited than Apache, and after some debugging it
seems like Node.JS's HTTP server also goes crazy when faced with a simple
`CONNECT` request.

After a week of apache configs it was time to move on, so I spent half an hour
to write this special-case proxy server. I don't know if anyone else will ever
need (or even look at) this code but what the heck, it's open-source.

Umm... so what does it do?
--------------------------
This server listens for `CONNECT` requests on `0.0.0.0:8022`. When one is received,
it looks up the requested host (really just an alias) in MongoDB, resulting in a
port on `localhost`. It then connects to that port and issues a `CONNECT` request
for the port requested by the client (i.e. 22). When the remote proxy sets up
the socket, this server connects the client with the remote service.

Setup
-----
As this is not packaged for or released on npm [yet], you'll have to use
`git clone git@github.com:protonet/node-http-connect-proxy.git` (like
a caveman) and run `npm install follow-redirects` from within the clone.

To run the Server simply start nodessh via the forever service 'nodessh'
`service nodessh start`

Client SSH Config
-----------------
This tunnel was designed for ssh (but any port/protocol should work). As the target
hostname is variable based on which remote remote remote [sic] you want, the
best way to set up your client is with an alias. For example:

    alias nodessh='ssh -o "ProxyCommand nc -X connect -x ssh.protonet.info:8022 %h %p" -o "User protonet"'

Throw that in your `.bashrc` or `.zshrc` for best results.

You can also add entries to `.ssh/config` or run the command one-off by adding a
host alias to the ssh call.

Only `nc` is required, no special binaries or scripts need to be downloaded.

What can I take away from this codebase?
----------------------------------------
This server was written to solve a unique problem. If you have the same exact
problem, then 1) use our code 2) stop stealing our ideas ;)

That being said, I tried to make this reusable. `tunnel.js` is useful for any time
you want to connect using a remote HTTP `CONNECT` proxy, and `index.js` may help if
you want to use Node.JS to host a HTTP `CONNECT` proxy server.

License
-------
Copyright © Protonet Betriebs GmbH 2016

Licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php)
