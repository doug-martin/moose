var moose = require("../../../lib"),
    helper = require("./helper"),
    comb = require("comb");

exports.loadModels = function () {
    var ret = new comb.Promise();
    return comb.executeInOrder(helper, moose, function (helper, moose) {
        helper.createTables();
        var Works = moose.addModel("works", {
            static:{
                init:function () {
                    this.manyToOne("employee", {key:"employeeId"});
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{
                init:function () {
                    this.oneToOne("works", {key:"employeeId"});
                }
            }
        });
    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
