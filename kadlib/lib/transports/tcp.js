'use strict';

var assert = require('assert');
var inherits = require('util').inherits;
var clarinet = require('clarinet');
var net = require('net');
var StreembitContact = require('../contacts/streembit-contact');
var RPC = require('../rpc');

/**
 * Transport adapter that sends and receives messages over a TCP socket
 * @constructor
 * @extends {RPC}
 * @param {AddressPortContact} contact - Your node's {@link Contact} instance
 */
function TCPTransport(contact, options) {
  if (!(this instanceof TCPTransport)) {
    return new TCPTransport(contact, options);
  }

  assert(contact instanceof StreembitContact, 'Invalid contact supplied');
  RPC.call(this, contact, options);
}

inherits(TCPTransport, RPC);

/**
 * Create a TCP socket and listen for messages
 * @private
 * @param {Function} done
 */
TCPTransport.prototype._open = function(done) {
  var self = this;

  this._socket = net.createServer(this._handleConnection.bind(this));
  this._queuedResponses = {};

  this._socket.on('error', function(err) {
    self._log.error('rpc encountered and error: %s', err.message);
  });

  this._socket.on('listening', done);
  this._socket.listen(this._contact.port);
};

/**
 * Send a RPC to the given contact
 * @private
 * @param {Buffer} data
 * @param {Contact} contact
 */
TCPTransport.prototype._send = function(data, contact) {
  var self = this;
  var parsed = JSON.parse(data.toString());

  if (this._queuedResponses[parsed.id]) {
    this._queuedResponses[parsed.id].end(data);
    delete this._queuedResponses[parsed.id];
    return;
  }

  var sock = net.createConnection(contact.port, contact.address);

  sock.on('error', function(err) {
    self._log.error('error connecting to peer', err);
  });

  this._queuedResponses[parsed.id] = sock;

  this._handleConnection(sock);
  sock.write(data);
};

/**
 * Close the underlying socket
 * @private
 */
TCPTransport.prototype._close = function() {
  this._socket.close();
};

/**
 * Handle incoming connection
 * @private
 * @param {Object} connection
 */
TCPTransport.prototype._handleConnection = function (connection) {

    var self = this;

    var parser = clarinet.createStream();
    var buffer = '';
    var opened = 0;
    var closed = 0;
    
    function handleInvalidMsg() {
        buffer = '';
        opened = 0;
        closed = 0;
        // TODO list on the blacklist
    }

    parser.on('openobject', function() {
        opened++;
    });

    parser.on('closeobject', function() {
        closed++;

        if (opened === closed) {
            var parsed;
            try {
                parsed = JSON.parse(buffer);
            } 
            catch (err) {               
                return handleInvalidMsg();
            }
            
            if (!parsed) {
                return handleInvalidMsg();
            }
            
            try {
                if (parsed.type) {
                    switch (parsed.type) {
                        case "DISCOVERY":
                            self._log.debug('DISCOVERY message');
                            var addr = connection.remoteAddress;
                            var reply = JSON.stringify({ address: addr });
                            connection.write(reply);
                            break;

                        case "PEERMSG":
                            var addr = connection.remoteAddress;
                            var port = connection.remotePort;
                            self.emit('PEERMSG', msgobj, { address: addr, port: port });
                            break;

                        case "MSGREQUEST":
                            var account = msgobj.account;
                            var msgkey = msgobj.msgkey;
                            
                            self.emit('MSGREQUEST', account, msgkey, function (err, count, msgs) {
                                var reply = "";
                                if (err) {
                                    reply = JSON.stringify({ error: err });
                                }
                                else {
                                    reply = JSON.stringify({ error: 0, count: count, messages: msgs });
                                }
                                socket.write(reply);
                                socket.end();
                            });
                            break;

                        default:
                            return handleInvalidMsg();
                            break
                    }
                }
                else{
                    // all other messages
                    if (parsed.id && !self._queuedResponses[parsed.id]) {
                        self._queuedResponses[parsed.id] = connection;
                    }
                    
                    self.receive(new Buffer(buffer));
                }
            }
            catch (e) {
                self._log.error('TCP handleConnection error: %j', e);
                connection.end();
            }

            buffer = '';
            opened = 0;
            closed = 0;
        }
    });

    parser.on('error', function(err) {
        self._log.error(err.message);
        self._log.warn('failed to parse incoming message');
        connection.end();
    });

    connection.on('error', function (err) {
        var clientaddr = connection.remoteAddress + ":" + connection.remotePort;
        self._log.error('error communicating with peer ' + clientaddr + ' error: ' + err.message);
    });

    connection.on('data', function(data) {
        buffer += data.toString('utf8');
        parser.write(data.toString('utf8'));
    });
};

module.exports = TCPTransport;
