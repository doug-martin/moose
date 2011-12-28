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
                    this.oneToMany("employees", {key:{id:"companyId"}});
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{
                init:function () {
                    this.manyToOne("company", {key:{companyId:"id"}});
                }
            }
        });

    });
};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
