var moose = require("../../../lib"),
    sql = moose.SQL,
    helper = require("./helper"),
    comb = require("comb");

exports.loadModels = function () {
    var ret = new comb.Promise()
    return comb.executeInOrder(helper, moose, function (helper, moose) {
        helper.createTables();
        var Company = moose.addModel("company", {
            static:{
                init:function () {
                    this.oneToMany("employees");
                    this.oneToMany("omahaEmployees", {model:"employee"}, function (ds) {
                        return ds.filter(sql.identifier("city").ilike("omaha"));
                    });
                    this.oneToMany("lincolnEmployees", {model:"employee"}, function (ds) {
                        return ds.filter(sql.identifier("city").ilike("lincoln"));
                    });
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{
                init:function () {
                    this.manyToOne("company");
                }
            }
        });
        //define associations

    });

};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
