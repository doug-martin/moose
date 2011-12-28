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
                    this.manyToMany("employees", {fetchType:this.fetchType.EAGER});
                    this.manyToMany("omahaEmployees", {model:"employee", fetchType:this.fetchType.EAGER}, function (ds) {
                        return ds.filter(sql.identifier("city").ilike("omaha"));
                    });
                    this.manyToMany("lincolnEmployees", {model:"employee", fetchType:this.fetchType.EAGER}, function (ds) {
                        return ds.filter(sql.identifier("city").ilike("lincoln"));
                    });
                }
            }
        });
        var Employee = moose.addModel("employee", {
            static:{
                init:function () {
                    this.manyToMany("companies", {fetchType:this.fetchType.EAGER});
                }
            }
        });

    });

};


exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};
