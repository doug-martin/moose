var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../lib"),
        comb = require("comb"),
        hitch = comb.hitch,
        helper = require("../data/timestampPlugin/timestamp.updateOnCreate.models");

helper.loadModels().then(function() {
    Employee = moose.getModel("employee");
    var suite = vows.describe("TimeStampPlugin updateOnCreate");

    suite.addBatch({

        "when creating an employee" : {
            topic : function() {
                Employee.save({
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"
                }).then(hitch(this, function(e) {
                    //force reload
                    e.reload().then(hitch(this, "callback", null));
                }));
            },

            "the updated time stamp should be set" : function(topic) {
                assert.isNotNull(topic.updated);
                assert.isNotNull(topic.created);
                assert.deepEqual(topic.updated, topic.created);
                assert.instanceOf(topic.updated, moose.SQL.DateTime);
                assert.instanceOf(topic.created, moose.SQL.DateTime);
            }
        }
    });

    suite.run({reporter : require("vows").reporter.spec}, function() {
        helper.dropModels();
    });
});