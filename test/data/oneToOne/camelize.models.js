var moose = require("../../../lib"),
    helper = require("./helper"),
    comb = require("comb");

exports.loadModels = function () {
    var ret = new comb.Promise();
    return comb.executeInOrder(helper, moose, function (helper, moose) {
        helper.createTables(true);
        var Works = moose.addModel("works", {
            static:{

                camelize:true,

                init:function () {
                    this.manyToOne("employee");
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{

                camelize:true,

                init:function () {
                    this.oneToOne("works");
                }
            }
        });
    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
