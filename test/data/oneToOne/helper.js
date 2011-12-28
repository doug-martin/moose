var moose = require("../../../lib"),
    comb = require("comb");

var DB;
exports.createTables = function (underscore) {
    underscore = underscore === true;
    return moose.connectAndExecute("mysql://test:testpass@localhost:3306/test",
        function (db) {
            db.forceDropTable(["works", "employee"]);
            db.createTable("employee", function () {
                this.primaryKey("id");
                this[underscore ? "first_name" : "firstname"]("string", {size:20, allowNull:false});
                this[underscore ? "last_name" : "lastname"]("string", {size:20, allowNull:false});
                this[underscore ? "mid_initial" : "midinitial"]("char", {size:1});
                this.position("integer");
                this.gender("enum", {elements:["M", "F"]});
                this.street("string", {size:50, allowNull:false});
                this.city("string", {size:20, allowNull:false});
            });
            db.createTable("works", function (table) {
                this.primaryKey("id");
                this[underscore ? "company_name" : "companyName"]("string", {size:20, allowNull:false});
                this.salary("double", {size:[20, 8], allowNull:false})
                this.foreignKey(underscore ? "employee_id" : "employeeId", "employee", {key:"id"});
            });
        }).addCallback(function (db) {
            DB = db;
        });
};


exports.dropTableAndDisconnect = function () {
    return comb.executeInOrder(moose, DB, function (moose, db) {
        db.dropTable(["works", "employee"]);
        moose.disconnect()
    });
};