

/**
 * Implementation is based on https://github.com/kadtools/kad 
 * Huge thank you for Gordon Hall https://github.com/gordonwritescode the author of kad library!
 * @module kad
 * @license GPL-3.0
 * @author Gordon Hall gordon@gordonwritescode.com
 */


'use strict';

var assert = require('assert');

/**
 * Factory for blacklist middleware
 * @param {Array} blacklist - array of nodeID's to ban
 * @returns {Function}
 */
module.exports = function BlacklistFactory(blacklist) {
  assert(Array.isArray(blacklist), 'Invalid blacklist supplied');

  return function blacklister(message, contact, next) {
    if (blacklist.indexOf(contact.nodeID) !== -1) {
      return next(new Error('Contact is in the blacklist'));
    }

    next();
  };
};
