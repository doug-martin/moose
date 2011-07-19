var comb = require("comb"),
        hitch = comb.hitch,
		logging = comb.logging,
		Logger = logging.Logger,
        util = require('util'),
        Promise = comb.Promise,
        PromiseList = comb.PromiseList;

var moose, adapter;

/**
 * @class Wrapper for {@link SQL} adpaters to allow execution functions such as:
 * <ul>
 *     <li>forEach</li>
 *     <li>one</li>
 *     <li>all</li>
 *     <li>first</li>
 *     <li>last</li>
 *     <li>all</li>
 *     <li>save</li>
 * </ul>
 *
 * This class should be used insead of SQL directly, becuase:
 * <ul>
 *     <li>Allows for Model creation if needed</li>
 *     <li>Handles the massaging of data to make the use of results easier.</li>
 *     <li>Closing of database connections</li>
 * </ul>
 * @name Dataset
 * @augments SQL
 *
 *
 */

var LOGGER = Logger.getLogger("moose.Dataset");

var Dataset = comb.define(null, {
    instance : {

        /**
         * Save values to a table.
         *
         * </br>
         * <b>This should not be used directly</b>
         *
         * @param {Function} [callback] executed with the row
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with results or the error if one occurs.
         */
        save : function(vals, loadId, callback, errback) {
            var retPromise = new Promise();
            adapter.save(this.table, vals, this.db).addCallback(hitch(this, function(results) {
                if (loadId) {
                    retPromise.callback(results.insertId);
                } else {
                    retPromise.callback(results);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        update : function(){},

        "delete" : function(){}

    }
}).export(module);
