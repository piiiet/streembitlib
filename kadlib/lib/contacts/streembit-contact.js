/*
 
This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------
  
*/


/**
 * Implementation is based on https://github.com/kadtools/kad 
 * Huge thanks to Gordon Hall https://github.com/gordonwritescode the author of kad library!
 * @module kad
 * @license GPL-3.0
 * @author Gordon Hall gordon@gordonwritescode.com
 */

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
    assert(typeof options.public_key === 'string', 'Invalid public key was supplied');

    this.address = options.address;
    this.port = options.port;
    this.public_key = options.public_key;
    
    if (options.account && typeof options.account === 'string' && options.account.length > 0) {
        var str = options.account.trim();
        assert(str.length > 0, 'Invalid account was supplied');
        this.account = options.account;
    }
    else {
        this.account = this.address + ':' + this.port;
    }

    Contact.call(this, options);
}

inherits(StreembitContact, Contact);

/**
* Generate a NodeID by taking the SHA1 hash of the address and port
* @private
*/
StreembitContact.prototype._createNodeID = function () {
    var hashbase = this.account + ':' + this.public_key;
    var nodeId = crypto.createHash('sha1').update(hashbase).digest('hex');
    return nodeId;
};

/**
 * Ensures that the address and port are valid
 * @returns {Boolean}
 */
StreembitContact.prototype.valid = function () {
    return this.port > 0 && this.port < 65536;
}


/**
* Generate a user-friendly string for the contact
*/
StreembitContact.prototype.toString = function() {
  return this.address + ':' + this.port;
};

module.exports = StreembitContact;
