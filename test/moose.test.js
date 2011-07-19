var vows = require('vows'),
        assert = require('assert'),
        moose = require("index"),
        comb = require("comb");


var ret = (module.exports = exports = new comb.Promise());
var suite = vows.describe("moose");

suite.addBatch({
    "it should create a connection" : {

        topic : function(){
            moose.createConnection({user : "test", password : "testpass", database : 'test'});
            return moose;
        },

        "and return a connection object" : function(topic){
            a
        },

        "and allow queries" : function(){}
    }
});

suite.run({reporter : require("vows/reporters/spec")}, function(){
    helper.dropModels().then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"))
});
