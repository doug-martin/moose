var moose = require("../../../lib"),
    helper = require("./helper"),
    comb = require("comb");

exports.loadModels = function () {
    var ret = new comb.Promise();
    return comb.executeInOrder(helper, moose, function (helper, moose) {
        helper.createTables();
        var Employee = moose.addModel("employee", {
            plugins:[moose.plugins.TimeStampPlugin]
        });
        Employee.timestamp();
    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
