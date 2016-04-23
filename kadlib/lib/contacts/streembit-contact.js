'use strict';

var assert = require('assert');
var Contact = require('../contact');
var inherits = require('util').inherits;
var utils = require('../utils');
var crypto = require('crypto');

var MIN_KEY_LEN = 48;

/**
 * Represent a contact (or peer)
 * @constructor
 * @extends {Contact}
 * @param {Object} options
 * @param {String} options.address - IP or hostname
 * @param {Number} options.port - Listening port
 */
function StreembitContact(options) {
    if (!(this instanceof StreembitContact)) {
        return new StreembitContact(options);
    }

    assert(typeof options === 'object', 'Invalid options were supplied');
    assert(typeof options.address === 'string', 'Invalid address was supplied');
    assert(typeof options.port === 'number', 'Invalid port was supplied');
    //assert(typeof options.public_key === 'string', 'Invalid public key was supplied');
    //assert(typeof options.account === 'string', 'Invalid account name was supplied');

    this.address = options.address;
    this.port = options.port;
    this.public_key = options.public_key;
    this.account = options.account;

    Contact.call(this, options);
}

inherits(StreembitContact, Contact);

/**
* Generate a NodeID by taking the SHA1 hash of the address and port
* @private
*/
StreembitContact.prototype._createNodeID = function () {
    var nodeId;
    if (this.public_key && this.public_key.length && this.public_key.length >= MIN_KEY_LEN) {
        //nodeId = crypto.createHash('sha1').update(this.public_key).digest('hex');
        var strbase = this.address + ':' + this.port;
        nodeId = crypto.createHash('sha1').update(strbase).digest('hex');
    }
    else {
        // nodes which not write to the DHT doesn't have to have a public key
        var strbase = this.address + ':' + this.port;
        nodeId = crypto.createHash('sha1').update(strbase).digest('hex');
    }
    return nodeId;
};

/**
* Generate a user-friendly string for the contact
*/
StreembitContact.prototype.toString = function() {
  return this.address + ':' + this.port;
};

module.exports = StreembitContact;
