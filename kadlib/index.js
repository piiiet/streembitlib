


/**
 * Implementation is based on https://github.com/kadtools/kad 
 * Huge thank you for Gordon Hall https://github.com/gordonwritescode the author of kad library!
 * @module kad
 * @license GPL-3.0
 * @author Gordon Hall gordon@gordonwritescode.com
 */

'use strict';

module.exports = {};

/** {@link Bucket} */
module.exports.Bucket = require('./lib/bucket');
/** {@link Contact} */
module.exports.Contact = require('./lib/contact');

/** {@link Message} */
module.exports.Message = require('./lib/message');
/** {@link Node} */
module.exports.Node = require('./lib/node');
/** {@link Router} */
module.exports.Router = require('./lib/router');
/** {@link RPC} */
module.exports.RPC = require('./lib/rpc');
/** {@link module:kad/contacts} */
module.exports.contacts = require('./lib/contacts');
/** {@link module:kad/transports} */
module.exports.transports = require('./lib/transports');
/** {@link module:kad/hooks} */
module.exports.hooks = require('./lib/hooks');
/** {@link module:kad.storage} */
//module.exports.storage = require('./lib/storage');
/** {@link module:kad/utils} */
module.exports.utils = require('./lib/utils');
/** {@link module:kad/constants} */
module.exports.constants = require('./lib/constants');

/*
 *  Creates the node
 *  Connects to the seeds by interating the seeds array
 *  Returns the peer object
 */



module.exports.create = function (options, callback) {
    var async = require('async');
    var node = require('./lib/node');
    
    if (!options.logger || !options.logger.error || !options.logger.info || !options.logger.warn || !options.logger.debug) {
        throw new Error("alogger that implements the error, info, warn and debug methods must be passed to the node");
    }
    
    var transport = options.transport;
    var seeds = options.seeds;
    
    //  create the node
    var peer = node(options);

    if (!seeds || seeds.length == 0) {
        options.logger.warn("there are no seeds defined, the node is not connected to any seeds");
        // There are no seeds, this must be the very first partcicipant of the Streembit network
        return callback(null, peer);
    }
    
    if (!Array.isArray(seeds)) {
        //  must be an array   
        throw new Error("the seeds must be an array");
    }
    
    async.mapSeries(
        seeds,
        function (seed, done) {
            var result = { seed: seed, error: null };
            try {
                peer.connect(seed, function (err) {
                    if (err) {
                        result.error = err;
                        return done(null, result);
                    }
                        
                    var contact = peer._rpc._createContact(seed);
                    peer._router.findNode(contact.nodeID, function (err) {
                        result.error = err;
                        done(null, result);
                    });
                }); 
            }
            catch (e) {
                options.logger.error("peer.connect error: %j", e);
                result.error = e;
                done(null, result);
            }
        },
        function (err, results) {
            if (err || results.length == 0) {
                return callback("Failed to connect to any seed");
            }
            
            var seed_success_count = 0;
            results.forEach(function (item, index, array) {
                if (item.seed && !item.error) {
                    seed_success_count++;
                    options.logger.debug("seed connected: %j", item.seed);
                }
            });
            
            if (!seed_success_count) {
                return callback("Failed to connect to any seed");
            }

            callback(null, peer);
        }
    );

};


module.exports.find_contact = function (node, account, public_key, callback) {
    
    if (!node) {
        return callback("invalid node parameter");
    }
    if (!account) {
        return callback("invalid account parameter");
    }
    if (!public_key) {
        return callback("invalid public_key parameter");
    }
    if (!callback || typeof callback != "function") {
        return callback("invalid callback parameter");
    }
    
    var utils = require('./lib/utils');
    var idbase = account + ':' + public_key;    
    var nodeID = utils.createID(idbase);
    
    var contact = node._router.getContactByNodeID(nodeID);
    if (contact) {
        return callback(null, contact);
    }

    node._router.findNode(nodeID, function (err, contacts) {
        if (err) {
            return callback(err);
        }
        
        if (!contacts || !Array.isArray(contacts) || !contacts.length) {
            return callback();
        }

        callback(null, contacts[0]);
    });

}
