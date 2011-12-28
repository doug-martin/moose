var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {

};

exports.down = function() {
    moose.dropTable("employee");
};