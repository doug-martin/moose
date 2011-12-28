var moose = require("../lib"),
    comb = require("comb");

var DB;
exports.loadModels = function () {
    var ret = new comb.Promise();
    DB = moose.connect("mysql://test:testpass@localhost:3306/test?maxConnections=100");
    return comb.executeInOrder(DB, moose, function (db, moose) {
        db.forceCreateTable("employee", function () {
            this.primaryKey("id");
            this.firstname("string", {size:20, allowNull:false});
            this.lastname("string", {size:20, allowNull:false});
            this.midinitial("char", {size:1});
            this.position("integer");
            this.gender("enum", {elements:["M", "F"]});
            this.street("string", {size:50, allowNull:false});
            this.city("string", {size:20, allowNull:false});
        });
        return moose.addModel("employee");
    });
};


exports.dropModels = function () {
    return comb.executeInOrder(moose, DB, function (moose, db) {
        db.forceDropTable("employee");
        moose.disconnect()
    });
};