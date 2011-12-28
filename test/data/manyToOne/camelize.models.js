var moose = require("../../../lib"),
    helper = require("./helper"),
    comb = require("comb");

exports.loadModels = function () {
    var ret = new comb.Promise();
    return comb.executeInOrder(helper, moose, function (helper, moose) {
        helper.createTables(true);
        var Company = moose.addModel("company", {
            static:{

                identifierOutputMethod:"camelize",

                identifierInputMethod:"underscore",

                init:function () {
                    this.oneToMany("employees");
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{

                identifierOutputMethod:"camelize",

                identifierInputMethod:"underscore",

                init:function () {
                    this.manyToOne("company");
                }
            }
        });
    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
