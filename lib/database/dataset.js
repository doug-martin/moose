var comb = require("comb"), hitch = comb.hitch, errors = require("../errors"), NotImplemented = errors.NotImplemented, Dataset = require("../dataset");

var Database = comb.define(null, {
    instance : {

        /**
         * Retreives a dataset for this database
         *
         * @example
         *  var dataset = DB.dataset();
         *  var dataset2 = DB.dataset("employee");
         *  //select * from employee
         *  dataset.table = "employee"
         *  dataset.all();
         *
         *  //select * from employee
         *  dataset2.all();
         *
         * @param {String} [table] the table the dataset represents
         *
         * @return {moose.Dataset} a dataset
         */
      dataset : function(table){
         return table ? new Dataset({table : table}) : new Dataset();
      }

}});

module.exports = exports = Database;
