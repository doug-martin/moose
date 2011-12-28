var moose = require("../lib"),
    comb = require("comb"),
    helper = require("./helper");


var total = 1000;
var insert = function () {
    var ret = new comb.Promise();
    helper.loadModels().then(function (Employee) {
        var start = +new Date, inserts = 0;
        var promises = [];
        for (var i = 0; i < total; i++) {
            promises.push(new Employee({
                firstname:"First " + i,
                lastname:"Last " + i,
                midinitial:null,
                gender:i % 2 ? "M" : "F",
                street:i + " nowhere st.",
                city:"NOWHERE"
            }).save());
        }
        new comb.PromiseList(promises).then(function () {
            var duration = (+new Date - start) / total,
                insertsPerSecond = i / duration;
            console.log('%d inserts / second', insertsPerSecond.toFixed(2));
            console.log('%d ms', +new Date - start);
            helper.dropModels().then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));;
        });
    });
    return ret;
};

var insertBatch = function () {
    var ret = new comb.Promise();
    helper.loadModels().then(function (Employee) {
        var employees = [];
        for (var i = 0; i < total; i++) {
            employees.push({
                firstname:"First " + i,
                lastname:"Last " + i,
                midinitial:null,
                gender:i % 2 ? "M" : "F",
                street:i + " nowhere st.",
                city:"NOWHERE"
            });
        }
        var start = +new Date, inserts = 0;
        //this inserts raw items in a single statement
        Employee.multiInsert(employees).then(function () {
            var duration = (+new Date - start) / total,
                insertsPerSecond = i / duration;
            console.log('%d inserts / second', insertsPerSecond.toFixed(2));
            console.log('%d ms', +new Date - start);
            helper.dropModels().then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
        });
    });
    return ret;
};

insert().both(insertBatch);