var moose = require("../../../lib"),
    comb = require("comb");

var DB;
exports.createTables = function (useAt) {
    useAt = comb.isBoolean(useAt) ? useAt : false;
    return moose.connectAndExecute("mysql://test:testpass@localhost:3306/test",
        function (db) {
            db.forceDropTable(["employee"]);
            db.createTable("employee", function () {
                this.primaryKey("id");
                this.firstname("string", {size:20, allowNull:false});
                this.lastname("string", {size:20, allowNull:false});
                this.midinitial("char", {size:1});
                this.position("integer");
                this.gender("enum", {elements:["M", "F"]});
                this.street("string", {size:50, allowNull:false});
                this.city("string", {size:20, allowNull:false});
                this[useAt ? "updatedAt" : "updated"]("datetime");
                this[useAt ? "createdAt" : "created"]("datetime");
            });
        }).addCallback(function (db) {
            DB = db;
        });
};


exports.dropTableAndDisconnect = function () {
    return comb.executeInOrder(moose, DB, function (moose, db) {
        db.forceDropTable("employee");
        moose.disconnect()
    });
};