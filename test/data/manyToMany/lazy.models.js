var moose = require("../../../lib"),
    helper = require("./helper"),
    comb = require("comb");

exports.loadModels = function () {
    var ret = new comb.Promise();
    return comb.executeInOrder(helper, moose, function (helper, moose) {
        helper.createTables();
        var Company = moose.addModel("company", {
            static:{
                init:function () {
                    this.manyToMany("employees");
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{
                init:function () {
                    this.manyToMany("companies");
                }
            }
        });


    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
