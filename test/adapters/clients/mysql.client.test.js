var vows = require('vows'),
        assert = require('assert'),
        comb = require("comb"),
        moose = require("index"),
        Mysql = moose.adapters.mysql,
        Client = Mysql.client;


var ret = (module.exports = exports = new comb.Promise());
var suite = vows.describe("Mysql Client");

suite.addBatch({
    "should return a connection " : {
        topic : function() {
            return  new Client({
                maxConnections : 1,
                minConnections : 1,
                user : "test",
                password : "testpass",
                database : 'test'
            });
        },

        "it should allow me to create a client " : function(topic) {
            var query = topic.getConnection();
            assert.isNotNull(query);
            assert.isFunction(query.query);
        },

        "it should close all connections" : function(topic) {
            topic.close().then(function(){
                console.log("HELLO")
              console.log(topic.getConnection());
            })

        }
    }
});

suite.run({reporter : require("vows/reporters/spec")}, comb.hitch(ret, "callback"));