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
                    this.manyToOne("employee", {fetchType:this.fetchType.EAGER});
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{
                init:function () {
                    this.oneToOne("works", {fetchType:this.fetchType.EAGER}, function (ds) {
                        return ds.filter(function () {
                            return this.salary.gte(100000.00);
                        });
                    });
                }
            }
        });
    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};